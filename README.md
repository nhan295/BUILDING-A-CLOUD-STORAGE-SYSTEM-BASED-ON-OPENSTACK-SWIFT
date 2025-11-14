# Hướng dẫn Triển khai OpenStack Swift với Keystone

## Tổng quan kiến trúc
- **Proxy Node**: Chạy Swift Proxy Server và Keystone (xác thực)
- **Storage Nodes**: 2 node lưu trữ dữ liệu với replication factor = 2

---

## PHẦN 1: CẤU HÌNH PROXY NODE

### 1. Cài đặt các gói cần thiết

```bash
sudo apt update
sudo apt install -y \
  swift swift-proxy python3-swiftclient \
  python3-keystoneclient python3-keystonemiddleware \
  memcached python3-memcache rsync \
  mariadb-server python3-pymysql \
  apache2 libapache2-mod-wsgi-py3 keystone
```

---

### 2. Cấu hình MariaDB

#### 2.1. Bảo mật MariaDB
```bash
sudo mysql_secure_installation
```

Thực hiện các bước:
- Set root password
- Remove anonymous users
- Disallow remote root login
- Remove test database

#### 2.2. Tạo database cho Keystone
```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE keystone;
GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'localhost' IDENTIFIED BY 'KEYSTONE_PASS';
FLUSH PRIVILEGES;
EXIT;
```

⚠️ **Lưu ý**: Thay `KEYSTONE_PASS` bằng mật khẩu thực tế của bạn.

---

### 3. Cấu hình Keystone

#### 3.1. Chỉnh sửa file cấu hình
```bash
sudo nano /etc/keystone/keystone.conf
```

Thêm/sửa các dòng sau:

```ini
[database]
connection = mysql+pymysql://keystone:KEYSTONE_PASS@localhost/keystone

[token]
provider = fernet
```

#### 3.2. Khởi tạo database và tạo keys
```bash
# Đồng bộ database
sudo su -s /bin/sh -c "keystone-manage db_sync" keystone

# Tạo Fernet keys
sudo keystone-manage fernet_setup --keystone-user keystone --keystone-group keystone
sudo keystone-manage credential_setup --keystone-user keystone --keystone-group keystone

# Bootstrap Keystone
sudo keystone-manage bootstrap --bootstrap-password ADMIN_PASS \
  --bootstrap-admin-url http://192.168.10.101:5000/v3/ \
  --bootstrap-internal-url http://192.168.10.101:5000/v3/ \
  --bootstrap-public-url http://192.168.10.101:5000/v3/ \
  --bootstrap-region-id RegionOne
```

⚠️ **Thay đổi**:
- `ADMIN_PASS`: Mật khẩu admin Keystone
- `192.168.10.101`: IP của Proxy Node

#### 3.3. Khởi động Apache
```bash
sudo systemctl restart apache2
sudo systemctl enable apache2
```

---

### 4. Tạo file môi trường xác thực

```bash
cat << EOF | sudo tee ~/admin-openrc.sh
export OS_USERNAME=admin
export OS_PASSWORD=ADMIN_PASS
export OS_PROJECT_NAME=admin
export OS_USER_DOMAIN_NAME=Default
export OS_PROJECT_DOMAIN_NAME=Default
export OS_AUTH_URL=http://192.168.10.101:5000/v3
export OS_IDENTITY_API_VERSION=3
EOF
```

Load biến môi trường:
```bash
source ~/admin-openrc.sh
```

Kiểm tra kết nối Keystone:
```bash
openstack token issue
```

---

### 5. Tạo Project và User cho Swift

```bash
# Tạo project
openstack project create --domain default swiftproject

# Tạo user
openstack user create --domain default --password SWIFT_PASS swiftuser

# Tạo role member
openstack role create member

# Gán role cho user
openstack role add --project swiftproject --user swiftuser member
```

---

### 6. Cấu hình Memcached

```bash
sudo nano /etc/memcached.conf
```

Sửa dòng để lắng nghe trên tất cả interface:
```
-l 0.0.0.0
```

Khởi động Memcached:
```bash
sudo systemctl restart memcached
sudo systemctl enable memcached
```

---

### 7. Cấu hình Swift Proxy Server

```bash
sudo nano /etc/swift/proxy-server.conf
```

Nội dung cấu hình:

```ini
[DEFAULT]
bind_port = 8080
user = swift
swift_dir = /etc/swift

[pipeline:main]
pipeline = catch_errors gatekeeper healthcheck proxy-logging cache authtoken keystoneauth proxy-logging proxy-server

[app:proxy-server]
use = egg:swift#proxy
allow_account_management = true
account_autocreate = true

[filter:authtoken]
use = egg:keystonemiddleware#auth_token
www_authenticate_uri = http://192.168.10.101:5000
auth_url = http://192.168.10.101:5000
memcached_servers = 127.0.0.1:11211
auth_type = password
project_domain_name = Default
user_domain_name = Default
project_name = admin
username = admin
password = ADMIN_PASS
delay_auth_decision = true

[filter:keystoneauth]
use = egg:swift#keystoneauth
operator_roles = admin,member

[filter:catch_errors]
use = egg:swift#catch_errors

[filter:gatekeeper]
use = egg:swift#gatekeeper

[filter:healthcheck]
use = egg:swift#healthcheck

[filter:proxy-logging]
use = egg:swift#proxy_logging

[filter:cache]
use = egg:swift#memcache
memcache_servers = 127.0.0.1:11211
```

---

## PHẦN 2: CẤU HÌNH STORAGE NODES (Áp dụng cho cả 2 node)

### 1. Cài đặt gói cần thiết

```bash
sudo apt update
sudo apt install xfsprogs rsync swift swift-account swift-container swift-object -y
```

---

### 2. Chuẩn bị ổ đĩa lưu trữ

#### 2.1. Kiểm tra disk
```bash
lsblk
```

Giả sử disk mới là `/dev/sdb`.

#### 2.2. Tạo filesystem XFS
```bash
sudo mkfs.xfs /dev/sdb
```

#### 2.3. Tạo thư mục mount
```bash
sudo mkdir -p /srv/node/sdb
```

#### 2.4. Mount disk
```bash
sudo mount /dev/sdb /srv/node/sdb
```

#### 2.5. Cấu hình auto-mount
```bash
echo "/dev/sdb /srv/node/sdb xfs noatime,nodiratime,nobarrier,logbufs=8 0 2" | sudo tee -a /etc/fstab
```

---

### 3. Cấu hình rsync

```bash
sudo nano /etc/rsyncd.conf
```

Nội dung:

```ini
uid = swift
gid = swift
log file = /var/log/rsyncd.log
pid file = /var/run/rsyncd.pid
address = 192.168.10.102  # Thay IP cho từng storage node

[account]
path = /srv/node/
read only = false
write only = false

[container]
path = /srv/node/
read only = false
write only = false

[object]
path = /srv/node/
read only = false
write only = false
```

Enable rsync:
```bash
sudo systemctl enable rsync --now
```

---

### 4. Cấu hình Swift Services

Cấu hình cho 3 service: account, container, object

#### 4.1. Account Server
```bash
sudo nano /etc/swift/account-server.conf
```

```ini
[DEFAULT]
bind_ip = 0.0.0.0
bind_port = 6202
user = swift
swift_dir = /etc/swift
devices = /srv/node
mount_check = true

[pipeline:main]
pipeline = healthcheck recon account-server

[app:account-server]
use = egg:swift#account

[filter:healthcheck]
use = egg:swift#healthcheck

[filter:recon]
use = egg:swift#recon
recon_cache_path = /var/cache/swift

[account-replicator]
vm_test_mode = no
```

#### 4.2. Container Server
```bash
sudo nano /etc/swift/container-server.conf
```

```ini
[DEFAULT]
bind_ip = 0.0.0.0
bind_port = 6201
user = swift
swift_dir = /etc/swift
devices = /srv/node
mount_check = true

[pipeline:main]
pipeline = healthcheck recon container-server

[app:container-server]
use = egg:swift#container

[filter:healthcheck]
use = egg:swift#healthcheck

[filter:recon]
use = egg:swift#recon
recon_cache_path = /var/cache/swift

[container-replicator]
vm_test_mode = no
```

#### 4.3. Object Server
```bash
sudo nano /etc/swift/object-server.conf
```

```ini
[DEFAULT]
bind_ip = 0.0.0.0
bind_port = 6200
user = swift
swift_dir = /etc/swift
devices = /srv/node
mount_check = true

[pipeline:main]
pipeline = healthcheck recon object-server

[app:object-server]
use = egg:swift#object

[filter:healthcheck]
use = egg:swift#healthcheck

[filter:recon]
use = egg:swift#recon
recon_cache_path = /var/cache/swift

[object-replicator]
vm_test_mode = no
```

---

### 5. Phân quyền thư mục

```bash
sudo chown -R swift:swift /srv/node
sudo mkdir -p /var/cache/swift
sudo chown -R swift:swift /var/cache/swift
```

---

## PHẦN 3: TẠO VÀ PHÂN PHỐI RING FILES (Trên Proxy Node)

### 1. Tạo Ring Builders

```bash
cd /etc/swift

# Xóa ring cũ (nếu có)
sudo rm -f *.builder *.ring.gz

# Tạo builders với 2 replicas
sudo swift-ring-builder account.builder create 12 2 1
sudo swift-ring-builder container.builder create 12 2 1
sudo swift-ring-builder object.builder create 12 2 1
```

---

### 2. Thêm Storage Nodes vào Ring

```bash
# Storage Node 1 (192.168.10.102)
sudo swift-ring-builder account.builder add --region 1 --zone 1 --ip 192.168.10.102 --port 6202 --device sdb --weight 100
sudo swift-ring-builder container.builder add --region 1 --zone 1 --ip 192.168.10.102 --port 6201 --device sdb --weight 100
sudo swift-ring-builder object.builder add --region 1 --zone 1 --ip 192.168.10.102 --port 6200 --device sdb --weight 100

# Storage Node 2 (192.168.10.103)
sudo swift-ring-builder account.builder add --region 1 --zone 2 --ip 192.168.10.103 --port 6202 --device sdb --weight 100
sudo swift-ring-builder container.builder add --region 1 --zone 2 --ip 192.168.10.103 --port 6201 --device sdb --weight 100
sudo swift-ring-builder object.builder add --region 1 --zone 2 --ip 192.168.10.103 --port 6200 --device sdb --weight 100
```

---

### 3. Rebalance Rings

```bash
sudo swift-ring-builder account.builder rebalance
sudo swift-ring-builder container.builder rebalance
sudo swift-ring-builder object.builder rebalance
```

---

### 4. Tạo file swift.conf

```bash
sudo nano /etc/swift/swift.conf
```

Nội dung (tạo hash ngẫu nhiên bằng `openssl rand -hex 16`):

```ini
[swift-hash]
swift_hash_path_suffix = changeme_suffix
swift_hash_path_prefix = changeme_prefix

[storage-policy:0]
name = Policy-0
default = yes
```

⚠️ **Thay `changeme_suffix` và `changeme_prefix` bằng chuỗi ngẫu nhiên**

---

### 5. Copy ring files đến Storage Nodes

```bash
# Copy đến Storage Node 1
scp /etc/swift/account.ring.gz username@192.168.10.102:/tmp/
scp /etc/swift/container.ring.gz username@192.168.10.102:/tmp/
scp /etc/swift/object.ring.gz username@192.168.10.102:/tmp/
scp /etc/swift/swift.conf username@192.168.10.102:/tmp/

# Copy đến Storage Node 2
scp /etc/swift/account.ring.gz username@192.168.10.103:/tmp/
scp /etc/swift/container.ring.gz username@192.168.10.103:/tmp/
scp /etc/swift/object.ring.gz username@192.168.10.103:/tmp/
scp /etc/swift/swift.conf username@192.168.10.103:/tmp/
```

---

## PHẦN 4: HOÀN TẤT CẤU HÌNH STORAGE NODES

### Trên mỗi Storage Node, thực hiện:

```bash
# Di chuyển ring files
sudo mv /tmp/*.ring.gz /etc/swift/
sudo mv /tmp/swift.conf /etc/swift/
sudo chown swift:swift /etc/swift/*.ring.gz /etc/swift/swift.conf

# Enable và start services
sudo systemctl enable swift-account swift-container swift-object
sudo systemctl start swift-account swift-container swift-object

# Enable replication services
sudo systemctl enable --now swift-account-replicator swift-account-auditor swift-account-reaper
sudo systemctl enable --now swift-container-replicator swift-container-auditor swift-container-updater
sudo systemctl enable --now swift-object-replicator swift-object-auditor swift-object-updater swift-object-reconstructor
```

---

## PHẦN 5: ĐĂNG KÝ SWIFT VỚI KEYSTONE (Trên Proxy Node)

### 1. Tạo Swift Service

```bash
source ~/admin-openrc.sh

openstack service create --name swift --description "OpenStack Object Storage" object-store
```

---

### 2. Tạo Endpoints

```bash
# Public endpoint
openstack endpoint create --region RegionOne object-store public http://192.168.10.101:8080/v1/AUTH_%\(tenant_id\)s

# Internal endpoint
openstack endpoint create --region RegionOne object-store internal http://192.168.10.101:8080/v1/AUTH_%\(tenant_id\)s

# Admin endpoint
openstack endpoint create --region RegionOne object-store admin http://192.168.10.101:8080/v1
```

---

### 3. Khởi động Swift Proxy

```bash
sudo systemctl enable --now swift-proxy
sudo systemctl restart swift-proxy
```

---

## PHẦN 6: KIỂM TRA HỆ THỐNG

### 1. Kiểm tra trên Proxy Node

```bash
# Test proxy server config
sudo swift-proxy-server /etc/swift/proxy-server.conf -v

# Kiểm tra MD5 của rings
sudo swift-recon --md5

# Kiểm tra disk usage
sudo swift-recon --diskusage

# Kiểm tra replication
sudo swift-recon --replication

# Kiểm tra tất cả
sudo swift-recon --all
```

---

### 2. Kiểm tra Keystone

```bash
# List services
openstack service list

# List endpoints
openstack endpoint list

# List users
openstack user list

# List projects
openstack project list
```

---

### 3. Test xác thực và upload

```bash
# Xác thực với Swift
swift -V 3 \
  --os-auth-url http://192.168.10.101:5000/v3 \
  --os-username swiftuser \
  --os-password SWIFT_PASS \
  --os-project-name swiftproject \
  --os-user-domain-name Default \
  --os-project-domain-name Default \
  stat

# Tạo container
swift -V 3 \
  --os-auth-url http://192.168.10.101:5000/v3 \
  --os-username swiftuser \
  --os-password SWIFT_PASS \
  --os-project-name swiftproject \
  --os-user-domain-name Default \
  --os-project-domain-name Default \
  post test-container

# Upload file
swift -V 3 \
  --os-auth-url http://192.168.10.101:5000/v3 \
  --os-username swiftuser \
  --os-password SWIFT_PASS \
  --os-project-name swiftproject \
  --os-user-domain-name Default \
  --os-project-domain-name Default \
  upload test-container testfile.txt
```

---

## XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: Recon cache không tồn tại

```bash
sudo mkdir -p /var/cache/swift
sudo chown -R swift:swift /var/cache/swift
sudo chmod 755 /var/cache/swift
sudo systemctl restart swift-account swift-container swift-object
```

---

### Lỗi: Ring không đồng bộ

```bash
# Trên Proxy node
sudo swift-recon --md5

# Nếu MD5 khác nhau, copy lại ring files từ Proxy sang Storage nodes
```

---

### Lỗi: Service không start

```bash
# Kiểm tra log
tail -f /var/log/syslog | grep swift

# Kiểm tra status
sudo systemctl status swift-proxy
sudo systemctl status swift-account
sudo systemctl status swift-container
sudo systemctl status swift-object
```

---

## THÔNG TIN HỆ THỐNG

### Địa chỉ IP
- **Proxy Node**: 192.168.10.101
- **Storage Node 1**: 192.168.10.102
- **Storage Node 2**: 192.168.10.103

### Ports
- **Keystone**: 5000
- **Swift Proxy**: 8080
- **Account Service**: 6202
- **Container Service**: 6201
- **Object Service**: 6200
---

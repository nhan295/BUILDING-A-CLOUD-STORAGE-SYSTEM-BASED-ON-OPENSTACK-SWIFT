import React, { useState, useEffect } from 'react';
import { Users, Trash2, Search, Shield, UserCheck } from 'lucide-react';
import { getUsers } from '../logic/UserManagement.js'; // 
import '../style/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getUsers();
        // Map dữ liệu API về dạng dễ dùng
        const formattedUsers = fetchedUsers.map((u, index) => ({
          userId: u.id || index + 1,
          username: u.name,
          role: u.roles?.[0] || 'user'
        }));
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Lỗi khi load user:', error);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa user này?')) {
      setUsers(users.filter(user => user.userId !== userId));
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="icon" />;
      case 'moderator': return <UserCheck className="icon" />;
      default: return <Users className="icon" />;
    }
  };

  return (
    <div className="container">
      <div className="header-card">
        <div className="header-content">
          <div className="header-icon">
            <Users className="icon-large" />
          </div>
          <div>
            <h1 className="title">Quản lý User</h1>
            <p className="subtitle">Quản lý người dùng trong hệ thống</p>
          </div>
        </div>
      </div>

      <div className="search-card">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo username hoặc role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Role</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  <Users className="empty-icon" />
                  <p>Không tìm thấy user nào</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <span className="user-id">#{user.userId}</span>
                  </td>
                  <td>
                    <span className="username">{user.username}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${user.role}`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(user.userId)}
                      className="btn-delete"
                    >
                      <Trash2 className="icon" />
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;

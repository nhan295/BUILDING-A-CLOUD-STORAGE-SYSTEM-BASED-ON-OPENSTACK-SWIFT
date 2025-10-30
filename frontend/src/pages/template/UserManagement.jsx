import React, { useState, useEffect } from 'react';
import { Users, Trash2, Search, Shield, UserCheck, Plus, X, Mail, Key } from 'lucide-react';
import { getUsers } from '../logic/UserManagement.js';
import { getStoredRoles, getStoredProjectInfo } from '../../pages/logic/Login';
import '../style/UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [assignData, setAssignData] = useState({ projectName: '', role: 'member' });

  const roles = getStoredRoles() || [];
  const role = roles.includes('admin') ? 'admin' : 'member';
  const projectInfo = getStoredProjectInfo();
  const projectName = projectInfo?.name || 'Unknown Project';

  const isSuperAdmin = role === 'admin' && projectName.toLowerCase() === 'admin';

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (isSuperAdmin) {
          const mockSystemUsers = [
            { id: 1, name: 'admin@system.com', roles: ['admin'], projects: ['Admin', 'Project A', 'Project B'] },
            { id: 2, name: 'john.doe@company.com', roles: ['admin'], projects: ['Project A'] },
            { id: 3, name: 'jane.smith@company.com', roles: ['member'], projects: ['Project A', 'Project C'] },
            { id: 4, name: 'bob.wilson@company.com', roles: ['admin'], projects: ['Project B'] },
            { id: 5, name: 'alice.jones@company.com', roles: ['member'], projects: ['Project B', 'Project D'] },
            { id: 6, name: 'charlie.brown@company.com', roles: ['member'], projects: ['Project C'] },
            { id: 7, name: 'david.lee@company.com', roles: ['admin'], projects: ['Project D'] },
            { id: 8, name: 'emma.davis@company.com', roles: ['member'], projects: ['Project A', 'Project B'] },
          ];

          const formattedUsers = mockSystemUsers.map(u => ({
            userId: u.id,
            username: u.name,
            role: u.roles[0],
            projects: u.projects,
          }));
          setUsers(formattedUsers);
        } else {
          const fetchedUsers = await getUsers();
          const formattedUsers = fetchedUsers.map((u, index) => ({
            userId: u.id || index + 1,
            username: u.name,
            role: u.roles?.[0] || 'user',
            projects: u.projects || [],
          }));
          setUsers(formattedUsers);
        }
      } catch (error) {
        console.error('Error while loading users:', error);
      }
    };

    fetchUsers();
  }, [isSuperAdmin]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const mockNewUser = {
      userId: users.length + 1,
      username: newUser.username,
      role: 'member',
      projects: [],
    };

    setUsers([...users, mockNewUser]);
    alert('Tạo user thành công!');
    setShowCreateModal(false);
    setNewUser({ username: '', password: '' });
  };

  const handleAssignToProject = async (e) => {
    e.preventDefault();
    if (!assignData.projectName) {
      alert('Vui lòng nhập tên project');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.userId === selectedUser.userId) {
        return {
          ...u,
          projects: [...(u.projects || []), assignData.projectName],
          role: assignData.role,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    alert(`Đã gán ${selectedUser.username} vào project "${assignData.projectName}" với vai trò ${assignData.role}`);
    setShowAssignModal(false);
    setAssignData({ projectName: '', role: 'member' });
    setSelectedUser(null);
  };

  const handleDelete = (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa user này?')) {
      setUsers(users.filter(user => user.userId !== userId));
      alert('Đã xóa user thành công!');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="um-icon" />;
      case 'moderator': return <UserCheck className="um-icon" />;
      default: return <Users className="um-icon" />;
    }
  };

  // Super Admin View
  if (isSuperAdmin) {
    return (
      <div className="um-container">
        <div className="um-header-card">
          <div className="um-header-content">
            <div className="um-header-icon">
              <Users className="um-icon-large" />
            </div>
            <div>
              <h1 className="um-title">System User Management</h1>
              <p className="um-subtitle">
                Quản lý tất cả users trong hệ thống
                <span className="um-badge-sysadmin">System Admin</span>
              </p>
            </div>
            <button className="um-btn-create" onClick={() => setShowCreateModal(true)}>
              <Plus className="um-icon" />
              Tạo User
            </button>
          </div>
        </div>

        <div className="um-search-card">
          <div className="um-search-wrapper">
            <Search className="um-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo username hoặc role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="um-search-input"
            />
          </div>
        </div>

        <div className="um-table-card">
          <table className="um-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="um-empty-state">
                    <Users className="um-empty-icon" />
                    <p>Không tìm thấy user</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId}>
                    <td><span className="um-user-id">#{user.userId}</span></td>
                    <td>
                      <div className="um-user-info">
                        <Mail className="um-user-icon" size={16} />
                        <span className="um-username">{user.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`um-badge um-badge-${user.role}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="um-project-tags">
                        {user.projects?.slice(0, 2).map((proj, idx) => (
                          <span key={idx} className="um-project-tag">{proj}</span>
                        ))}
                        {user.projects?.length > 2 && (
                          <span className="um-project-tag um-more">+{user.projects.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="um-text-right">
                      <button
                        className="um-btn-assign"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignModal(true);
                        }}
                      >
                        <UserCheck className="um-icon" />
                        Gán
                      </button>
                      <button
                        className="um-btn-delete"
                        onClick={() => handleDelete(user.userId)}
                      >
                        <Trash2 className="um-icon" />
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="um-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="um-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="um-modal-header">
                <h2>Tạo User Mới</h2>
                <button className="um-modal-close" onClick={() => setShowCreateModal(false)}>
                  <X className="um-icon" />
                </button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="um-form-group">
                  <label>Username</label>
                  <div className="um-input-with-icon">
                    <Mail className="um-input-icon" size={18} />
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="Nhập email hoặc username"
                      className="um-form-input um-with-icon"
                    />
                  </div>
                </div>
                <div className="um-form-group">
                  <label>Password</label>
                  <div className="um-input-with-icon">
                    <Key className="um-input-icon" size={18} />
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Nhập mật khẩu"
                      className="um-form-input um-with-icon"
                    />
                  </div>
                </div>
                <div className="um-modal-actions">
                  <button type="button" className="um-btn-cancel" onClick={() => setShowCreateModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="um-btn-submit">
                    Tạo User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedUser && (
          <div className="um-modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="um-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="um-modal-header">
                <h2>Gán User vào Project</h2>
                <button className="um-modal-close" onClick={() => setShowAssignModal(false)}>
                  <X className="um-icon" />
                </button>
              </div>
              <form onSubmit={handleAssignToProject}>
                <div className="um-form-group">
                  <label>User</label>
                  <div className="um-user-display">
                    <Mail size={16} /> {selectedUser.username}
                  </div>
                </div>
                <div className="um-form-group">
                  <label>Tên Project</label>
                  <input
                    type="text"
                    value={assignData.projectName}
                    onChange={(e) => setAssignData({ ...assignData, projectName: e.target.value })}
                    placeholder="Nhập tên project"
                    className="um-form-input"
                  />
                </div>
                <div className="um-form-group">
                  <label>Vai trò</label>
                  <select
                    value={assignData.role}
                    onChange={(e) => setAssignData({ ...assignData, role: e.target.value })}
                    className="um-form-input"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="um-modal-actions">
                  <button type="button" className="um-btn-cancel" onClick={() => setShowAssignModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="um-btn-submit">
                    Gán vào Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Project Admin View
  return (
    <div className="um-container">
      <div className="um-header-card">
        <div className="um-header-content">
          <div className="um-header-icon">
            <Users className="um-icon-large" />
          </div>
          <div>
            <h1 className="um-title">User Management</h1>
            <p className="um-subtitle">Danh sách users trong project</p>
          </div>
        </div>
      </div>

      <div className="um-search-card">
        <div className="um-search-wrapper">
          <Search className="um-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo username hoặc role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="um-search-input"
          />
        </div>
      </div>

      <div className="um-table-card">
        <table className="um-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="3" className="um-empty-state">
                  <Users className="um-empty-icon" />
                  <p>Không tìm thấy user</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.userId}>
                  <td><span className="um-user-id">#{user.userId}</span></td>
                  <td>
                    <div className="um-user-info">
                      <Mail className="um-user-icon" size={16} />
                      <span className="um-username">{user.username}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`um-badge um-badge-${user.role}`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

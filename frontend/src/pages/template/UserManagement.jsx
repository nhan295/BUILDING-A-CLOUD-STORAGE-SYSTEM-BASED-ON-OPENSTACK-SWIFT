import React, { useState, useEffect } from 'react';
import { Users, Trash2, Search, Shield, UserCheck, Plus, X, Mail, Key } from 'lucide-react';
import { getUsers, getSysUsers, getProjects, deleteUser, createUser } from '../logic/UserManagement.js';
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
  const [projects, setProjects] = useState([]);

  const roles = getStoredRoles() || [];
  const role = roles.includes('admin') ? 'admin' : 'member';
  const projectInfo = getStoredProjectInfo();
  const projectName = projectInfo?.name || 'Unknown Project';

  const isSuperAdmin = role === 'admin' && projectName.toLowerCase() === 'admin';

  const fetchData = async () => {
    try {
      if (isSuperAdmin) {
        // Fetch both system users and all projects concurrently
        const [sysData, projectRes] = await Promise.all([getSysUsers(), getProjects()]);

        console.log('=== DEBUG sysData ===', sysData);
        console.log('=== DEBUG projects ===', projectRes);

        // Format projects
        let formattedProjects = [];
        if (Array.isArray(projectRes)) {
          formattedProjects = projectRes.map(p => ({
            id: p.id,
            name: p.name
          }));
          setProjects(formattedProjects);
        }

        // Format users
        if (Array.isArray(sysData)) {
          const formattedUsers = sysData.map((u, index) => {
            const projectList = u.projects?.map(p => {
              const roles = p.roles?.filter(r => r !== '(no role)');
              const roleText = roles?.length ? `(${roles.join(', ')})` : '(no role)';
              return `${p.name} ${roleText}`;
            }) || [];

            const allRoles = u.projects?.flatMap(p => p.roles || []) || [];
            let primaryRole = 'unassigned';
            if (allRoles.includes('admin')) primaryRole = 'admin';
            else if (allRoles.includes('ResellerAdmin')) primaryRole = 'reseller';
            else if (allRoles.includes('member')) primaryRole = 'member';

            return {
              userId: u.id || index + 1,
              username: u.name,
              role: primaryRole,
              projects: projectList,
            };
          });

          setUsers(formattedUsers);
        } else {
          console.warn('Unexpected sysData format:', sysData);
        }
      } else {
        // For regular project admin
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
      console.error('Error while loading users/projects:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin]);

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.username || !newUser.password) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const response = await createUser(newUser.username, newUser.password);

      if (response && response.success) {
        const createdUser = response.user || {
          userId: users.length + 1,
          username: newUser.username,
          role: 'unassigned',
          projects: [],
        };

        setUsers(prev => [...prev, createdUser]);
        alert('User created successfully!');
        await fetchData();
      } else {
        alert(response?.message || 'Unable to create user. Please try again.');
      }
    } catch (error) {
      console.error('Error while creating user:', error);
      alert('An error occurred while creating the user.');
    } finally {
      setShowCreateModal(false);
      setNewUser({ username: '', password: '' });
    }
  };

  const handleAssignToProject = async (e) => {
    e.preventDefault();
    if (!assignData.projectName) {
      alert('Please select a project.');
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
    alert(`User "${selectedUser.username}" has been assigned to project "${assignData.projectName}" as ${assignData.role}.`);
    setShowAssignModal(false);
    setAssignData({ projectName: '', role: 'member' });
    setSelectedUser(null);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await deleteUser(userId);
      if (res && res.success) {
        alert('User deleted successfully!');
        setUsers(users.filter(user => user.userId !== userId));
      } else {
        alert('Failed to delete user.');
      }
    } catch (error) {
      console.error('Error while deleting user:', error);
      alert('An error occurred while deleting the user.');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="um-icon" />;
      case 'moderator': return <UserCheck className="um-icon" />;
      default: return <Users className="um-icon" />;
    }
  };

  // ===== Super Admin View =====
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
                Manage all users across the system
                <span className="um-badge-sysadmin">System Admin</span>
              </p>
            </div>
            <button className="um-btn-create" onClick={() => setShowCreateModal(true)}>
              <Plus className="um-icon" />
              Create User
            </button>
          </div>
        </div>

        <div className="um-search-card">
          <div className="um-search-wrapper">
            <Search className="um-search-icon" />
            <input
              type="text"
              placeholder="Search by username or role..."
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
                    <p>No users found</p>
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
                        Assign
                      </button>
                      <button
                        className="um-btn-delete"
                        onClick={() => handleDelete(user.userId)}
                      >
                        <Trash2 className="um-icon" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===== Create User Modal ===== */}
        {showCreateModal && (
          <div className="um-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="um-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="um-modal-header">
                <h2>Create New User</h2>
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
                      placeholder="Enter username"
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
                      placeholder="Enter password"
                      className="um-form-input um-with-icon"
                    />
                  </div>
                </div>
                <div className="um-modal-actions">
                  <button type="button" className="um-btn-cancel" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="um-btn-submit">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== Assign Modal ===== */}
        {showAssignModal && selectedUser && (
          <div className="um-modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="um-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="um-modal-header">
                <h2>Assign User to Project</h2>
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
                  <label>Select Project</label>
                  <select
                    value={assignData.projectName}
                    onChange={(e) => setAssignData({ ...assignData, projectName: e.target.value })}
                    className="um-form-input"
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="um-form-group">
                  <label>Role</label>
                  <select
                    value={assignData.role}
                    onChange={(e) => setAssignData({ ...assignData, role: e.target.value })}
                    className="um-form-input"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                <div className="um-modal-actions">
                  <button type="button" className="um-btn-cancel" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="um-btn-submit">
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== Project Admin View =====
  return (
    <div className="um-container">
      <div className="um-header-card">
        <div className="um-header-content">
          <div className="um-header-icon">
            <Users className="um-icon-large" />
          </div>
          <div>
            <h1 className="um-title">User Management</h1>
            <p className="um-subtitle">List of users in this project</p>
          </div>
        </div>
      </div>

      <div className="um-search-card">
        <div className="um-search-wrapper">
          <Search className="um-search-icon" />
          <input
            type="text"
            placeholder="Search by username or role..."
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
                  <p>No users found</p>
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

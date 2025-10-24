import React, { useState, useEffect } from 'react';
import { Users, Trash2, Search, Shield, UserCheck } from 'lucide-react';
import { getUsers } from '../logic/UserManagement.js';
import '../style/UserManagement.css';

export default function UserManagement ()  {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getUsers();
        // Map API data into a simpler format
        const formattedUsers = fetchedUsers.map((u, index) => ({
          userId: u.id || index + 1,
          username: u.name,
          role: u.roles?.[0] || 'user'
        }));
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error while loading users:', error);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
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
            <h1 className="title">User Management</h1>
            <p className="subtitle">Manage users in the system</p>
          </div>
        </div>
      </div>

      <div className="search-card">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by username or role..."
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
                  <p>No users found</p>
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
                      Delete
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


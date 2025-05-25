import React, { useState, useEffect } from 'react';
import UserService from '../services/userService';
import './TeamMembersManager.css'; // Add your styles

const TeamMembersManager = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = await UserService.getAllUsers();
      setUsers(userData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser.id) {
      setError('You cannot delete your own account.');
      return;
    }

    setDeleteConfirm(user);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setDeleting(true);
      await UserService.deleteUser(deleteConfirm.id);
      
      // Remove user from local state
      setUsers(users.filter(user => user.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setError('');
      
      // Show success message
      alert(`Team member ${deleteConfirm.name} has been deleted successfully.`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await UserService.updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      alert('User role updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You need super admin privileges to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading team members...</div>;
  }

  return (
    <div className="team-members-manager">
      <div className="header">
        <h1>Team Members Management</h1>
        <p>Manage your team members and their roles</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={user.id === currentUser.id ? 'current-user' : ''}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={user.id === currentUser.id}
                    className="role-select"
                  >
                    <option value="member">Member</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  {user.id === currentUser.id ? (
                    <span className="current-user-label">You</span>
                  ) : (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="delete-btn"
                      disabled={deleting}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              <br />
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-cancel"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-delete"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembersManager;

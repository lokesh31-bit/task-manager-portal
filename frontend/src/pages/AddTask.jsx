import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Notification from '../components/Notification';

const AddTask = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Pending');
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Task title is required.';
    }

    if (description.trim().length < 20) {
      newErrors.description = `Description must be at least 20 characters long. Current: ${description.trim().length} chars.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await api.post('/tasks', {
        title: title.trim(),
        description: description.trim(),
        status
      });

      setNotification({
        message: 'Task created successfully! Redirecting...',
        type: 'success'
      });

      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      setErrors({
        api: err.response?.data?.error || 'Failed to create task. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Create New Task</h1>
        <p>Add a new item to your project board</p>
      </div>

      <div className="card task-form-card">
        {errors.api && (
          <div className="form-error" style={{ marginBottom: '1rem', justifyContent: 'center' }}>
            ⚠️ {errors.api}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Task Title</label>
            <input
              type="text"
              id="title"
              className="form-input"
              placeholder="e.g. Implement user login API"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
            {errors.title && <div className="form-error">⚠️ {errors.title}</div>}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="description">Description</label>
              <span style={{ fontSize: '0.8rem', color: description.trim().length >= 20 ? 'var(--success)' : 'var(--text-secondary)' }}>
                {description.trim().length} / 20 chars min
              </span>
            </div>
            <textarea
              id="description"
              className="form-input"
              rows="6"
              placeholder="Provide a detailed description of the task (minimum 20 characters)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              style={{ resize: 'vertical' }}
            />
            {errors.description && <div className="form-error">⚠️ {errors.description}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status">Initial Status</label>
            <select
              id="status"
              className="select-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem 1rem' }}
            >
              <option value="Pending">⏳ Pending</option>
              <option value="In Progress">⚙️ In Progress</option>
            </select>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: '' })}
      />
    </div>
  );
};

export default AddTask;

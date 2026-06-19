import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatCards from '../components/StatCards';
import Notification from '../components/Notification';

const Dashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Query states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch stats separately
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/tasks/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, []);

  // Fetch tasks based on active filters
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks', {
        params: {
          search: debouncedSearch,
          status: statusFilter,
          sort: sortOrder,
          page,
          limit
        }
      });
      setTasks(res.data.tasks);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to fetch tasks.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, sortOrder, page, limit]);

  // Load page data
  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  // Update task status
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setNotification({ message: `Task status updated to "${newStatus}"!`, type: 'success' });
      fetchTasks();
      fetchStats();
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to update status.',
        type: 'error'
      });
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setNotification({ message: 'Task deleted successfully!', type: 'success' });
      
      // If we deleted the last task on the current page, go back a page
      if (tasks.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchTasks();
      }
      fetchStats();
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to delete task.',
        type: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="main-content">
      {/* KPI Stats Cards */}
      <StatCards stats={stats} />

      {/* Control Bar (Search, Status Filter, Sort, Limit) */}
      <div className="controls-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-actions">
          {/* Status Filter */}
          <select 
            className="select-filter" 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Chronological Sorting */}
          <select 
            className="select-filter" 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="DESC">Newest First</option>
            <option value="ASC">Oldest First</option>
          </select>

          {/* Page Limit Selection */}
          <select 
            className="select-filter" 
            value={limit} 
            onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
          >
            <option value="6">6 per page</option>
            <option value="12">12 per page</option>
            <option value="24">24 per page</option>
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Fetching project board tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>No tasks found</h3>
          <p>
            {debouncedSearch || statusFilter 
              ? 'No tasks match your active search or filters. Try resetting them!' 
              : 'Your task board is completely empty! Get started by adding a task.'}
          </p>
          {!debouncedSearch && !statusFilter && (
            <button className="btn btn-primary" onClick={() => navigate('/add-task')}>
              + Create First Task
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task.id} className="card task-card">
                <div className="task-header">
                  <h2 className="task-title">{task.title}</h2>
                  <span className={`badge badge-${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status === 'Pending' ? '⏳' : task.status === 'In Progress' ? '⚙️' : '✅'}{' '}
                    {task.status}
                  </span>
                </div>
                
                <div className="task-date">
                  📅 {formatDate(task.created_at)}
                </div>
                
                <p className="task-desc">{task.description}</p>
                
                <div className="task-footer">
                  <div className="task-actions">
                    {task.status === 'Pending' && (
                      <button 
                        onClick={() => handleStatusChange(task.id, 'In Progress')} 
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        ⚙️ Start
                      </button>
                    )}
                    {task.status !== 'Completed' && (
                      <button 
                        onClick={() => handleStatusChange(task.id, 'Completed')} 
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--success)', boxShadow: 'none' }}
                      >
                        ✅ Complete
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteTask(task.id)} 
                    className="btn btn-danger"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    title="Delete task"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem' }}
              >
                ◀ Previous
              </button>
              
              <span className="page-info">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total tasks)
              </span>
              
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem' }}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: '' })}
      />
    </div>
  );
};

export default Dashboard;

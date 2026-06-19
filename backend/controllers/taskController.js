const Task = require('../models/taskModel');

const taskController = {
  getTasks: async (req, res) => {
    try {
      const userId = req.user.id;
      const { search, status, sort, page, limit } = req.query;

      const result = await Task.findAll(userId, {
        search: search || '',
        status: status || '',
        sort: sort || 'DESC',
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10
      });

      res.status(200).json(result);
    } catch (err) {
      console.error('Get tasks error:', err.message);
      res.status(500).json({ error: 'Internal server error fetching tasks.' });
    }
  },

  getStats: async (req, res) => {
    try {
      const userId = req.user.id;
      const stats = await Task.getStats(userId);
      res.status(200).json(stats);
    } catch (err) {
      console.error('Get stats error:', err.message);
      res.status(500).json({ error: 'Internal server error compiling stats.' });
    }
  },

  createTask: async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, description, status } = req.body;

      // Validation
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Task title is required.' });
      }

      if (!description || description.trim().length < 20) {
        return res.status(400).json({ error: 'Description must be at least 20 characters long.' });
      }

      // Allowed statuses
      const validStatuses = ['Pending', 'In Progress', 'Completed'];
      const initialStatus = status || 'Pending';
      if (!validStatuses.includes(initialStatus)) {
        return res.status(400).json({ error: 'Invalid initial status. Must be Pending, In Progress, or Completed.' });
      }

      const taskId = await Task.create(userId, title.trim(), description.trim(), initialStatus);
      
      res.status(201).json({
        message: 'Task created successfully.',
        task: {
          id: taskId,
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          status: initialStatus,
          created_at: new Date()
        }
      });
    } catch (err) {
      console.error('Create task error:', err.message);
      res.status(500).json({ error: 'Internal server error creating task.' });
    }
  },

  updateTask: async (req, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;
      const { title, description, status } = req.body;

      const existingTask = await Task.findById(taskId, userId);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found or unauthorized.' });
      }

      // Validations if updating specific fields
      if (title !== undefined && (!title || title.trim() === '')) {
        return res.status(400).json({ error: 'Task title cannot be empty.' });
      }

      if (description !== undefined && description.trim().length < 20) {
        return res.status(400).json({ error: 'Description must be at least 20 characters long.' });
      }

      if (status !== undefined) {
        const validStatuses = ['Pending', 'In Progress', 'Completed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Invalid status. Must be Pending, In Progress, or Completed.' });
        }
      }

      await Task.update(taskId, userId, {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        status
      });

      const updatedTask = await Task.findById(taskId, userId);
      res.status(200).json({
        message: 'Task updated successfully.',
        task: updatedTask
      });
    } catch (err) {
      console.error('Update task error:', err.message);
      res.status(500).json({ error: 'Internal server error updating task.' });
    }
  },

  deleteTask: async (req, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;

      const existingTask = await Task.findById(taskId, userId);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found or unauthorized.' });
      }

      await Task.delete(taskId, userId);
      res.status(200).json({ message: 'Task deleted successfully.' });
    } catch (err) {
      console.error('Delete task error:', err.message);
      res.status(500).json({ error: 'Internal server error deleting task.' });
    }
  }
};

module.exports = taskController;

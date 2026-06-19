const { db } = require('../config/db');

const Task = {
  create: async (userId, title, description, status) => {
    const sql = 'INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)';
    const result = await db.execute(sql, [userId, title, description, status || 'Pending']);
    return result.insertId;
  },

  findAll: async (userId, { search = '', status = '', sort = 'DESC', page = 1, limit = 10 } = {}) => {
    let baseSql = 'FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (status) {
      baseSql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      baseSql += ' AND (title LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // First count the total matches for pagination
    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const countResult = await db.query(countSql, params);
    const totalCount = countResult[0] ? countResult[0].total : 0;

    // Sorting
    const sortDirection = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    let dataSql = `SELECT * ${baseSql} ORDER BY created_at ${sortDirection}`;

    // Pagination
    const limitNum = parseInt(limit, 10) || 10;
    const pageNum = parseInt(page, 10) || 1;
    const offsetNum = (pageNum - 1) * limitNum;
    
    dataSql += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;
    const dataParams = [...params];

    const tasks = await db.query(dataSql, dataParams);
    return {
      tasks,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum)
    };
  },

  findById: async (id, userId) => {
    const sql = 'SELECT * FROM tasks WHERE id = ? AND user_id = ?';
    const rows = await db.query(sql, [id, userId]);
    return rows[0] || null;
  },

  update: async (id, userId, { title, description, status }) => {
    // Dynamically build the update fields to allow partial updates
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) return 0;

    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    params.push(id, userId);

    const result = await db.execute(sql, params);
    return result.affectedRows;
  },

  delete: async (id, userId) => {
    const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
    const result = await db.execute(sql, [id, userId]);
    return result.affectedRows;
  },

  getStats: async (userId) => {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM tasks 
      WHERE user_id = ?
    `;
    const rows = await db.query(sql, [userId]);
    const stats = rows[0] || { total: 0, pending: 0, inProgress: 0, completed: 0 };
    
    // SQLite can return null values for SUM if no rows match, normalize them to 0
    return {
      total: parseInt(stats.total, 10) || 0,
      pending: parseInt(stats.pending, 10) || 0,
      inProgress: parseInt(stats.inProgress, 10) || 0,
      completed: parseInt(stats.completed, 10) || 0
    };
  }
};

module.exports = Task;

const express = require('express');
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to protect all task routes
router.use(authMiddleware);

router.get('/', taskController.getTasks);
router.get('/stats', taskController.getStats);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;

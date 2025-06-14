const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601().toDate()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: errors.array() 
    });
  }

  try {
    const task = new Task({
      ...req.body,
      user: req.user._id
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Task Creation Error:', error);
    res.status(500).json({ 
      error: 'Failed to create task',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Not authenticated
 */
router.get('/', auth, async (req, res) => {
  try {
    const match = { user: req.user._id };
    const sort = {};

    if (req.query.status) {
      match.status = req.query.status;
    }
    if (req.query.priority) {
      match.priority = req.query.priority;
    }
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    const tasks = await Task.find(match)
      .sort(sort)
      .exec();

    res.json(tasks);
  } catch (error) {
    console.error('Task Fetch Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a specific task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found',
        details: 'The requested task does not exist or you do not have permission to access it'
      });
    }
    res.json(task);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Invalid task ID',
        details: 'The provided task ID is not valid'
      });
    }
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Task not found
 */
router.put('/:id', [
  auth,
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601().toDate()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: errors.array() 
    });
  }

  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found',
        details: 'The requested task does not exist or you do not have permission to access it'
      });
    }

    Object.keys(req.body).forEach(key => {
      task[key] = req.body[key];
    });

    await task.save();
    res.json(task);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Invalid task ID',
        details: 'The provided task ID is not valid'
      });
    }
    console.error('Task Update Error:', error);
    res.status(500).json({ 
      error: 'Failed to update task',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found',
        details: 'The requested task does not exist or you do not have permission to access it'
      });
    }

    await task.deleteOne();
    res.json({ error: 'Task deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Invalid task ID',
        details: 'The provided task ID is not valid'
      });
    }
    console.error('Task Delete Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete task',
      details: error.message 
    });
  }
});

module.exports = router; 
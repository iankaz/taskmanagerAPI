const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - task
 *             properties:
 *               content:
 *                 type: string
 *               task:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', auth, [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('task').notEmpty().withMessage('Task ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: errors.array() 
    });
  }

  try {
    // Verify task exists and belongs to user
    const task = await Task.findOne({ 
      _id: req.body.task,
      user: req.user._id 
    });

    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found',
        details: 'The specified task does not exist or you do not have access to it'
      });
    }

    const comment = new Comment({
      content: req.body.content,
      task: req.body.task,
      user: req.user._id
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Task not found',
        details: 'The specified task ID is invalid'
      });
    }
    res.status(500).json({ 
      error: 'Failed to create comment',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/comments/task/{taskId}:
 *   get:
 *     summary: Get all comments for a specific task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    // Verify task exists and belongs to user
    const task = await Task.findOne({ 
      _id: req.params.taskId,
      user: req.user._id 
    });

    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found',
        details: 'The specified task does not exist or you do not have access to it'
      });
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.json(comments);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Task not found',
        details: 'The specified task ID is invalid'
      });
    }
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Get a specific comment
 *     tags: [Comments]
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
 *         description: Comment details
 *       404:
 *         description: Comment not found
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id })
      .populate('user', 'name email');

    if (!comment) {
      return res.status(404).json({ 
        error: 'Comment not found',
        details: 'The specified comment does not exist'
      });
    }

    // Verify user has access to the task
    const task = await Task.findOne({ 
      _id: comment.task,
      user: req.user._id 
    });

    if (!task) {
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'You do not have access to this comment'
      });
    }

    res.json(comment);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Comment not found',
        details: 'The specified comment ID is invalid'
      });
    }
    res.status(500).json({ 
      error: 'Failed to fetch comment',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
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
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       404:
 *         description: Comment not found
 */
router.put('/:id', auth, [
  body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: errors.array() 
    });
  }

  try {
    const comment = await Comment.findOne({ _id: req.params.id });

    if (!comment) {
      return res.status(404).json({ 
        error: 'Comment not found',
        details: 'The specified comment does not exist'
      });
    }

    // Only allow the comment author to update it
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'You can only update your own comments'
      });
    }

    comment.content = req.body.content;
    await comment.save();
    res.json(comment);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Comment not found',
        details: 'The specified comment ID is invalid'
      });
    }
    res.status(500).json({ 
      error: 'Failed to update comment',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
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
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id });

    if (!comment) {
      return res.status(404).json({ 
        error: 'Comment not found',
        details: 'The specified comment does not exist'
      });
    }

    // Only allow the comment author to delete it
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'You can only delete your own comments'
      });
    }

    await comment.deleteOne();
    res.json({ error: 'Comment deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Comment not found',
        details: 'The specified comment ID is invalid'
      });
    }
    res.status(500).json({ 
      error: 'Failed to delete comment',
      details: error.message 
    });
  }
});

module.exports = router; 
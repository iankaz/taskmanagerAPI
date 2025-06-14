const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: errors.array() 
    });
  }

  try {
    const category = new Category({
      ...req.body,
      user: req.user._id
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Category already exists',
        details: 'A category with this name already exists for your account'
      });
    }
    res.status(500).json({ 
      error: 'Failed to create category',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories for the authenticated user
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a specific category
 *     tags: [Categories]
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
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });
    
    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found',
        details: 'The specified category does not exist or you do not have access to it'
      });
    }
    
    res.json(category);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Category not found',
        details: 'The specified category ID is invalid'
      });
    }
    res.status(500).json({ 
      error: 'Failed to fetch category',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
router.put('/:id', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('description').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: errors.array() 
    });
  }

  try {
    const category = await Category.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    });

    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found',
        details: 'The specified category does not exist or you do not have access to it'
      });
    }

    Object.assign(category, req.body);
    await category.save();
    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Category already exists',
        details: 'A category with this name already exists for your account'
      });
    }
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Category not found',
        details: 'The specified category ID is invalid'
      });
    }
    res.status(500).json({ 
      error: 'Failed to update category',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ 
      _id: req.params.id,
      user: req.user._id 
    });

    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found',
        details: 'The specified category does not exist or you do not have access to it'
      });
    }

    res.json({ error: 'Category deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        error: 'Category not found',
        details: 'The specified category ID is invalid'
      });
    }
    res.status(500).json({ 
      error: 'Failed to delete category',
      details: error.message 
    });
  }
});

module.exports = router; 
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user
    const user = new User({ username, password, displayName });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        totalPoints: user.totalPoints,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Server error', error: (error as Error).message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        totalPoints: user.totalPoints,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    user: {
      _id: req.user!._id,
      username: req.user!.username,
      displayName: req.user!.displayName,
      role: req.user!.role,
      totalPoints: req.user!.totalPoints,
    },
  });
});

// Make current user admin (for setup purposes)
router.put('/make-admin', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated to admin successfully',
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: (error as Error).message,
    });
  }
});

// Admin endpoint to get all users
router.get(
  '/users',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const users = await User.find(
        {},
        'username displayName role totalPoints'
      ).sort({
        displayName: 1,
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
    }
  }
);

// Admin endpoint to delete a user
router.delete(
  '/users/:userId',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'User deleted successfully',
        deletedUser: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
    }
  }
);

// Admin endpoint to update user role
router.put(
  '/update-role',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { userId, role } = req.body;

      if (!userId || !role) {
        return res
          .status(400)
          .json({ message: 'userId and role are required' });
      }

      if (!['user', 'admin'].includes(role)) {
        return res
          .status(400)
          .json({ message: 'Role must be "user" or "admin"' });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'User role updated successfully',
        user: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
    }
  }
);

export default router;

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { verifyToken, verifyAdmin } = require('./middleware');

const router = express.Router();

// ============ AUTH ROUTES ============

// Register new user
router.post('/auth/register', (req, res) => {
  try {
    const { name, email, password, country, phone } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required' });
    }
    
    // Check if user already exists
    if (db.getUserByEmail(email)) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Create user
    const user = db.createUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      country: country || '',
      phone: phone || '',
      capital: 0,
      balance: 0,
      status: 'pending',
      note: ''
    });
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, status: user.status }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login user
router.post('/auth/login', (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    // Admin login
    if (isAdmin) {
      const admin = db.getAdminByUsername(email);
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
      }
      
      const isValidPassword = bcrypt.compareSync(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
      }
      
      const token = jwt.sign(
        { userId: admin.id, username: admin.username, isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.json({
        success: true,
        message: 'Admin login successful',
        token,
        admin: { id: admin.id, username: admin.username }
      });
    }
    
    // User login
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, status: user.status }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ USER ROUTES ============

// Get current user profile
router.get('/user/profile', verifyToken, (req, res) => {
  try {
    if (req.user.isAdmin) {
      return res.json({ success: true, user: req.user });
    }
    
    const user = db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Don't send password
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile
router.put('/user/profile', verifyToken, (req, res) => {
  try {
    const { name, country, phone } = req.body;
    
    const user = db.updateUser(req.user.userId, { name, country, phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, message: 'Profile updated', user: userWithoutPassword });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============ ADMIN ROUTES ============

// Get all users (admin only)
router.get('/admin/users', verifyToken, verifyAdmin, (req, res) => {
  try {
    const users = db.getAllUsers();
    // Remove passwords
    const usersWithoutPasswords = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json({ success: true, users: usersWithoutPasswords });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user stats (admin only)
router.get('/admin/stats', verifyToken, verifyAdmin, (req, res) => {
  try {
    const stats = db.getUserStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/admin/users/:userId', verifyToken, verifyAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, country, phone, capital, balance, status, note } = req.body;
    
    const user = db.updateUser(userId, {
      name,
      email,
      country,
      phone,
      capital,
      balance,
      status,
      note
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, message: 'User updated', user: userWithoutPassword });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add user (admin only)
router.post('/admin/users', verifyToken, verifyAdmin, (req, res) => {
  try {
    const { name, email, password, country, phone, capital, balance, status } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required' });
    }
    
    if (db.getUserByEmail(email)) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const user = db.createUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      country: country || '',
      phone: phone || '',
      capital: capital || 0,
      balance: balance || 0,
      status: status || 'pending',
      note: ''
    });
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ success: true, message: 'User created', user: userWithoutPassword });
  } catch (err) {
    console.error('Add user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/admin/users/:userId', verifyToken, verifyAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = db.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

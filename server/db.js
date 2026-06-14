const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// Initialize database file if it doesn't exist
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      admins: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read from JSON database
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return { users: [], admins: [] };
  }
}

// Write to JSON database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// Get all users
function getAllUsers() {
  const db = readDB();
  return db.users || [];
}

// Find user by ID
function getUserById(id) {
  const users = getAllUsers();
  return users.find(u => u.id === id);
}

// Find user by email
function getUserByEmail(email) {
  const users = getAllUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// Create user
function createUser(userData) {
  const db = readDB();
  const newUser = {
    id: 'u_' + Date.now(),
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.users.push(newUser);
  writeDB(db);
  return newUser;
}

// Update user
function updateUser(id, updates) {
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) return null;
  
  db.users[userIndex] = {
    ...db.users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  writeDB(db);
  return db.users[userIndex];
}

// Delete user
function deleteUser(id) {
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) return false;
  
  db.users.splice(userIndex, 1);
  writeDB(db);
  return true;
}

// Get admin by username
function getAdminByUsername(username) {
  const db = readDB();
  return db.admins.find(a => a.username.toLowerCase() === username.toLowerCase());
}

// Create default admin if none exists
function ensureAdminExists() {
  const db = readDB();
  if (db.admins && db.admins.length > 0) return;
  
  const bcrypt = require('bcryptjs');
  const hashedPass = bcrypt.hashSync('admin123', 10);
  
  db.admins = [
    {
      id: 'admin_1',
      username: 'admin',
      password: hashedPass,
      email: 'admin@lebanoncapital.com',
      createdAt: new Date().toISOString()
    }
  ];
  writeDB(db);
}

// Get user stats
function getUserStats() {
  const users = getAllUsers();
  return {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    totalCapital: users.reduce((sum, u) => sum + (Number(u.capital) || 0), 0)
  };
}

module.exports = {
  initDB,
  readDB,
  writeDB,
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  getAdminByUsername,
  ensureAdminExists,
  getUserStats
};

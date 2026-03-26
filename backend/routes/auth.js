import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // Get user from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Log user in
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      return res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

router.get('/check', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      authenticated: true, 
      user: { 
        id: req.user.id, 
        username: req.user.username, 
        role: req.user.role 
      } 
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
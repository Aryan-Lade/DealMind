import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dealmind_railway_secret_key_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, displayName: user.display_name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Insert user
    const insertRes = await query(
      `INSERT INTO users (id, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, photo_url, created_at`,
      [userId, normalizedEmail, passwordHash, name.trim()]
    );

    const newUser = insertRes.rows[0];

    // Seed default user settings
    try {
      await query(
        `INSERT INTO user_settings (user_id, opponent_style, coaching_style, currency)
         VALUES ($1, 'professional', 'balanced', '₹')`,
        [newUser.id]
      );
    } catch {
      // Ignore if exists
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      token,
      user: {
        uid: newUser.id,
        email: newUser.email,
        displayName: newUser.display_name,
        photoURL: newUser.photo_url || undefined,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create account: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if logging in as designated administrator
    if (normalizedEmail === 'aryan_as_admin@gmail.com') {
      if (password === 'aryan123') {
        const existingAdmin = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        let adminUser;
        if (existingAdmin.rows.length === 0) {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash('aryan123', salt);
          const adminId = 'usr_admin_aryan';
          const inserted = await query(
            `INSERT INTO users (id, email, password_hash, display_name)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, display_name, photo_url`,
            [adminId, normalizedEmail, hash, 'Aryan (Admin)']
          );
          adminUser = inserted.rows[0];
          try {
            await query(
              `INSERT INTO user_settings (user_id, opponent_style, coaching_style, currency)
               VALUES ($1, 'professional', 'balanced', '₹')`,
              [adminId]
            );
          } catch { /* ignore */ }
        } else {
          adminUser = existingAdmin.rows[0];
        }

        const token = generateToken(adminUser);
        return res.json({
          token,
          user: {
            uid: adminUser.id,
            email: adminUser.email,
            displayName: adminUser.display_name || 'Aryan (Admin)',
            photoURL: adminUser.photo_url || undefined,
            isAdmin: true,
          },
        });
      } else {
        return res.status(401).json({ error: 'Incorrect password for administrator account.' });
      }
    }

    const userRes = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email. Please register first.' });
    }

    const user = userRes.rows[0];

    if (!user.password_hash) {
      return res.status(400).json({ error: 'Account created via Google. Please sign in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please check your credentials and try again.' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        uid: user.id,
        email: user.email,
        displayName: user.display_name,
        photoURL: user.photo_url || undefined,
        isAdmin: user.email?.toLowerCase().trim() === 'aryan_as_admin@gmail.com',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Sign in failed. ' + err.message });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { email, displayName, photoURL } = req.body;
    const normalizedEmail = (email || 'google.user@dealmind.ai').toLowerCase().trim();
    const name = displayName || normalizedEmail.split('@')[0];

    // Upsert Google user
    const existing = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    let user;

    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const userId = 'goog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const insert = await query(
        `INSERT INTO users (id, email, display_name, photo_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, display_name, photo_url`,
        [userId, normalizedEmail, name, photoURL || null]
      );
      user = insert.rows[0];

      await query(
        `INSERT INTO user_settings (user_id, opponent_style, coaching_style, currency)
         VALUES ($1, 'professional', 'balanced', '₹')
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id]
      );
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        uid: user.id,
        email: user.email,
        displayName: user.display_name,
        photoURL: user.photo_url || undefined,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Google sign in failed. ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await query(
      'SELECT id, email, display_name, photo_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    return res.json({
      uid: user.id,
      email: user.email,
      displayName: user.display_name,
      photoURL: user.photo_url || undefined,
      createdAt: user.created_at,
      isAdmin: user.email?.toLowerCase().trim() === 'aryan_as_admin@gmail.com',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user profile. ' + err.message });
  }
});

export default router;

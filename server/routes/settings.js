import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// GET /api/settings - Fetch user settings
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT gemini_key, opponent_style, coaching_style, currency FROM user_settings WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({
        geminiKey: '',
        opponentStyle: 'professional',
        coachingStyle: 'balanced',
        currency: '₹',
      });
    }

    const s = result.rows[0];
    return res.json({
      geminiKey: s.gemini_key || '',
      opponentStyle: s.opponent_style || 'professional',
      coachingStyle: s.coaching_style || 'balanced',
      currency: s.currency || '₹',
    });
  } catch (err) {
    console.error('Fetch settings error:', err);
    return res.status(500).json({ error: 'Failed to fetch settings. ' + err.message });
  }
});

// PUT /api/settings - Update or insert user settings
router.put('/', async (req, res) => {
  try {
    const { geminiKey, opponentStyle, coachingStyle, currency } = req.body;

    const result = await query(
      `INSERT INTO user_settings (user_id, gemini_key, opponent_style, coaching_style, currency, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         gemini_key = COALESCE($2, user_settings.gemini_key),
         opponent_style = COALESCE($3, user_settings.opponent_style),
         coaching_style = COALESCE($4, user_settings.coaching_style),
         currency = COALESCE($5, user_settings.currency),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, geminiKey || null, opponentStyle || 'professional', coachingStyle || 'balanced', currency || '₹']
    );

    const s = result.rows[0];
    return res.json({
      geminiKey: s.gemini_key || '',
      opponentStyle: s.opponent_style,
      coachingStyle: s.coaching_style,
      currency: s.currency,
    });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Failed to save settings. ' + err.message });
  }
});

export default router;

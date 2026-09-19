import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Protect all negotiation routes with JWT authentication
router.use(authenticateToken);

function formatNegotiation(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    currentOffer: Number(row.current_offer) || 0,
    desiredOffer: Number(row.desired_offer) || 0,
    walkAway: Number(row.walk_away) || 0,
    minAcceptable: Number(row.min_acceptable) || 0,
    maxDesired: Number(row.max_desired) || 0,
    batna: row.batna || '',
    context: row.context || '',
    strengths: row.strengths || '',
    deadline: row.deadline || '',
    otherParty: row.other_party || '',
    relationship: row.relationship || '',
    analysis: row.analysis || null,
    status: row.status || 'draft',
    score: row.score ? Number(row.score) : undefined,
    finalOffer: row.final_offer ? Number(row.final_offer) : undefined,
    messages: row.messages || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/negotiations - Fetch all negotiations for the logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM negotiations 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const items = result.rows.map(formatNegotiation);
    return res.json(items);
  } catch (err) {
    console.error('Fetch negotiations error:', err);
    return res.status(500).json({ error: 'Failed to fetch negotiations. ' + err.message });
  }
});

// GET /api/negotiations/:id - Fetch a single negotiation
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM negotiations 
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Negotiation not found or unauthorized.' });
    }

    return res.json(formatNegotiation(result.rows[0]));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch negotiation. ' + err.message });
  }
});

// POST /api/negotiations - Create a new negotiation
router.post('/', async (req, res) => {
  try {
    const n = req.body;
    const id = n.id || ('neg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));

    const result = await query(
      `INSERT INTO negotiations (
        id, user_id, title, type, current_offer, desired_offer, walk_away,
        min_acceptable, max_desired, batna, context, strengths, deadline,
        other_party, relationship, analysis, status, score, final_offer, messages
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *`,
      [
        id,
        req.user.id,
        n.title || 'Untitled Negotiation',
        n.type || 'general',
        n.currentOffer || 0,
        n.desiredOffer || 0,
        n.walkAway || 0,
        n.minAcceptable || 0,
        n.maxDesired || 0,
        n.batna || '',
        n.context || '',
        n.strengths || '',
        n.deadline || '',
        n.otherParty || '',
        n.relationship || 'new',
        JSON.stringify(n.analysis || null),
        n.status || 'draft',
        n.score || null,
        n.finalOffer || null,
        JSON.stringify(n.messages || []),
      ]
    );

    return res.status(201).json(formatNegotiation(result.rows[0]));
  } catch (err) {
    console.error('Create negotiation error:', err);
    return res.status(500).json({ error: 'Failed to create negotiation. ' + err.message });
  }
});

// PUT /api/negotiations/:id - Update an existing negotiation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const n = req.body;

    // Check ownership
    const existing = await query('SELECT * FROM negotiations WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Negotiation not found or unauthorized.' });
    }

    const current = existing.rows[0];

    const updated = await query(
      `UPDATE negotiations SET
        title = $1,
        type = $2,
        current_offer = $3,
        desired_offer = $4,
        walk_away = $5,
        min_acceptable = $6,
        max_desired = $7,
        batna = $8,
        context = $9,
        strengths = $10,
        deadline = $11,
        other_party = $12,
        relationship = $13,
        analysis = $14,
        status = $15,
        score = $16,
        final_offer = $17,
        messages = $18,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $19 AND user_id = $20
      RETURNING *`,
      [
        n.title !== undefined ? n.title : current.title,
        n.type !== undefined ? n.type : current.type,
        n.currentOffer !== undefined ? n.currentOffer : current.current_offer,
        n.desiredOffer !== undefined ? n.desiredOffer : current.desired_offer,
        n.walkAway !== undefined ? n.walkAway : current.walk_away,
        n.minAcceptable !== undefined ? n.minAcceptable : current.min_acceptable,
        n.maxDesired !== undefined ? n.maxDesired : current.max_desired,
        n.batna !== undefined ? n.batna : current.batna,
        n.context !== undefined ? n.context : current.context,
        n.strengths !== undefined ? n.strengths : current.strengths,
        n.deadline !== undefined ? n.deadline : current.deadline,
        n.otherParty !== undefined ? n.otherParty : current.other_party,
        n.relationship !== undefined ? n.relationship : current.relationship,
        n.analysis !== undefined ? JSON.stringify(n.analysis) : current.analysis,
        n.status !== undefined ? n.status : current.status,
        n.score !== undefined ? n.score : current.score,
        n.finalOffer !== undefined ? n.finalOffer : current.final_offer,
        n.messages !== undefined ? JSON.stringify(n.messages) : current.messages,
        id,
        req.user.id,
      ]
    );

    return res.json(formatNegotiation(updated.rows[0]));
  } catch (err) {
    console.error('Update negotiation error:', err);
    return res.status(500).json({ error: 'Failed to update negotiation. ' + err.message });
  }
});

// DELETE /api/negotiations/:id - Delete a negotiation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM negotiations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Negotiation not found or unauthorized.' });
    }

    return res.json({ success: true, id });
  } catch (err) {
    console.error('Delete negotiation error:', err);
    return res.status(500).json({ error: 'Failed to delete negotiation. ' + err.message });
  }
});

// POST /api/negotiations/sync - Batch sync negotiations from local storage into PostgreSQL
router.post('/sync', async (req, res) => {
  try {
    const { negotiations: items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ synced: 0, message: 'No items to sync' });
    }

    let synced = 0;
    for (const n of items) {
      const id = n.id || ('neg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
      await query(
        `INSERT INTO negotiations (
          id, user_id, title, type, current_offer, desired_offer, walk_away,
          min_acceptable, max_desired, batna, context, strengths, deadline,
          other_party, relationship, analysis, status, score, final_offer, messages
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          current_offer = EXCLUDED.current_offer,
          desired_offer = EXCLUDED.desired_offer,
          analysis = EXCLUDED.analysis,
          status = EXCLUDED.status,
          score = EXCLUDED.score,
          messages = EXCLUDED.messages,
          updated_at = CURRENT_TIMESTAMP`,
        [
          id,
          req.user.id,
          n.title || 'Negotiation',
          n.type || 'general',
          n.currentOffer || 0,
          n.desiredOffer || 0,
          n.walkAway || 0,
          n.minAcceptable || 0,
          n.maxDesired || 0,
          n.batna || '',
          n.context || '',
          n.strengths || '',
          n.deadline || '',
          n.otherParty || '',
          n.relationship || 'new',
          JSON.stringify(n.analysis || null),
          n.status || 'draft',
          n.score || null,
          n.finalOffer || null,
          JSON.stringify(n.messages || []),
        ]
      );
      synced++;
    }

    return res.json({ success: true, synced });
  } catch (err) {
    console.error('Sync negotiations error:', err);
    return res.status(500).json({ error: 'Failed to sync negotiations. ' + err.message });
  }
});

export default router;

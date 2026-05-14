const express = require('express');
const pool = require('../db');
const authenticate = require('../middleware/authenticate');
const router = express.Router();

// ─── GET /api/stories — list all stories with pagination ─────────────────────
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { genre, status, search } = req.query;
    const params = [];
    const conditions = [];

    if (genre) {
      params.push(genre);
      conditions.push(`genre ILIKE $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title ILIKE $${params.length} OR synopsis ILIKE $${params.length} OR author ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit);
    params.push(offset);

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT cs.*,
                COALESCE(AVG(sr.rating), 0)::numeric(3,1) as avg_rating,
                COUNT(sr.id) as rating_count
         FROM comic_stories cs
         LEFT JOIN story_ratings sr ON sr.story_id = cs.id
         ${where}
         GROUP BY cs.id
         ORDER BY cs.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) as total FROM comic_stories ${where}`,
        params.slice(0, params.length - 2)
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/stories/top-rated — top 10 stories by average rating ────────────
router.get('/top-rated', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cs.*,
             COALESCE(AVG(sr.rating), 0)::numeric(3,1) as avg_rating,
             COUNT(sr.id) as rating_count
      FROM comic_stories cs
      LEFT JOIN story_ratings sr ON sr.story_id = cs.id
      GROUP BY cs.id
      HAVING COUNT(sr.id) > 0
      ORDER BY avg_rating DESC, rating_count DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/stories/:id — get a single story ───────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cs.*,
              COALESCE(AVG(sr.rating), 0)::numeric(3,1) as avg_rating,
              COUNT(sr.id) as rating_count
       FROM comic_stories cs
       LEFT JOIN story_ratings sr ON sr.story_id = cs.id
       WHERE cs.id = $1
       GROUP BY cs.id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Story not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/stories/:id/rate ───────────────────────────────────────────────
// Body: { rating (1-5), comment }
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (rating === undefined || rating === null) {
      return res.status(400).json({ error: 'rating is required' });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    // Verify story exists
    const storyResult = await pool.query('SELECT id FROM comic_stories WHERE id = $1', [id]);
    if (storyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const userId = req.user.id;

    // Upsert: one rating per user per story
    const result = await pool.query(
      `INSERT INTO story_ratings (story_id, user_id, rating, comment, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (story_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
       RETURNING *`,
      [id, userId, ratingNum, comment || '']
    );

    // Return updated average
    const avg = await pool.query(
      `SELECT COALESCE(AVG(rating), 0)::numeric(3,1) as avg_rating, COUNT(*) as rating_count
       FROM story_ratings WHERE story_id = $1`,
      [id]
    );

    res.json({
      message: 'Rating saved',
      rating: result.rows[0],
      avg_rating: parseFloat(avg.rows[0].avg_rating),
      rating_count: parseInt(avg.rows[0].rating_count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

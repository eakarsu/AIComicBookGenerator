const express = require('express');
const pool = require('../db');
const authenticate = require('../middleware/authenticate');
const router = express.Router({ mergeParams: true });

// ─── GET /api/stories/:id/panels ─────────────────────────────────────────────
// Returns panels ordered by panel_number (sequence_number)
router.get('/', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify story exists
    const storyResult = await pool.query('SELECT id, title FROM comic_stories WHERE id = $1', [id]);
    if (storyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const result = await pool.query(
      `SELECT * FROM comic_panels WHERE story_id = $1 ORDER BY panel_number ASC`,
      [id]
    );

    res.json({
      story_id: parseInt(id),
      story_title: storyResult.rows[0].title,
      panels: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/stories/:id/panels/reorder ────────────────────────────────────
// Body: { panels: [{ id, panel_number }] }
router.post('/reorder', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { panels } = req.body;

    if (!Array.isArray(panels) || panels.length === 0) {
      return res.status(400).json({ error: 'panels must be a non-empty array of { id, panel_number }' });
    }

    // Validate each entry
    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      if (!p.id || p.panel_number === undefined || p.panel_number === null) {
        return res.status(400).json({ error: `panels[${i}] must have id and panel_number` });
      }
      if (!Number.isInteger(Number(p.panel_number)) || Number(p.panel_number) < 1) {
        return res.status(400).json({ error: `panels[${i}].panel_number must be a positive integer` });
      }
    }

    // Verify story exists
    const storyResult = await pool.query('SELECT id FROM comic_stories WHERE id = $1', [id]);
    if (storyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const panel of panels) {
        await client.query(
          `UPDATE comic_panels SET panel_number = $1, updated_at = NOW() WHERE id = $2 AND story_id = $3`,
          [panel.panel_number, panel.id, id]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Return updated panels
    const result = await pool.query(
      `SELECT * FROM comic_panels WHERE story_id = $1 ORDER BY panel_number ASC`,
      [id]
    );

    res.json({
      message: 'Panels reordered successfully',
      story_id: parseInt(id),
      panels: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const pool = require('../db');
const router = express.Router();

// Generic CRUD factory
const tables = {
  'comic-stories': { table: 'comic_stories', orderBy: 'created_at DESC' },
  'characters': { table: 'characters', orderBy: 'created_at DESC' },
  'comic-panels': { table: 'comic_panels', orderBy: 'story_id, panel_number' },
  'art-styles': { table: 'art_styles', orderBy: 'popularity DESC' },
  'speech-bubbles': { table: 'speech_bubbles', orderBy: 'created_at DESC' },
  'comic-templates': { table: 'comic_templates', orderBy: 'created_at DESC' },
  'comic-series': { table: 'comic_series', orderBy: 'issues_count DESC' },
  'gallery': { table: 'gallery', orderBy: 'likes DESC' },
  'ai-stories': { table: 'ai_stories', orderBy: 'created_at DESC' },
  'ai-characters': { table: 'ai_characters', orderBy: 'created_at DESC' },
  'ai-dialogues': { table: 'ai_dialogues', orderBy: 'created_at DESC' },
  'ai-art-suggestions': { table: 'ai_art_suggestions', orderBy: 'created_at DESC' },
  'ai-plot-twists': { table: 'ai_plot_twists', orderBy: 'created_at DESC' },
  'ai-scenes': { table: 'ai_scenes', orderBy: 'created_at DESC' },
  'ai-villains': { table: 'ai_villains', orderBy: 'created_at DESC' },
};

// List all
Object.entries(tables).forEach(([route, { table, orderBy }]) => {
  router.get(`/${route}`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get one
  router.get(`/${route}/:id`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create
  router.post(`/${route}`, async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update
  router.put(`/${route}/:id`, async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const result = await pool.query(
        `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      // Some tables don't have updated_at
      try {
        const keys = Object.keys(req.body);
        const values = Object.values(req.body);
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const result = await pool.query(
          `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
          [...values, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
      } catch (err2) {
        res.status(500).json({ error: err2.message });
      }
    }
  });

  // Delete
  router.delete(`/${route}/:id`, async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully', item: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

module.exports = router;

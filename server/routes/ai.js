const express = require('express');
const fetch = require('node-fetch');
const pool = require('../db');
const router = express.Router();

async function callOpenRouter(prompt, systemPrompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'AI Comic Book Generator'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.8
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices[0].message.content;
}

// Generate Story
router.post('/generate-story', async (req, res) => {
  try {
    const { prompt, genre, tone } = req.body;
    const systemPrompt = `You are a master comic book story writer. Create vivid, engaging comic book stories. Format your response as a structured story with: Title, Setting, Characters (with brief descriptions), Plot (broken into 3 acts), Key Scenes (describe 4-5 key visual panels), and a Cliffhanger ending. Make it dramatic and visual. Genre: ${genre || 'Any'}. Tone: ${tone || 'Epic'}.`;
    const generated = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO ai_stories (prompt, generated_story, genre, tone, word_count, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, generated, genre || 'General', tone || 'Epic', generated.split(/\s+/).length, process.env.OPENROUTER_MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Character
router.post('/generate-character', async (req, res) => {
  try {
    const { prompt, style, archetype } = req.body;
    const systemPrompt = `You are a comic book character designer. Create a detailed character profile including: Name, Alias/Title, Appearance (detailed visual description for an artist), Powers/Abilities (list 3-5), Weakness, Personality Traits, Origin Story (brief), Signature Move, and Catchphrase. Style: ${style || 'Superhero'}. Archetype: ${archetype || 'Hero'}. Make the character visually striking and memorable.`;
    const generated = await callOpenRouter(prompt, systemPrompt);
    const nameMatch = generated.match(/(?:Name|name)[:\s]+([^\n]+)/);
    const charName = nameMatch ? nameMatch[1].trim().replace(/\*+/g, '') : 'Unnamed Hero';
    const result = await pool.query(
      `INSERT INTO ai_characters (prompt, character_name, generated_design, style, archetype, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, charName, generated, style || 'Superhero', archetype || 'Hero', process.env.OPENROUTER_MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Dialogue
router.post('/generate-dialogue', async (req, res) => {
  try {
    const { prompt, scene_context, characters_involved, emotion } = req.body;
    const systemPrompt = `You are a comic book dialogue writer. Write dynamic, punchy dialogue for comic book panels. Format as a scene with: Scene Setup (1-2 sentences), then a series of dialogue lines with character name, their dialogue in quotes, and a stage direction/emotion in parentheses. Include sound effects (BOOM, CRACK, etc.) where appropriate. Keep dialogue concise and impactful—comic bubbles are small! Characters: ${characters_involved || 'Hero and Villain'}. Emotion: ${emotion || 'Dramatic'}.`;
    const generated = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO ai_dialogues (prompt, scene_context, generated_dialogue, characters_involved, emotion, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, scene_context || '', generated, characters_involved || 'Various', emotion || 'Dramatic', process.env.OPENROUTER_MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Art Style Suggestion
router.post('/generate-art-suggestion', async (req, res) => {
  try {
    const { prompt, style_type, color_mood } = req.body;
    const systemPrompt = `You are a comic book art director. Suggest the perfect art style for a comic project. Include: Recommended Style Name, Style Description, Key Techniques (list 4-5 specific techniques), Color Palette (describe specific colors), Reference Artists (2-3 real comic artists for inspiration), Panel Layout Recommendations, Inking Approach, and Overall Mood. Color mood preference: ${color_mood || 'Vibrant'}. Style category: ${style_type || 'Modern'}.`;
    const generated = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO ai_art_suggestions (prompt, generated_suggestion, style_type, reference_artists, color_mood, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, generated, style_type || 'Modern', '', color_mood || 'Vibrant', process.env.OPENROUTER_MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Plot Twist
router.post('/generate-plot-twist', async (req, res) => {
  try {
    const { prompt, story_context, twist_type, intensity } = req.body;
    const systemPrompt = `You are a master comic book plot architect. Generate a mind-blowing plot twist. Include: The Twist (dramatic reveal), Setup (how to foreshadow it - list 3 clues), Impact (how it changes the story), Character Reactions (how 2-3 characters respond), Visual Reveal (describe the perfect panel to reveal this twist), and Aftermath (what happens next). Twist type: ${twist_type || 'Revelation'}. Intensity: ${intensity || 'High'}. Make it shocking but logical in hindsight.`;
    const generated = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO ai_plot_twists (prompt, story_context, generated_twist, twist_type, intensity, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, story_context || '', generated, twist_type || 'Revelation', intensity || 'High', process.env.OPENROUTER_MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Scene Description
router.post('/generate-scene', async (req, res) => {
  try {
    const { prompt, setting, time_of_day, weather, mood } = req.body;
    const systemPrompt = `You are a comic book scene visualizer. Create a vivid, detailed scene description that an artist could draw. Include: Overall Composition (camera angle and framing), Background Details (5+ specific elements), Lighting Description (source, quality, shadows), Color Palette (dominant colors and accents), Atmosphere (particles, weather, effects), Character Positions (if applicable), Sound Effects (ambient sounds as comic text), and Emotional Tone. Setting: ${setting || 'Any'}. Time: ${time_of_day || 'Any'}. Weather: ${weather || 'Clear'}. Mood: ${mood || 'Dramatic'}.`;
    const generated = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO ai_scenes (prompt, generated_scene, setting, time_of_day, weather, mood, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, $7, 0) RETURNING *`,
      [prompt, generated, setting || 'Various', time_of_day || 'Any', weather || 'Clear', mood || 'Dramatic', process.env.OPENROUTER_MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Villain
router.post('/generate-villain', async (req, res) => {
  try {
    const { prompt, villain_type, threat_level } = req.body;
    const systemPrompt = `You are a comic book villain architect. Design a compelling, complex villain. Include: Villain Name, Title/Alias, Appearance (detailed visual for artists), Powers/Abilities (list 4-5), Fatal Weakness, Motivation (make it sympathetic or terrifying), Origin Story, Lair Description, Catchphrase, Minions/Resources, Nemesis Relationship, and Threat Level Assessment. Villain type: ${villain_type || 'Mastermind'}. Threat level: ${threat_level || 'High'}. Make the villain someone readers love to hate.`;
    const generated = await callOpenRouter(prompt, systemPrompt);
    const nameMatch = generated.match(/(?:Name|name|Villain)[:\s]+([^\n]+)/);
    const villainName = nameMatch ? nameMatch[1].trim().replace(/\*+/g, '') : 'Unknown Villain';
    const result = await pool.query(
      `INSERT INTO ai_villains (prompt, villain_name, generated_profile, villain_type, threat_level, motivation, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, $7, 0) RETURNING *`,
      [prompt, villainName, generated, villain_type || 'Mastermind', threat_level || 'High', '', process.env.OPENROUTER_MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

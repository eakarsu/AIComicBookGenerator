const express = require('express');
const fetch = require('node-fetch');
const pool = require('../db');
const aiRateLimiter = require('../middleware/rateLimiter');
const authenticate = require('../middleware/authenticate');
const router = express.Router();

const SYSTEM_PROMPT =
  'You are a creative comic book writer and artist director. Generate vivid, engaging content with rich visual descriptions and dynamic storytelling.';

const MODEL = 'anthropic/claude-3-5-sonnet-20241022';

async function callOpenRouter(prompt, systemPrompt) {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI service unavailable: OPENROUTER_API_KEY not configured on server.');
    err.statusCode = 503;
    throw err;
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'AI Comic Book Generator'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
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

// ─── Input validation helper ──────────────────────────────────────────────────
function validate(body, required) {
  const missing = required.filter(k => {
    const val = body[k];
    return val === undefined || val === null || val === '';
  });
  return missing;
}

// ─── POST /api/ai/generate-story ──────────────────────────────────────────────
router.post('/generate-story', aiRateLimiter, async (req, res) => {
  try {
    const { prompt, genre, tone } = req.body;
    const missing = validate(req.body, ['prompt']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const sysPrompt = `You are a master comic book story writer. Create vivid, engaging comic book stories. Format your response as a structured story with: Title, Setting, Characters (with brief descriptions), Plot (broken into 3 acts), Key Scenes (describe 4-5 key visual panels), and a Cliffhanger ending. Make it dramatic and visual. Genre: ${genre || 'Any'}. Tone: ${tone || 'Epic'}.`;
    const generated = await callOpenRouter(prompt, sysPrompt);
    const result = await pool.query(
      `INSERT INTO ai_stories (prompt, generated_story, genre, tone, word_count, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, generated, genre || 'General', tone || 'Epic', generated.split(/\s+/).length, MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate-character ─────────────────────────────────────────
router.post('/generate-character', aiRateLimiter, async (req, res) => {
  try {
    const { prompt, style, archetype } = req.body;
    const missing = validate(req.body, ['prompt']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const sysPrompt = `You are a comic book character designer. Create a detailed character profile including: Name, Alias/Title, Appearance (detailed visual description for an artist), Powers/Abilities (list 3-5), Weakness, Personality Traits, Origin Story (brief), Signature Move, and Catchphrase. Style: ${style || 'Superhero'}. Archetype: ${archetype || 'Hero'}. Make the character visually striking and memorable.`;
    const generated = await callOpenRouter(prompt, sysPrompt);
    const nameMatch = generated.match(/(?:Name|name)[:\s]+([^\n]+)/);
    const charName = nameMatch ? nameMatch[1].trim().replace(/\*+/g, '') : 'Unnamed Hero';
    const result = await pool.query(
      `INSERT INTO ai_characters (prompt, character_name, generated_design, style, archetype, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, charName, generated, style || 'Superhero', archetype || 'Hero', MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate-dialogue ──────────────────────────────────────────
router.post('/generate-dialogue', aiRateLimiter, async (req, res) => {
  try {
    const { prompt, scene_context, characters_involved, emotion } = req.body;
    const missing = validate(req.body, ['prompt']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const sysPrompt = `You are a comic book dialogue writer. Write dynamic, punchy dialogue for comic book panels. Format as a scene with: Scene Setup (1-2 sentences), then a series of dialogue lines with character name, their dialogue in quotes, and a stage direction/emotion in parentheses. Include sound effects (BOOM, CRACK, etc.) where appropriate. Keep dialogue concise and impactful—comic bubbles are small! Characters: ${characters_involved || 'Hero and Villain'}. Emotion: ${emotion || 'Dramatic'}.`;
    const generated = await callOpenRouter(prompt, sysPrompt);
    const result = await pool.query(
      `INSERT INTO ai_dialogues (prompt, scene_context, generated_dialogue, characters_involved, emotion, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, scene_context || '', generated, characters_involved || 'Various', emotion || 'Dramatic', MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate-art-suggestion ────────────────────────────────────
router.post('/generate-art-suggestion', aiRateLimiter, async (req, res) => {
  try {
    const { prompt, style_type, color_mood } = req.body;
    const missing = validate(req.body, ['prompt']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const sysPrompt = `You are a comic book art director. Suggest the perfect art style for a comic project. Include: Recommended Style Name, Style Description, Key Techniques (list 4-5 specific techniques), Color Palette (describe specific colors), Reference Artists (2-3 real comic artists for inspiration), Panel Layout Recommendations, Inking Approach, and Overall Mood. Color mood preference: ${color_mood || 'Vibrant'}. Style category: ${style_type || 'Modern'}.`;
    const generated = await callOpenRouter(prompt, sysPrompt);
    const result = await pool.query(
      `INSERT INTO ai_art_suggestions (prompt, generated_suggestion, style_type, reference_artists, color_mood, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, generated, style_type || 'Modern', '', color_mood || 'Vibrant', MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate-scene ─────────────────────────────────────────────
router.post('/generate-scene', aiRateLimiter, async (req, res) => {
  try {
    const { prompt, setting, time_of_day, weather, mood } = req.body;
    const missing = validate(req.body, ['prompt']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const sysPrompt = `You are a comic book scene visualizer. Create a vivid, detailed scene description that an artist could draw. Include: Overall Composition (camera angle and framing), Background Details (5+ specific elements), Lighting Description (source, quality, shadows), Color Palette (dominant colors and accents), Atmosphere (particles, weather, effects), Character Positions (if applicable), Sound Effects (ambient sounds as comic text), and Emotional Tone. Setting: ${setting || 'Any'}. Time: ${time_of_day || 'Any'}. Weather: ${weather || 'Clear'}. Mood: ${mood || 'Dramatic'}.`;
    const generated = await callOpenRouter(prompt, sysPrompt);
    const result = await pool.query(
      `INSERT INTO ai_scenes (prompt, generated_scene, setting, time_of_day, weather, mood, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, $7, 0) RETURNING *`,
      [prompt, generated, setting || 'Various', time_of_day || 'Any', weather || 'Clear', mood || 'Dramatic', MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate-villain ───────────────────────────────────────────
// Takes {story_genre, hero_character} → antagonist with powers, backstory, visual design
router.post('/generate-villain', aiRateLimiter, async (req, res) => {
  try {
    const { story_genre, hero_character, prompt, villain_type, threat_level } = req.body;

    // Support both new spec (story_genre, hero_character) and old form (prompt)
    const missing = validate(req.body, ['story_genre', 'hero_character']);
    if (missing.length && !prompt) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const effectivePrompt = prompt ||
      `Create a compelling villain for a ${story_genre} comic who serves as the perfect antagonist to ${hero_character}.`;

    const sysPrompt = `You are a comic book villain architect. Design a compelling, complex villain that is the ideal nemesis for the given hero. Include:
1. **Villain Name & Alias** — striking and memorable
2. **Powers & Abilities** — list 4-5 that directly counter or challenge the hero
3. **Backstory** — 2-3 paragraphs explaining their origin and what made them villainous
4. **Visual Design** — detailed physical description, costume, color scheme for an artist to draw
5. **Motivation** — what drives them (make it complex, possibly sympathetic)
6. **Nemesis Relationship** — how they specifically oppose the hero thematically and physically
7. **Signature Move or Weapon** — their most feared ability or tool
8. **Weakness** — one exploitable flaw

Story Genre: ${story_genre || 'Superhero'}. Hero: ${hero_character || 'Unknown'}.`;

    const generated = await callOpenRouter(effectivePrompt, sysPrompt);
    const nameMatch = generated.match(/(?:Villain Name|Name|name|Villain)[:\s*]+([^\n]+)/);
    const villainName = nameMatch ? nameMatch[1].trim().replace(/\*+/g, '') : 'Unknown Villain';

    const result = await pool.query(
      `INSERT INTO ai_villains (prompt, villain_name, generated_profile, villain_type, threat_level, motivation, model_used, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0) RETURNING *`,
      [effectivePrompt, villainName, generated, villain_type || story_genre || 'Mastermind', threat_level || 'High', '', MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/plot-twist ──────────────────────────────────────────────────
// Takes {story_so_far, genre} → 3 plot twist options with impact analysis
router.post('/plot-twist', aiRateLimiter, async (req, res) => {
  try {
    const { story_so_far, genre, prompt, story_context, twist_type, intensity } = req.body;

    const missing = validate(req.body, ['story_so_far', 'genre']);
    if (missing.length && !prompt) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const effectivePrompt = prompt ||
      `Generate 3 plot twist options for the following ${genre} comic story:\n\n${story_so_far}`;

    const sysPrompt = `You are a master comic book plot architect. Generate exactly 3 distinct, compelling plot twist options. For each twist provide:
1. **Twist Title** — a short evocative name
2. **The Twist** — the dramatic reveal in 2-3 sentences
3. **Foreshadowing** — 3 subtle clues that could be planted earlier in the story
4. **Impact Analysis** — how it changes the story direction, tone, and character arcs
5. **Visual Reveal** — describe the perfect panel composition to reveal this twist
6. **Aftermath** — what happens in the next 2-3 scenes after the reveal

Genre: ${genre || 'Superhero'}. Make each option tonally distinct (e.g., one dark, one hopeful, one unexpected).`;

    const generated = await callOpenRouter(effectivePrompt, sysPrompt);

    const result = await pool.query(
      `INSERT INTO ai_plot_twists (prompt, story_context, generated_twist, twist_type, intensity, model_used, rating)
       VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [effectivePrompt, story_so_far || story_context || '', generated, twist_type || genre || 'Revelation', intensity || 'High', MODEL]
    );
    res.json({ ...result.rows[0], twists: generated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Legacy generate-plot-twist (old route kept for backward compat) ───────────
router.post('/generate-plot-twist', aiRateLimiter, async (req, res) => {
  try {
    const { prompt, story_context, twist_type, intensity } = req.body;
    const missing = validate(req.body, ['prompt']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const sysPrompt = `You are a master comic book plot architect. Generate a mind-blowing plot twist. Include: The Twist (dramatic reveal), Setup (how to foreshadow it - list 3 clues), Impact (how it changes the story), Character Reactions (how 2-3 characters respond), Visual Reveal (describe the perfect panel to reveal this twist), and Aftermath (what happens next). Twist type: ${twist_type || 'Revelation'}. Intensity: ${intensity || 'High'}. Make it shocking but logical in hindsight.`;
    const generated = await callOpenRouter(prompt, sysPrompt);
    const result = await pool.query(
      `INSERT INTO ai_plot_twists (prompt, story_context, generated_twist, twist_type, intensity, model_used, rating) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [prompt, story_context || '', generated, twist_type || 'Revelation', intensity || 'High', MODEL]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate-panel ─────────────────────────────────────────────
// Takes {story_id, scene_description, panel_number, dialogue, mood, layout} → panel description + saves to panels table
router.post('/generate-panel', aiRateLimiter, async (req, res) => {
  try {
    const { story_id, scene_description, panel_number, dialogue, mood, layout } = req.body;

    const missing = validate(req.body, ['story_id', 'scene_description', 'panel_number']);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    if (!Number.isInteger(Number(panel_number)) || Number(panel_number) < 1) {
      return res.status(400).json({ error: 'panel_number must be a positive integer' });
    }

    // Verify story exists
    const storyResult = await pool.query('SELECT id, title, genre FROM comic_stories WHERE id = $1', [story_id]);
    if (storyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }
    const story = storyResult.rows[0];

    const prompt = `
Create a detailed comic panel description with full art direction for the following panel:

Story: "${story.title}" (${story.genre || 'Comic'})
Panel Number: ${panel_number}
Scene Description: ${scene_description}
Mood/Atmosphere: ${mood || 'Dynamic'}
Panel Layout: ${layout || 'Standard'}
${dialogue ? `Dialogue: ${dialogue}` : ''}

Provide:
1. **Panel Composition** — camera angle, framing, perspective (close-up/wide/medium shot)
2. **Visual Layout** — how the panel is divided, bleed edges, panel shape
3. **Art Direction** — detailed instructions for the artist including line weight, shadow style, color approach
4. **Background** — detailed environment description (at least 5 specific elements)
5. **Character Staging** — exact positions, poses, expressions, body language
6. **Lighting** — source, direction, quality, shadow placement
7. **Color Palette** — dominant colors, accent colors, emotional color choices
8. **Sound Effects / Text** — KAPOW, WHOOSH, etc. placement and style
9. **Mood Enhancement** — visual techniques to reinforce the emotional tone
10. **Transition Note** — how this panel connects to the next

Make the description specific enough that an artist could draw it without additional reference.
    `.trim();

    const generated = await callOpenRouter(prompt, SYSTEM_PROMPT);

    // Save to panels table
    const panelResult = await pool.query(
      `INSERT INTO comic_panels (story_id, panel_number, scene_description, dialogue, mood, layout_type, art_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [story_id, panel_number, scene_description, dialogue || '', mood || 'Dynamic', layout || 'standard', generated]
    );

    const panel = panelResult.rows[0];
    res.status(201).json({
      ...panel,
      generated_description: generated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/translate-story ─────────────────────────────────────────────
// Translates a comic story into a target language while preserving comic structure.
// Body: { story_text, target_language, preserve_panel_breaks?, tone? }
router.post('/translate-story', aiRateLimiter, async (req, res) => {
  try {
    const { story_text, target_language, preserve_panel_breaks, tone } = req.body;
    const missing = validate(req.body, ['story_text', 'target_language']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const sysPrompt = `You are a professional comic book translator. Translate the provided comic story into ${target_language}, preserving:
- character names (transliterate or keep as appropriate for ${target_language})
- onomatopoeia / sound effects (note when culturally adapted)
- panel and scene breaks${preserve_panel_breaks === false ? ' (you may merge if it improves flow)' : ' exactly as in the source'}
- the original tone${tone ? ` (target tone: ${tone})` : ''}
Return: 1) **Translated Story** in ${target_language}, 2) **Translator Notes** flagging any cultural adaptations, idiom choices, or untranslatable wordplay.`;
    const generated = await callOpenRouter(story_text, sysPrompt);
    res.json({
      target_language,
      tone: tone || 'Source',
      translation: generated,
      model_used: MODEL,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate-narration ──────────────────────────────────────────
// Generates an audio-narration script (audiobook / motion-comic) from a comic story.
// Body: { story_text, voice_style?, pacing?, include_sound_effects? }
router.post('/generate-narration', aiRateLimiter, async (req, res) => {
  try {
    const { story_text, voice_style, pacing, include_sound_effects } = req.body;
    const missing = validate(req.body, ['story_text']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const sysPrompt = `You are an audiobook director adapting a comic for narration. Produce a narration script with:
1. **Narrator Cues** — voice direction (tone, pace, emphasis)
2. **Character Lines** — labeled with speaker, with parenthetical performance notes
3. **Scene Beats** — 1-2 sentence scene-setting descriptions where panels would be silent
4. **Sound Effect Cues** — ${include_sound_effects === false ? 'omit unless essential' : 'placed inline as [SFX: …]'}
5. **Estimated Runtime** — at the end (assume ~150 words/min)
Voice style: ${voice_style || 'Cinematic narrator'}. Pacing: ${pacing || 'Moderate'}.`;
    const generated = await callOpenRouter(story_text, sysPrompt);
    res.json({
      voice_style: voice_style || 'Cinematic narrator',
      pacing: pacing || 'Moderate',
      narration_script: generated,
      model_used: MODEL,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;

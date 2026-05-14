import React, { useState, useEffect } from 'react';
import { useAuth } from '../App.jsx';

const styles = {
  page: { maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem' },
  title: { fontSize: '1.8rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem' },
  subtitle: { color: '#64748b', marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  label: { color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' },
  input: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', padding: '0.65rem 1rem', fontSize: '0.9rem' },
  textarea: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', padding: '0.65rem 1rem', fontSize: '0.9rem', resize: 'vertical', minHeight: '100px' },
  select: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', padding: '0.65rem 1rem', fontSize: '0.9rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  btn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 2rem', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  result: { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' },
  resultTitle: { color: '#a78bfa', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' },
  resultText: { color: '#94a3b8', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap' },
  error: { color: '#f87171', fontSize: '0.85rem', background: '#2d1b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' },
  notice: { color: '#fbbf24', fontSize: '0.85rem', background: '#2d2615', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #2d3748', flexWrap: 'wrap' },
  tab: { background: 'none', border: 'none', color: '#64748b', padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '2px solid transparent', fontWeight: 500 },
  tabActive: { color: '#a78bfa', borderBottomColor: '#a78bfa' },
};

const ARCHETYPES = ['Hero', 'Anti-Hero', 'Mentor', 'Sidekick', 'Trickster', 'Guardian', 'Shapeshifter'];
const CHARACTER_STYLES = ['Superhero', 'Manga', 'Western Comic', 'Indie', 'Cartoon', 'Realistic', 'Cyberpunk'];
const ART_STYLES = ['Modern', 'Classic', 'Manga', 'Indie', 'Noir', 'Watercolor', 'Pop Art'];
const COLOR_MOODS = ['Vibrant', 'Muted', 'Dark', 'Pastel', 'Monochrome', 'Neon'];
const SETTINGS = ['Urban City', 'Space Station', 'Medieval Kingdom', 'Post-Apocalyptic', 'Underwater', 'Forest', 'Desert', 'Mountain'];
const TIMES = ['Dawn', 'Morning', 'Noon', 'Afternoon', 'Dusk', 'Night', 'Midnight'];
const WEATHER = ['Clear', 'Rainy', 'Stormy', 'Snowy', 'Foggy', 'Sunny'];
const MOODS = ['Dramatic', 'Tense', 'Joyful', 'Eerie', 'Heroic', 'Melancholic', 'Action-packed'];
const EMOTIONS = ['Dramatic', 'Comedic', 'Tense', 'Romantic', 'Angry', 'Fearful'];
const LAYOUTS = ['standard', 'splash', 'two-page-spread', 'grid', 'asymmetric'];
const LANGUAGES = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Mandarin', 'Arabic', 'Hindi', 'Russian'];
const VOICE_STYLES = ['Cinematic narrator', 'Noir detective', 'Energetic announcer', 'Soft-spoken', 'Comedic', 'Heroic'];
const PACINGS = ['Slow', 'Moderate', 'Fast', 'Variable'];

// Comic AI's auth token key (matches App.jsx login storage). We send it as Bearer
// for forward-compat even though the AI routes are currently public.
function getAuthHeaders() {
  const token = localStorage.getItem('comic_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function callAI(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = { error: 'Invalid response from server' };
  }
  if (!res.ok) {
    // Detect missing key (the backend currently surfaces these as 500 because
    // OpenRouter returns an auth error). Surface a friendlier message.
    const msg = (data && data.error) || `Request failed (${res.status})`;
    if (res.status === 503 || /OPENROUTER_API_KEY|api key|unauthor/i.test(msg)) {
      throw new Error('AI service unavailable: OPENROUTER_API_KEY not configured on server.');
    }
    throw new Error(msg);
  }
  return data;
}

function ResultBlock({ title, text }) {
  if (!text) return null;
  return (
    <div style={styles.result}>
      <div style={styles.resultTitle}>{title}</div>
      <div style={styles.resultText}>{text}</div>
    </div>
  );
}

export default function AITools() {
  const { isLoggedIn } = useAuth();
  const [tab, setTab] = useState('character');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Character
  const [charPrompt, setCharPrompt] = useState('');
  const [charStyle, setCharStyle] = useState('Superhero');
  const [charArchetype, setCharArchetype] = useState('Hero');
  const [charResult, setCharResult] = useState(null);

  // Dialogue
  const [dlgPrompt, setDlgPrompt] = useState('');
  const [dlgChars, setDlgChars] = useState('');
  const [dlgEmotion, setDlgEmotion] = useState('Dramatic');
  const [dlgContext, setDlgContext] = useState('');
  const [dlgResult, setDlgResult] = useState(null);

  // Art Suggestion
  const [artPrompt, setArtPrompt] = useState('');
  const [artStyleType, setArtStyleType] = useState('Modern');
  const [artColorMood, setArtColorMood] = useState('Vibrant');
  const [artResult, setArtResult] = useState(null);

  // Scene
  const [scenePrompt, setScenePrompt] = useState('');
  const [sceneSetting, setSceneSetting] = useState('Urban City');
  const [sceneTime, setSceneTime] = useState('Night');
  const [sceneWeather, setSceneWeather] = useState('Clear');
  const [sceneMood, setSceneMood] = useState('Dramatic');
  const [sceneResult, setSceneResult] = useState(null);

  // Translate
  const [trStory, setTrStory] = useState('');
  const [trLang, setTrLang] = useState('Spanish');
  const [trTone, setTrTone] = useState('');
  const [trResult, setTrResult] = useState(null);

  // Narration
  const [narStory, setNarStory] = useState('');
  const [narVoice, setNarVoice] = useState('Cinematic narrator');
  const [narPacing, setNarPacing] = useState('Moderate');
  const [narSfx, setNarSfx] = useState(true);
  const [narResult, setNarResult] = useState(null);

  // Panel
  const [panelStoryId, setPanelStoryId] = useState('');
  const [panelNumber, setPanelNumber] = useState(1);
  const [panelScene, setPanelScene] = useState('');
  const [panelDialogue, setPanelDialogue] = useState('');
  const [panelMood, setPanelMood] = useState('Dynamic');
  const [panelLayout, setPanelLayout] = useState('standard');
  const [panelResult, setPanelResult] = useState(null);
  const [stories, setStories] = useState([]);

  // Lazy-load story list when panel tab is selected (so the user can pick).
  useEffect(() => {
    if (tab !== 'panel' || stories.length > 0) return;
    let alive = true;
    fetch('/api/stories')
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (alive) setStories(Array.isArray(data) ? data : data.stories || []);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [tab, stories.length]);

  function reset() {
    setError('');
  }

  async function handle(fn) {
    reset();
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err.message || 'Request failed');
    }
    setBusy(false);
  }

  async function genCharacter(e) {
    e.preventDefault();
    if (!charPrompt.trim()) return;
    setCharResult(null);
    handle(async () => {
      const data = await callAI('/api/ai/generate-character', {
        prompt: charPrompt,
        style: charStyle,
        archetype: charArchetype,
      });
      setCharResult(data);
    });
  }

  async function genDialogue(e) {
    e.preventDefault();
    if (!dlgPrompt.trim()) return;
    setDlgResult(null);
    handle(async () => {
      const data = await callAI('/api/ai/generate-dialogue', {
        prompt: dlgPrompt,
        scene_context: dlgContext,
        characters_involved: dlgChars,
        emotion: dlgEmotion,
      });
      setDlgResult(data);
    });
  }

  async function genArtSuggestion(e) {
    e.preventDefault();
    if (!artPrompt.trim()) return;
    setArtResult(null);
    handle(async () => {
      const data = await callAI('/api/ai/generate-art-suggestion', {
        prompt: artPrompt,
        style_type: artStyleType,
        color_mood: artColorMood,
      });
      setArtResult(data);
    });
  }

  async function genScene(e) {
    e.preventDefault();
    if (!scenePrompt.trim()) return;
    setSceneResult(null);
    handle(async () => {
      const data = await callAI('/api/ai/generate-scene', {
        prompt: scenePrompt,
        setting: sceneSetting,
        time_of_day: sceneTime,
        weather: sceneWeather,
        mood: sceneMood,
      });
      setSceneResult(data);
    });
  }

  async function genTranslate(e) {
    e.preventDefault();
    if (!trStory.trim() || !trLang) return;
    setTrResult(null);
    handle(async () => {
      const data = await callAI('/api/ai/translate-story', {
        story_text: trStory,
        target_language: trLang,
        tone: trTone || undefined,
      });
      setTrResult(data);
    });
  }

  async function genNarration(e) {
    e.preventDefault();
    if (!narStory.trim()) return;
    setNarResult(null);
    handle(async () => {
      const data = await callAI('/api/ai/generate-narration', {
        story_text: narStory,
        voice_style: narVoice,
        pacing: narPacing,
        include_sound_effects: narSfx,
      });
      setNarResult(data);
    });
  }

  async function genPanel(e) {
    e.preventDefault();
    if (!panelStoryId || !panelScene.trim()) return;
    setPanelResult(null);
    handle(async () => {
      const data = await callAI('/api/ai/generate-panel', {
        story_id: Number(panelStoryId),
        scene_description: panelScene,
        panel_number: Number(panelNumber),
        dialogue: panelDialogue,
        mood: panelMood,
        layout: panelLayout,
      });
      setPanelResult(data);
    });
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>AI Tools</h1>
      <p style={styles.subtitle}>Characters, dialogue, art direction, scenes, and panel art notes.</p>

      <div style={styles.tabs}>
        {[
          ['character', 'Character'],
          ['dialogue', 'Dialogue'],
          ['art', 'Art Style'],
          ['scene', 'Scene'],
          ['panel', 'Panel'],
          ['translate', 'Translate'],
          ['narration', 'Narration'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            style={{ ...styles.tab, ...(tab === key ? styles.tabActive : {}) }}
            onClick={() => { setTab(key); setError(''); }}
          >
            {label}
          </button>
        ))}
      </div>

      {!isLoggedIn && (
        <div style={styles.notice}>
          You can use AI tools without logging in, but logged-in users get richer rate limits.
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {tab === 'character' && (
        <form style={styles.form} onSubmit={genCharacter}>
          <div>
            <label style={styles.label}>Character Concept *</label>
            <textarea
              style={styles.textarea}
              placeholder="Describe the character you want to design..."
              value={charPrompt}
              onChange={e => setCharPrompt(e.target.value)}
              required
            />
          </div>
          <div style={styles.row}>
            <div>
              <label style={styles.label}>Style</label>
              <select style={styles.select} value={charStyle} onChange={e => setCharStyle(e.target.value)}>
                {CHARACTER_STYLES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Archetype</label>
              <select style={styles.select} value={charArchetype} onChange={e => setCharArchetype(e.target.value)}>
                {ARCHETYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(busy ? styles.btnDisabled : {}) }} disabled={busy}>
            {busy ? 'Generating...' : 'Generate Character'}
          </button>
          {charResult && (
            <ResultBlock
              title={charResult.character_name ? `Character: ${charResult.character_name}` : 'Character Profile'}
              text={charResult.generated_design}
            />
          )}
        </form>
      )}

      {tab === 'dialogue' && (
        <form style={styles.form} onSubmit={genDialogue}>
          <div>
            <label style={styles.label}>Scene / Beat *</label>
            <textarea
              style={styles.textarea}
              placeholder="Describe what's happening in the scene..."
              value={dlgPrompt}
              onChange={e => setDlgPrompt(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={styles.label}>Scene Context (optional)</label>
            <input
              style={styles.input}
              placeholder="e.g., Rooftop confrontation after a heist"
              value={dlgContext}
              onChange={e => setDlgContext(e.target.value)}
            />
          </div>
          <div style={styles.row}>
            <div>
              <label style={styles.label}>Characters</label>
              <input
                style={styles.input}
                placeholder="e.g., Hero, Villain, Sidekick"
                value={dlgChars}
                onChange={e => setDlgChars(e.target.value)}
              />
            </div>
            <div>
              <label style={styles.label}>Emotion</label>
              <select style={styles.select} value={dlgEmotion} onChange={e => setDlgEmotion(e.target.value)}>
                {EMOTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(busy ? styles.btnDisabled : {}) }} disabled={busy}>
            {busy ? 'Generating...' : 'Generate Dialogue'}
          </button>
          {dlgResult && (
            <ResultBlock title="Generated Dialogue" text={dlgResult.generated_dialogue} />
          )}
        </form>
      )}

      {tab === 'art' && (
        <form style={styles.form} onSubmit={genArtSuggestion}>
          <div>
            <label style={styles.label}>Project Description *</label>
            <textarea
              style={styles.textarea}
              placeholder="Describe the comic project for an art-style recommendation..."
              value={artPrompt}
              onChange={e => setArtPrompt(e.target.value)}
              required
            />
          </div>
          <div style={styles.row}>
            <div>
              <label style={styles.label}>Style Category</label>
              <select style={styles.select} value={artStyleType} onChange={e => setArtStyleType(e.target.value)}>
                {ART_STYLES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Color Mood</label>
              <select style={styles.select} value={artColorMood} onChange={e => setArtColorMood(e.target.value)}>
                {COLOR_MOODS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(busy ? styles.btnDisabled : {}) }} disabled={busy}>
            {busy ? 'Generating...' : 'Suggest Art Style'}
          </button>
          {artResult && (
            <ResultBlock title="Art Style Recommendation" text={artResult.generated_suggestion} />
          )}
        </form>
      )}

      {tab === 'scene' && (
        <form style={styles.form} onSubmit={genScene}>
          <div>
            <label style={styles.label}>Scene Brief *</label>
            <textarea
              style={styles.textarea}
              placeholder="Describe the scene (what's happening, who's there)..."
              value={scenePrompt}
              onChange={e => setScenePrompt(e.target.value)}
              required
            />
          </div>
          <div style={styles.row}>
            <div>
              <label style={styles.label}>Setting</label>
              <select style={styles.select} value={sceneSetting} onChange={e => setSceneSetting(e.target.value)}>
                {SETTINGS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Time of Day</label>
              <select style={styles.select} value={sceneTime} onChange={e => setSceneTime(e.target.value)}>
                {TIMES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={styles.row}>
            <div>
              <label style={styles.label}>Weather</label>
              <select style={styles.select} value={sceneWeather} onChange={e => setSceneWeather(e.target.value)}>
                {WEATHER.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Mood</label>
              <select style={styles.select} value={sceneMood} onChange={e => setSceneMood(e.target.value)}>
                {MOODS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(busy ? styles.btnDisabled : {}) }} disabled={busy}>
            {busy ? 'Generating...' : 'Generate Scene'}
          </button>
          {sceneResult && (
            <ResultBlock title="Scene Description" text={sceneResult.generated_scene} />
          )}
        </form>
      )}

      {tab === 'panel' && (
        <form style={styles.form} onSubmit={genPanel}>
          <div>
            <label style={styles.label}>Story *</label>
            <select
              style={styles.select}
              value={panelStoryId}
              onChange={e => setPanelStoryId(e.target.value)}
              required
            >
              <option value="">Select a story…</option>
              {stories.map(s => (
                <option key={s.id} value={s.id}>{s.title || `Story #${s.id}`}</option>
              ))}
            </select>
          </div>
          <div style={styles.row}>
            <div>
              <label style={styles.label}>Panel Number *</label>
              <input
                type="number"
                min="1"
                style={styles.input}
                value={panelNumber}
                onChange={e => setPanelNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Layout</label>
              <select style={styles.select} value={panelLayout} onChange={e => setPanelLayout(e.target.value)}>
                {LAYOUTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={styles.label}>Scene Description *</label>
            <textarea
              style={styles.textarea}
              placeholder="What does this panel show?"
              value={panelScene}
              onChange={e => setPanelScene(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={styles.label}>Dialogue (optional)</label>
            <input
              style={styles.input}
              placeholder='e.g., "We had one job!"'
              value={panelDialogue}
              onChange={e => setPanelDialogue(e.target.value)}
            />
          </div>
          <div>
            <label style={styles.label}>Mood</label>
            <select style={styles.select} value={panelMood} onChange={e => setPanelMood(e.target.value)}>
              {MOODS.concat(['Dynamic']).filter((v, i, a) => a.indexOf(v) === i).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(busy ? styles.btnDisabled : {}) }} disabled={busy}>
            {busy ? 'Generating...' : 'Generate Panel'}
          </button>
          {panelResult && (
            <ResultBlock
              title={`Panel ${panelResult.panel_number || ''} — Art Notes`}
              text={panelResult.generated_description || panelResult.art_notes}
            />
          )}
        </form>
      )}

      {tab === 'translate' && (
        <form style={styles.form} onSubmit={genTranslate}>
          <div>
            <label style={styles.label}>Story Text *</label>
            <textarea
              style={styles.textarea}
              placeholder="Paste the comic story or script you want translated..."
              value={trStory}
              onChange={e => setTrStory(e.target.value)}
              required
            />
          </div>
          <div style={styles.row}>
            <div>
              <label style={styles.label}>Target Language *</label>
              <select style={styles.select} value={trLang} onChange={e => setTrLang(e.target.value)}>
                {LANGUAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Tone Override (optional)</label>
              <input
                style={styles.input}
                placeholder="e.g., More formal, Slangy"
                value={trTone}
                onChange={e => setTrTone(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(busy ? styles.btnDisabled : {}) }} disabled={busy}>
            {busy ? 'Translating...' : 'Translate Story'}
          </button>
          {trResult && (
            <ResultBlock
              title={`Translation — ${trResult.target_language}`}
              text={trResult.translation}
            />
          )}
        </form>
      )}

      {tab === 'narration' && (
        <form style={styles.form} onSubmit={genNarration}>
          <div>
            <label style={styles.label}>Story Text *</label>
            <textarea
              style={styles.textarea}
              placeholder="Paste the comic story to be adapted into narration..."
              value={narStory}
              onChange={e => setNarStory(e.target.value)}
              required
            />
          </div>
          <div style={styles.row}>
            <div>
              <label style={styles.label}>Voice Style</label>
              <select style={styles.select} value={narVoice} onChange={e => setNarVoice(e.target.value)}>
                {VOICE_STYLES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Pacing</label>
              <select style={styles.select} value={narPacing} onChange={e => setNarPacing(e.target.value)}>
                {PACINGS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={narSfx} onChange={e => setNarSfx(e.target.checked)} />
              Include sound effect cues
            </label>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(busy ? styles.btnDisabled : {}) }} disabled={busy}>
            {busy ? 'Generating...' : 'Generate Narration Script'}
          </button>
          {narResult && (
            <ResultBlock
              title={`Narration — ${narResult.voice_style}`}
              text={narResult.narration_script}
            />
          )}
        </form>
      )}
    </div>
  );
}

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import FullFieldPresets from '../components/FullFieldPresets';
import AIReport from '../components/AIReport';

const styles = {
  page: { maxWidth: '700px', margin: '0 auto', padding: '2rem 1.5rem' },
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
  error: { color: '#f87171', fontSize: '0.85rem', background: '#2d1b1b', padding: '0.75rem', borderRadius: '6px' },
  viewBtn: { background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 600, marginTop: '1rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #2d3748' },
  tab: { background: 'none', border: 'none', color: '#64748b', padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '2px solid transparent', fontWeight: 500 },
  tabActive: { color: '#a78bfa', borderBottomColor: '#a78bfa' },
};

const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Superhero', 'Cyberpunk', 'Post-Apocalyptic'];
const TONES = ['Epic', 'Dark', 'Lighthearted', 'Gritty', 'Whimsical', 'Dramatic', 'Suspenseful'];

const STORY_EXAMPLES = [
  { label: 'City rescue', values: { storyPrompt: 'Nova, a rookie solar-powered hero, must evacuate a flooded city while discovering why its emergency beacons failed. Create three acts, vivid panels, and a hopeful cliffhanger.', genre: 'Superhero', tone: 'Epic' } },
  { label: 'Moon mystery', values: { storyPrompt: 'A librarian on a moon colony investigates a missing star map with a repair robot. Plant fair clues, a surprising motive, and an unresolved final signal.', genre: 'Mystery', tone: 'Suspenseful' } },
  { label: 'Forest quest', values: { storyPrompt: 'A young cartographer and a talking fox cross a moving forest to return a lost constellation. Include visual humor, a difficult choice, and a magical cliffhanger.', genre: 'Fantasy', tone: 'Whimsical' } },
];
const VILLAIN_EXAMPLES = [
  { label: 'City rescue', values: { villainGenre: 'Superhero', heroCharacter: 'Nova is a rookie hero who stores sunlight, protects flood survivors, and fears abandoning anyone. Design an original antagonist with a contrasting goal and a visual weakness.' } },
  { label: 'Moon mystery', values: { villainGenre: 'Mystery', heroCharacter: 'Mira is a moon-colony librarian who solves puzzles using forgotten maps and an honest repair robot. Create a layered adversary with a believable motive.' } },
  { label: 'Forest quest', values: { villainGenre: 'Fantasy', heroCharacter: 'Ari is a young cartographer traveling with a talking fox to return a constellation. Create a magical rival with a sympathetic backstory and distinctive silhouette.' } },
];
const TWIST_EXAMPLES = [
  { label: 'City rescue', values: { twistGenre: 'Superhero', storySoFar: 'Nova restores the flood beacons, but their signal points to a sealed reservoir. Her mentor has hidden the original engineering plans. Propose three twists grounded in these clues.' } },
  { label: 'Moon mystery', values: { twistGenre: 'Mystery', storySoFar: 'Mira finds the missing map etched inside her repair robot. Its last repair predates the colony. Propose three fair but surprising explanations with setup clues.' } },
  { label: 'Forest quest', values: { twistGenre: 'Fantasy', storySoFar: 'Ari reaches the constellation shrine, where the fox loses its voice and the forest stops moving. Propose three twists that reinterpret their journey without erasing Ari’s choices.' } },
];


export default function CreateStory() {
  const { token } = useAuth();
  const pending = useRef(false);
  const navigate = useNavigate();
  const [tab, setTab] = useState('story');

  // Story form
  const [storyPrompt, setStoryPrompt] = useState('');
  const [genre, setGenre] = useState('Superhero');
  const [tone, setTone] = useState('Epic');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Villain form
  const [villainGenre, setVillainGenre] = useState('Superhero');
  const [heroCharacter, setHeroCharacter] = useState('');
  const [villainResult, setVillainResult] = useState(null);

  // Plot twist form
  const [storySoFar, setStorySoFar] = useState('');
  const [twistGenre, setTwistGenre] = useState('Superhero');
  const [twistResult, setTwistResult] = useState(null);

  async function generateStory(e) {
    e.preventDefault();
    if (pending.current || !token || generating || !storyPrompt.trim()) return;
    pending.current = true;
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: storyPrompt, genre, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    pending.current = false;
    setGenerating(false);
  }

  async function generateVillain(e) {
    e.preventDefault();
    if (pending.current || !token || generating || !heroCharacter.trim()) return;
    pending.current = true;
    setGenerating(true);
    setError('');
    setVillainResult(null);
    try {
      const res = await fetch('/api/ai/generate-villain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ story_genre: villainGenre, hero_character: heroCharacter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setVillainResult(data);
    } catch (err) {
      setError(err.message);
    }
    pending.current = false;
    setGenerating(false);
  }

  async function generateTwists(e) {
    e.preventDefault();
    if (pending.current || !token || generating || !storySoFar.trim()) return;
    pending.current = true;
    setGenerating(true);
    setError('');
    setTwistResult(null);
    try {
      const res = await fetch('/api/ai/plot-twist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ story_so_far: storySoFar, genre: twistGenre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setTwistResult(data);
    } catch (err) {
      setError(err.message);
    }
    pending.current = false;
    setGenerating(false);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>AI Story Studio</h1>
      <p style={styles.subtitle}>Generate stories, villains, and plot twists with AI</p>

      <div style={styles.tabs}>
        {[['story', 'Generate Story'], ['villain', 'Generate Villain'], ['twist', 'Plot Twists']].map(([key, label]) => (
          <button
            key={key}
            style={{ ...styles.tab, ...(tab === key ? styles.tabActive : {}) }}
            onClick={() => { setTab(key); setError(''); }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {tab === 'story' && (
        <form style={styles.form} onSubmit={generateStory}>
          <FullFieldPresets value={{storyPrompt,genre,tone}} onChange={v=>{setStoryPrompt(v.storyPrompt);setGenre(v.genre);setTone(v.tone);}} presets={STORY_EXAMPLES} disabled={generating || !token} />
          <div>
            <label style={styles.label}>Story Prompt *</label>
            <textarea
              style={styles.textarea}
              placeholder="Describe your comic story idea..."
              value={storyPrompt}
              onChange={e => setStoryPrompt(e.target.value)}
              required
            />
          </div>
          <div style={styles.row}>
            <div>
              <label style={styles.label}>Genre</label>
              <select style={styles.select} value={genre} onChange={e => setGenre(e.target.value)}>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Tone</label>
              <select style={styles.select} value={tone} onChange={e => setTone(e.target.value)}>
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(generating ? styles.btnDisabled : {}) }} disabled={generating || !token}>
            {generating ? 'Generating...' : 'Generate Story'}
          </button>
        </form>
      )}

      {tab === 'villain' && (
        <form style={styles.form} onSubmit={generateVillain}>
          <FullFieldPresets value={{heroCharacter,villainGenre}} onChange={v=>{setHeroCharacter(v.heroCharacter);setVillainGenre(v.villainGenre);}} presets={VILLAIN_EXAMPLES} disabled={generating || !token} />
          <div>
            <label style={styles.label}>Hero Character *</label>
            <input
              style={styles.input}
              placeholder="e.g., Spider-Man, a time-traveling detective..."
              value={heroCharacter}
              onChange={e => setHeroCharacter(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={styles.label}>Story Genre</label>
            <select style={styles.select} value={villainGenre} onChange={e => setVillainGenre(e.target.value)}>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(generating ? styles.btnDisabled : {}) }} disabled={generating || !token}>
            {generating ? 'Generating...' : 'Generate Villain'}
          </button>
        </form>
      )}

      {tab === 'twist' && (
        <form style={styles.form} onSubmit={generateTwists}>
          <FullFieldPresets value={{storySoFar,twistGenre}} onChange={v=>{setStorySoFar(v.storySoFar);setTwistGenre(v.twistGenre);}} presets={TWIST_EXAMPLES} disabled={generating || !token} />
          <div>
            <label style={styles.label}>Story So Far *</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '140px' }}
              placeholder="Summarize your story up to this point..."
              value={storySoFar}
              onChange={e => setStorySoFar(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={styles.label}>Genre</label>
            <select style={styles.select} value={twistGenre} onChange={e => setTwistGenre(e.target.value)}>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <button type="submit" style={{ ...styles.btn, ...(generating ? styles.btnDisabled : {}) }} disabled={generating || !token}>
            {generating ? 'Generating...' : 'Generate 3 Plot Twists'}
          </button>
        </form>
      )}

      {result && tab === 'story' && (
        <div style={styles.result}>
          <div style={styles.resultTitle}>Generated Story</div>
          <AIReport response={result.generated_story} title="Generated story" model={result.model_used} />
          <button style={styles.viewBtn} onClick={() => navigate('/')}>
            View All Stories
          </button>
        </div>
      )}

      {villainResult && tab === 'villain' && (
        <div style={styles.result}>
          <div style={styles.resultTitle}>Villain: {villainResult.villain_name}</div>
          <AIReport response={villainResult.generated_profile} title="Villain profile" model={villainResult.model_used} />
        </div>
      )}

      {twistResult && tab === 'twist' && (
        <div style={styles.result}>
          <div style={styles.resultTitle}>Plot Twist Options</div>
          <AIReport response={twistResult.generated_twist} title="Plot twist options" model={twistResult.model_used} />
        </div>
      )}
    </div>
  );
}

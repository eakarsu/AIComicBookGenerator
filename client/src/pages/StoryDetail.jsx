import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

const styles = {
  page: { maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' },
  back: { color: '#6366f1', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', background: 'none', border: 'none' },
  header: { marginBottom: '2rem', background: '#1e293b', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2d3748' },
  headerBg: { height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' },
  headerBody: { padding: '1.5rem' },
  title: { fontSize: '1.8rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.75rem' },
  meta: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' },
  badge: { background: '#334155', borderRadius: '6px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', color: '#94a3b8' },
  synopsis: { color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #2d3748' },
  panelGrid: { display: 'grid', gap: '1rem' },
  panel: { background: '#1e293b', border: '1px solid #2d3748', borderRadius: '10px', padding: '1.25rem' },
  panelNum: { color: '#6366f1', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' },
  panelScene: { color: '#e2e8f0', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' },
  panelMood: { color: '#64748b', fontSize: '0.8rem', marginBottom: '0.5rem' },
  panelDialogue: { color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', background: '#0f172a', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #6366f1' },
  panelNotes: { color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.5 },
  ratingSection: { background: '#1e293b', border: '1px solid #2d3748', borderRadius: '12px', padding: '1.5rem' },
  stars: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  star: { fontSize: '1.8rem', cursor: 'pointer', transition: 'transform 0.1s', color: '#334155' },
  starActive: { color: '#f59e0b' },
  textarea: { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', padding: '0.75rem', fontSize: '0.9rem', resize: 'vertical', minHeight: '80px' },
  btn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.75rem' },
  avgRating: { color: '#f59e0b', fontWeight: 700, fontSize: '1.2rem' },
  loading: { color: '#64748b', textAlign: 'center', padding: '4rem 0' },
  emptyPanels: { color: '#64748b', textAlign: 'center', padding: '2rem', background: '#1e293b', borderRadius: '10px' },
  ratingMsg: { color: '#10b981', fontSize: '0.85rem', marginTop: '0.5rem' },
};

function StarDisplay({ rating }) {
  const r = Math.round(parseFloat(rating) || 0);
  return (
    <span style={{ color: '#f59e0b' }}>
      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
    </span>
  );
}

export default function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, token } = useAuth();

  const [story, setStory] = useState(null);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingMsg, setRatingMsg] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchStory();
    fetchPanels();
  }, [id]);

  async function fetchStory() {
    try {
      const res = await fetch(`/api/stories/${id}`);
      if (!res.ok) { navigate('/'); return; }
      const data = await res.json();
      setStory(data);
    } catch {
      navigate('/');
    }
    setLoading(false);
  }

  async function fetchPanels() {
    try {
      const res = await fetch(`/api/stories/${id}/panels`);
      const data = await res.json();
      setPanels(data.panels || []);
    } catch {
      setPanels([]);
    }
  }

  async function submitRating() {
    if (!selectedStar) return;
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/stories/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: selectedStar, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setRatingMsg('Rating submitted! Thanks for your feedback.');
        setStory(prev => ({ ...prev, avg_rating: data.avg_rating, rating_count: data.rating_count }));
      } else {
        setRatingMsg(data.error || 'Failed to submit rating');
      }
    } catch {
      setRatingMsg('Network error');
    }
    setSubmittingRating(false);
  }

  if (loading) return <p style={styles.loading}>Loading story...</p>;
  if (!story) return null;

  const avgRating = parseFloat(story.avg_rating) || 0;

  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={() => navigate(-1)}>← Back</button>

      <div style={styles.header}>
        <div style={{ ...styles.headerBg, background: story.cover_color || '#6366f1' }}>
          {story.genre === 'Horror' ? '👻' : story.genre === 'Sci-Fi' ? '🚀' : story.genre === 'Fantasy' ? '🐉' : '📖'}
        </div>
        <div style={styles.headerBody}>
          <h1 style={styles.title}>{story.title}</h1>
          <div style={styles.meta}>
            {story.genre && <span style={styles.badge}>{story.genre}</span>}
            {story.status && <span style={styles.badge}>{story.status}</span>}
            {story.author && <span style={{ ...styles.badge, background: 'transparent', paddingLeft: 0 }}>by {story.author}</span>}
          </div>
          {avgRating > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={styles.avgRating}>{avgRating.toFixed(1)} </span>
              <StarDisplay rating={avgRating} />
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}> ({story.rating_count} rating{story.rating_count !== 1 ? 's' : ''})</span>
            </div>
          )}
          {story.synopsis && <p style={styles.synopsis}>{story.synopsis}</p>}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Panels ({panels.length})</h2>
        {panels.length === 0 ? (
          <div style={styles.emptyPanels}>No panels yet. Generate panels with AI!</div>
        ) : (
          <div style={styles.panelGrid}>
            {panels.map(panel => (
              <div key={panel.id} style={styles.panel}>
                <div style={styles.panelNum}>Panel {panel.panel_number}</div>
                <div style={styles.panelScene}>{panel.scene_description}</div>
                {panel.mood && <div style={styles.panelMood}>Mood: {panel.mood} | Layout: {panel.layout_type}</div>}
                {panel.dialogue && (
                  <div style={styles.panelDialogue}>"{panel.dialogue}"</div>
                )}
                {panel.art_notes && (
                  <div style={styles.panelNotes}>
                    <strong style={{ color: '#475569' }}>Art Direction:</strong>
                    <div>{panel.art_notes.slice(0, 300)}{panel.art_notes.length > 300 ? '...' : ''}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Rate This Story</h2>
        <div style={styles.ratingSection}>
          {isLoggedIn ? (
            <>
              <div style={styles.stars}>
                {[1, 2, 3, 4, 5].map(n => (
                  <span
                    key={n}
                    style={{ ...styles.star, ...((hoverStar >= n || selectedStar >= n) ? styles.starActive : {}) }}
                    onMouseEnter={() => setHoverStar(n)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setSelectedStar(n)}
                  >
                    {hoverStar >= n || selectedStar >= n ? '★' : '☆'}
                  </span>
                ))}
                {selectedStar > 0 && <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '0.9rem' }}>{selectedStar}/5</span>}
              </div>
              <textarea
                style={styles.textarea}
                placeholder="Leave a comment (optional)..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <br />
              <button style={styles.btn} onClick={submitRating} disabled={!selectedStar || submittingRating}>
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
              {ratingMsg && <p style={styles.ratingMsg}>{ratingMsg}</p>}
            </>
          ) : (
            <p style={{ color: '#64748b' }}>Please <a href="/login" style={{ color: '#6366f1' }}>log in</a> to rate this story.</p>
          )}
        </div>
      </div>
    </div>
  );
}

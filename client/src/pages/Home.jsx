import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '2rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem' },
  subtitle: { color: '#64748b', fontSize: '1rem' },
  controls: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  input: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#e2e8f0',
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    flex: 1,
    minWidth: '200px',
  },
  select: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#e2e8f0',
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: '#1e293b',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #2d3748',
    textDecoration: 'none',
    display: 'block',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  cardHeader: {
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
  },
  cardBody: { padding: '1rem' },
  cardTitle: { color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' },
  cardMeta: { color: '#64748b', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  badge: {
    background: '#334155',
    borderRadius: '4px',
    padding: '0.15rem 0.5rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  stars: { color: '#f59e0b', fontSize: '0.85rem' },
  pagination: { display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' },
  pageBtn: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#e2e8f0',
    padding: '0.4rem 0.8rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  pageBtnActive: {
    background: '#6366f1',
    borderColor: '#6366f1',
  },
  empty: { color: '#64748b', textAlign: 'center', padding: '4rem 0' },
  loading: { color: '#64748b', textAlign: 'center', padding: '4rem 0' },
};

const GENRES = ['', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Superhero', 'Cyberpunk', 'Post-Apocalyptic'];

function StarRating({ rating }) {
  const r = parseFloat(rating) || 0;
  return (
    <span style={styles.stars}>
      {'★'.repeat(Math.round(r))}{'☆'.repeat(5 - Math.round(r))} {r > 0 ? r.toFixed(1) : ''}
    </span>
  );
}

export default function Home() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchStories();
  }, [page, genre, search]);

  async function fetchStories() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (genre) params.set('genre', genre);
      if (search) params.set('search', search);
      const res = await fetch(`/api/stories?${params}`);
      const data = await res.json();
      if (data.data) {
        setStories(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        setStories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      setStories([]);
    }
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleGenre(e) {
    setGenre(e.target.value);
    setPage(1);
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Comic Stories</h1>
        <p style={styles.subtitle}>Browse AI-generated comic book stories</p>
      </div>

      <div style={styles.controls}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
          <input
            style={styles.input}
            placeholder="Search stories..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" style={{ ...styles.pageBtnActive, ...styles.pageBtn }}>Search</button>
        </form>
        <select style={styles.select} value={genre} onChange={handleGenre}>
          <option value="">All Genres</option>
          {GENRES.filter(Boolean).map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={styles.loading}>Loading stories...</p>
      ) : stories.length === 0 ? (
        <p style={styles.empty}>No stories found. Try different filters or create one!</p>
      ) : (
        <div style={styles.grid}>
          {stories.map(story => (
            <Link
              key={story.id}
              to={`/stories/${story.id}`}
              style={styles.card}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#2d3748'; }}
            >
              <div style={{ ...styles.cardHeader, background: story.cover_color || '#6366f1' }}>
                {story.genre === 'Horror' ? '👻' : story.genre === 'Sci-Fi' ? '🚀' : story.genre === 'Fantasy' ? '🐉' : story.genre === 'Comedy' ? '😂' : story.genre === 'Romance' ? '💖' : '📖'}
              </div>
              <div style={styles.cardBody}>
                <div style={styles.cardTitle}>{story.title}</div>
                <div style={styles.cardMeta}>
                  <span style={styles.badge}>{story.genre || 'General'}</span>
                  <span style={styles.badge}>{story.status || 'Draft'}</span>
                  {story.author && <span>by {story.author}</span>}
                </div>
                {story.synopsis && (
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.4 }}>
                    {story.synopsis.slice(0, 100)}{story.synopsis.length > 100 ? '...' : ''}
                  </p>
                )}
                {parseFloat(story.avg_rating) > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <StarRating rating={story.avg_rating} />
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}> ({story.rating_count})</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                style={{ ...styles.pageBtn, ...(page === p ? styles.pageBtnActive : {}) }}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            );
          })}
          <button style={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

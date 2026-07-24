const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
require('./config/runtime').validateRuntime();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const crudRoutes = require('./routes/crud');
const aiRoutes = require('./routes/ai');
const storiesRoutes = require('./routes/stories');
const panelsRoutes = require('./routes/panels');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error('Origin not allowed')); }, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.get('/runtime-config.js', (_req, res) => {
  const enabled = process.env.NODE_ENV !== 'production'
    && process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL !== 'false'
    && process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD;
  const credentials = enabled ? { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD } : null;
  res.type('application/javascript').send(`window.DEMO_CREDENTIALS=${JSON.stringify(credentials)};`);
});
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/stories/:id/panels', panelsRoutes);
app.use('/api', crudRoutes);
app.use('/api/panel-continuity', require('./routes/panelContinuity'));
app.use('/api/publishing-workflow', require('./routes/publishingWorkflow'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/comic-studio-agent', require('./routes/comicStudioAgent')); // apply pass 6 — audit custom suggestion

app.use('/api/character-bible-rag', require('./routes/characterBibleRag')); // apply pass 6 — audit custom suggestion

app.use('/api/live-co-creation', require('./routes/liveCoCreation')); // apply pass 6 — audit custom suggestion

app.use('/api/webtoon-white-label', require('./routes/webtoonStudioWhiteLabel')); // apply pass 6 — audit custom suggestion
// SPA fallback must follow every API route.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
app.listen(PORT, () => {
  console.log(`🎨 AI Comic Book Generator running on http://localhost:${PORT}`);
});

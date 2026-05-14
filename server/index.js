const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const crudRoutes = require('./routes/crud');
const aiRoutes = require('./routes/ai');
const storiesRoutes = require('./routes/stories');
const panelsRoutes = require('./routes/panels');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/stories/:id/panels', panelsRoutes);
app.use('/api', crudRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


app.use('/api/comic-studio-agent', require('./routes/comicStudioAgent')); // apply pass 6 — audit custom suggestion

app.use('/api/character-bible-rag', require('./routes/characterBibleRag')); // apply pass 6 — audit custom suggestion

app.use('/api/live-co-creation', require('./routes/liveCoCreation')); // apply pass 6 — audit custom suggestion

app.use('/api/webtoon-white-label', require('./routes/webtoonStudioWhiteLabel')); // apply pass 6 — audit custom suggestion
app.listen(PORT, () => {
  console.log(`🎨 AI Comic Book Generator running on http://localhost:${PORT}`);
});


// === Batch 01 Gaps & Frontend Mounts ===
app.use('/api/gap-no-actual-image-generation-pipeline-only-text-endp', require('./routes/gap_no_actual_image_generation_pipeline_only_text_endp'));
app.use('/api/gap-no-ai-character-consistency-across-panels', require('./routes/gap_no_ai_character_consistency_across_panels'));
app.use('/api/gap-no-ai-lettering-speech-bubble-auto-layout', require('./routes/gap_no_ai_lettering_speech_bubble_auto_layout'));
app.use('/api/gap-no-ai-page-flow-pacing-recommender', require('./routes/gap_no_ai_page_flow_pacing_recommender'));
app.use('/api/gap-only-5-backend-routes-and-5-frontend-pages-thin-do', require('./routes/gap_only_5_backend_routes_and_5_frontend_pages_thin_do'));
app.use('/api/gap-no-collaboration-writer-artist-workflow', require('./routes/gap_no_collaboration_writer_artist_workflow'));
app.use('/api/gap-no-export-to-cbz-pdf-epub-or-print-ready-pdf', require('./routes/gap_no_export_to_cbz_pdf_epub_or_print_ready_pdf'));
app.use('/api/gap-no-marketplace-publishing-layer', require('./routes/gap_no_marketplace_publishing_layer'));
app.use('/api/gap-no-commenting-or-beta-reader-feedback-loop', require('./routes/gap_no_commenting_or_beta_reader_feedback_loop'));
app.use('/api/gap-no-notification-system-or-webhook-outbound', require('./routes/gap_no_notification_system_or_webhook_outbound'));

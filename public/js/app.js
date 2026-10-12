// ===== STATE =====
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let currentSection = 'dashboard';
let dataCache = {};
let activeGeneration = null;
let lastFailedGeneration = null;

// ===== CONFIG =====
const API = '';

function authHeaders(json = false) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API}${url}`, {
    ...options,
    headers: { ...authHeaders(Boolean(options.body)), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

function errorState(message, retryCall) {
  return `<div class="error-state" role="alert"><strong>Unable to load this view</strong><p>${escapeHtml(message)}</p><button class="btn btn-secondary" onclick="${retryCall}">Retry</button></div>`;
}

const FEATURES = {
  'comic-stories': {
    icon: '\u{1F4D6}', label: 'Comic Stories', color: '#6366f1',
    desc: 'Create and manage your comic book stories with plots, characters, and arcs',
    columns: ['title', 'genre', 'status', 'panels_count', 'author'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'genre', label: 'Genre', type: 'select', options: ['Sci-Fi','Fantasy','Cyberpunk','Post-Apocalyptic','Mystery','Action','Thriller','Adventure','Horror','Comedy','Superhero','Romance','Western','Drama'] },
      { name: 'synopsis', label: 'Synopsis', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft','In Progress','Published','Archived'] },
      { name: 'panels_count', label: 'Panels Count', type: 'number' },
      { name: 'author', label: 'Author', type: 'text' },
      { name: 'cover_color', label: 'Cover Color', type: 'color' }
    ]
  },
  'characters': {
    icon: '\u{1F9B8}', label: 'Characters', color: '#ec4899',
    desc: 'Design and manage your comic book characters with detailed profiles',
    columns: ['name', 'alias', 'role', 'personality'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'alias', label: 'Alias', type: 'text' },
      { name: 'role', label: 'Role', type: 'select', options: ['Hero','Villain','Anti-Hero','Sidekick','Mentor','Support','Neutral'] },
      { name: 'powers', label: 'Powers', type: 'textarea' },
      { name: 'backstory', label: 'Backstory', type: 'textarea' },
      { name: 'personality', label: 'Personality', type: 'text' },
      { name: 'appearance', label: 'Appearance', type: 'textarea' },
      { name: 'avatar_color', label: 'Avatar Color', type: 'color' }
    ]
  },
  'comic-panels': {
    icon: '\u{1F5BC}', label: 'Comic Panels', color: '#06b6d4',
    desc: 'Design individual panels with scenes, dialogue, and visual directions',
    columns: ['story_id', 'panel_number', 'mood', 'layout_type'],
    fields: [
      { name: 'story_id', label: 'Story ID', type: 'number', required: true },
      { name: 'panel_number', label: 'Panel Number', type: 'number', required: true },
      { name: 'scene_description', label: 'Scene Description', type: 'textarea' },
      { name: 'dialogue', label: 'Dialogue', type: 'textarea' },
      { name: 'mood', label: 'Mood', type: 'text' },
      { name: 'layout_type', label: 'Layout Type', type: 'select', options: ['standard','wide','close-up','panoramic','splash','dynamic'] },
      { name: 'art_notes', label: 'Art Notes', type: 'textarea' }
    ]
  },
  'art-styles': {
    icon: '\u{1F3A8}', label: 'Art Styles', color: '#8b5cf6',
    desc: 'Explore and manage different comic art styles for your projects',
    columns: ['name', 'category', 'difficulty', 'popularity'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'select', options: ['Japanese','Western','European','Digital','Artistic','Universal','Modern','Urban'] },
      { name: 'example_features', label: 'Example Features', type: 'textarea' },
      { name: 'color_palette', label: 'Color Palette', type: 'text' },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: ['Beginner','Intermediate','Advanced','Expert'] },
      { name: 'popularity', label: 'Popularity (0-100)', type: 'number' }
    ]
  },
  'speech-bubbles': {
    icon: '\u{1F4AC}', label: 'Speech Bubbles', color: '#3b82f6',
    desc: 'Manage speech bubble styles for different dialogue types',
    columns: ['name', 'style', 'shape', 'use_case'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'style', label: 'Style', type: 'select', options: ['Standard','Thought','Exclamation','Whisper','Narration','Action','Special','Tech','Dark','Casual'] },
      { name: 'shape', label: 'Shape', type: 'text' },
      { name: 'border_style', label: 'Border Style', type: 'text' },
      { name: 'use_case', label: 'Use Case', type: 'textarea' },
      { name: 'css_properties', label: 'CSS Properties', type: 'textarea' },
      { name: 'preview_color', label: 'Preview Color', type: 'color' }
    ]
  },
  'comic-templates': {
    icon: '\u{1F4CB}', label: 'Comic Templates', color: '#10b981',
    desc: 'Pre-made page layouts and templates for quick comic creation',
    columns: ['name', 'layout', 'panels_per_page', 'genre', 'difficulty'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'layout', label: 'Layout', type: 'select', options: ['Grid','Dynamic','Manga','Horizontal','Single','Webtoon','Panoramic','Asymmetric','Simple','Mixed','Relaxed','Irregular','Vertical'] },
      { name: 'panels_per_page', label: 'Panels Per Page', type: 'number' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'genre', label: 'Genre', type: 'text' },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: ['Beginner','Intermediate','Advanced','Expert'] },
      { name: 'page_size', label: 'Page Size', type: 'select', options: ['A4','A3','A3 Spread','B5','Letter','Mobile'] },
      { name: 'template_color', label: 'Template Color', type: 'color' }
    ]
  },
  'comic-series': {
    icon: '\u{1F4DA}', label: 'Comic Series', color: '#f59e0b',
    desc: 'Manage your comic book series with issues, publishers, and ratings',
    columns: ['title', 'genre', 'issues_count', 'status', 'publisher'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'genre', label: 'Genre', type: 'text' },
      { name: 'issues_count', label: 'Issues Count', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Ongoing','Completed','Hiatus','New','Cancelled'] },
      { name: 'publisher', label: 'Publisher', type: 'text' },
      { name: 'rating', label: 'Rating', type: 'select', options: ['All Ages','PG','PG-13','Mature'] },
      { name: 'series_color', label: 'Series Color', type: 'color' }
    ]
  },
  'gallery': {
    icon: '\u{1F5BC}', label: 'Gallery', color: '#8b5cf6',
    desc: 'Showcase your completed comics and artwork',
    columns: ['title', 'comic_type', 'pages_count', 'likes', 'views'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'comic_type', label: 'Comic Type', type: 'select', options: ['Full Comic','One-Shot','Short Story','Action Sequence','Horror Short','Comedy Strip','Origin Story','Romance'] },
      { name: 'pages_count', label: 'Pages', type: 'number' },
      { name: 'likes', label: 'Likes', type: 'number' },
      { name: 'views', label: 'Views', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Published','Draft','Archived'] },
      { name: 'gallery_color', label: 'Color', type: 'color' }
    ]
  }
};

const AI_FEATURES = {
  'ai-stories': {
    icon: '\u{2728}', label: 'AI Story Generator', color: '#6366f1',
    desc: 'Generate complete comic book stories with AI',
    endpoint: '/api/ai/generate-story',
    listEndpoint: '/api/ai-stories',
    fields: [
      { name: 'source_story_id', label: 'Source Story', type: 'source-story-select' },
      { name: 'prompt', label: 'Story Prompt', type: 'textarea', placeholder: 'Describe the comic story you want to create...', required: true },
      { name: 'genre', label: 'Genre', type: 'select', options: ['Superhero','Sci-Fi','Fantasy','Horror','Comedy','Cyberpunk','Post-Apocalyptic','Mystery','Action','Romance','Western','Space Opera'] },
      { name: 'tone', label: 'Tone', type: 'select', options: ['Epic','Dark','Humorous','Romantic','Gritty','Whimsical','Tense','Dramatic','Light','Mind-bending'] }
    ],
    displayKey: 'generated_story',
    columns: ['prompt', 'genre', 'tone', 'word_count', 'rating']
  },
  'ai-characters': {
    icon: '\u{1F916}', label: 'AI Character Designer', color: '#ec4899',
    desc: 'Design unique comic characters with AI assistance',
    endpoint: '/api/ai/generate-character',
    listEndpoint: '/api/ai-characters',
    fields: [
      { name: 'source_story_id', label: 'Source Story', type: 'source-story-select' },
      { name: 'prompt', label: 'Character Concept', type: 'textarea', placeholder: 'Describe the character you want to design...', required: true },
      { name: 'style', label: 'Style', type: 'select', options: ['Superhero','Villain','Manga','Realistic','Cartoon','Dark','Tech','Nature','Cosmic','Elemental'] },
      { name: 'archetype', label: 'Archetype', type: 'select', options: ['Hero','Anti-Hero','Villain','Sidekick','Mentor','Wildcard','Guardian','Tank','Healer','Entity'] }
    ],
    displayKey: 'generated_design',
    columns: ['prompt', 'character_name', 'style', 'archetype', 'rating']
  },
  'ai-dialogues': {
    icon: '\u{1F4AD}', label: 'AI Dialogue Writer', color: '#f59e0b',
    desc: 'Generate dynamic comic book dialogue for any scene',
    endpoint: '/api/ai/generate-dialogue',
    listEndpoint: '/api/ai-dialogues',
    fields: [
      { name: 'source_story_id', label: 'Source Story', type: 'source-story-select' },
      { name: 'prompt', label: 'Dialogue Prompt', type: 'textarea', placeholder: 'Describe the dialogue scene...', required: true },
      { name: 'scene_context', label: 'Scene Context', type: 'text', placeholder: 'e.g., Rooftop showdown at midnight' },
      { name: 'characters_involved', label: 'Characters', type: 'text', placeholder: 'e.g., Hero, Villain' },
      { name: 'emotion', label: 'Emotion', type: 'select', options: ['Dramatic','Humorous','Tense','Romantic','Inspiring','Sad','Terrifying','Philosophical','Comedic','Atmospheric'] }
    ],
    displayKey: 'generated_dialogue',
    columns: ['prompt', 'characters_involved', 'emotion', 'rating']
  },
  'ai-art-suggestions': {
    icon: '\u{1F308}', label: 'AI Art Advisor', color: '#8b5cf6',
    desc: 'Get AI-powered art style recommendations for your comics',
    endpoint: '/api/ai/generate-art-suggestion',
    listEndpoint: '/api/ai-art-suggestions',
    fields: [
      { name: 'source_story_id', label: 'Source Story', type: 'source-story-select' },
      { name: 'prompt', label: 'Art Style Request', type: 'textarea', placeholder: 'Describe your comic and the art style you need...', required: true },
      { name: 'style_type', label: 'Style Category', type: 'select', options: ['Modern','Classic','Manga','Western','Indie','Digital','Traditional','Experimental'] },
      { name: 'color_mood', label: 'Color Mood', type: 'select', options: ['Vibrant','Dark & Moody','Pastel','Neon','Earth Tones','Monochrome','Warm','Cool','Dramatic'] }
    ],
    displayKey: 'generated_suggestion',
    columns: ['prompt', 'style_type', 'color_mood', 'rating']
  },
  'ai-plot-twists': {
    icon: '\u{1F300}', label: 'AI Plot Twists', color: '#ef4444',
    desc: 'Generate mind-blowing plot twists for your comic stories',
    endpoint: '/api/ai/generate-plot-twist',
    listEndpoint: '/api/ai-plot-twists',
    fields: [
      { name: 'source_story_id', label: 'Source Story', type: 'source-story-select' },
      { name: 'prompt', label: 'Twist Request', type: 'textarea', placeholder: 'Describe the story that needs a plot twist...', required: true },
      { name: 'story_context', label: 'Story Context', type: 'text', placeholder: 'Brief story summary...' },
      { name: 'twist_type', label: 'Twist Type', type: 'select', options: ['Revelation','Betrayal','Identity','Paradox','Horror','Power','Meta','Misunderstanding','Cosmic','Limitation'] },
      { name: 'intensity', label: 'Intensity', type: 'select', options: ['Low','Medium','High','Extreme'] }
    ],
    displayKey: 'generated_twist',
    columns: ['prompt', 'twist_type', 'intensity', 'rating']
  },
  'ai-scenes': {
    icon: '\u{1F304}', label: 'AI Scene Builder', color: '#06b6d4',
    desc: 'Generate vivid scene descriptions for comic panels',
    endpoint: '/api/ai/generate-scene',
    listEndpoint: '/api/ai-scenes',
    fields: [
      { name: 'source_story_id', label: 'Source Story', type: 'source-story-select' },
      { name: 'prompt', label: 'Scene Description Request', type: 'textarea', placeholder: 'Describe the scene you want to visualize...', required: true },
      { name: 'setting', label: 'Setting', type: 'text', placeholder: 'e.g., Rooftop, Forest, Space Station' },
      { name: 'time_of_day', label: 'Time of Day', type: 'select', options: ['Dawn','Morning','Afternoon','Sunset','Twilight','Night','Midnight','N/A'] },
      { name: 'weather', label: 'Weather', type: 'select', options: ['Clear','Rainy','Stormy','Foggy','Snowy','Windy','Alien','Magical','Volcanic'] },
      { name: 'mood', label: 'Mood', type: 'select', options: ['Dramatic','Serene','Menacing','Magical','Gritty','Awe-inspiring','Terrifying','Romantic','Epic'] }
    ],
    displayKey: 'generated_scene',
    columns: ['prompt', 'setting', 'time_of_day', 'mood', 'rating']
  },
  'ai-villains': {
    icon: '\u{1F608}', label: 'AI Villain Creator', color: '#1e1b4b',
    desc: 'Create compelling comic book villains with detailed profiles',
    endpoint: '/api/ai/generate-villain',
    listEndpoint: '/api/ai-villains',
    fields: [
      { name: 'source_story_id', label: 'Source Story', type: 'source-story-select' },
      { name: 'prompt', label: 'Villain Concept', type: 'textarea', placeholder: 'Describe the villain you want to create...', required: true },
      { name: 'villain_type', label: 'Villain Type', type: 'select', options: ['Mastermind','Brute','Tech','Nature','Magical','Cosmic','Corporate','Psychic','Shadow','Chaos'] },
      { name: 'threat_level', label: 'Threat Level', type: 'select', options: ['Low','Medium','High','Extreme','Omega'] }
    ],
    displayKey: 'generated_profile',
    columns: ['prompt', 'villain_name', 'villain_type', 'threat_level', 'rating']
  }
};

const AI_EXAMPLE_PROFILES = [
  { label: 'Flooded city rescue', subject: 'Nova must evacuate a flooded solar city after its emergency beacons fail', context: 'Issue 1, pages 6–9; Nova and engineer Malik are racing a second storm front', tone: 'urgent but hopeful' },
  { label: 'Moon colony mystery', subject: 'Mira and repair robot PIP investigate a stolen star map in a moon archive', context: 'Issue 2, archive level C; every clue must be fair and visually traceable', tone: 'quiet and suspenseful' },
  { label: 'Moving forest quest', subject: 'Ari and a talking fox cross a moving forest to return a lost constellation', context: 'Issue 3, the shrine has stopped the forest and the fox has lost its voice', tone: 'whimsical with emotional weight' }
];

function isSourceReferenceField(field) {
  return /(?:^|_)(?:story|source|record|asset|character)_?id$/i.test(field.name);
}

function exampleValue(section, field, index) {
  const profile = AI_EXAMPLE_PROFILES[index];
  if (field.type === 'source-story-select') {
    const stories = dataCache['comic-stories'] || [];
    return stories[index % stories.length]?.id || '';
  }
  if (field.type === 'select') return field.options[Math.min(index, field.options.length - 1)];
  const values = {
    prompt: `${profile.subject}. Create an original, reviewable comic treatment with clear panel-ready details and note any assumptions.`,
    scene_context: profile.context,
    characters_involved: ['Nova, Malik, Beacon Keeper', 'Mira, PIP, Archivist Sol', 'Ari, Fox, Shrine Guardian'][index],
    story_context: `${profile.context}. Preserve established clues and character choices; do not replace them with an unrelated reveal.`,
    setting: ['Flooded solar city', 'Moon archive', 'Moving forest shrine'][index]
  };
  return values[field.name] || `${profile.subject}. Context: ${profile.context}. Desired treatment: ${profile.tone}.`;
}

function renderAiExamples(section) {
  return `<div class="example-bar"><div><strong>Complete examples</strong><p>Each choice fills every editable field, including optional context. Existing source-record selections are preserved.</p></div><div class="example-actions">${AI_EXAMPLE_PROFILES.map((profile, index) => `<button type="button" class="btn btn-secondary btn-sm" onclick="fillAiExample('${section}', ${index})">${escapeHtml(profile.label)}</button>`).join('')}</div><p id="aiExampleStatus" class="inline-status" aria-live="polite"></p></div>`;
}

function fillAiExample(section, index) {
  const form = document.getElementById('aiGenForm');
  const feature = AI_FEATURES[section];
  if (!form || !feature) return;
  let filled = 0;
  for (const field of feature.fields) {
    const control = form.elements.namedItem(field.name);
    if (!control || control.disabled) continue;
    if (isSourceReferenceField(field) && control.value) continue;
    control.value = exampleValue(section, field, index);
    control.dispatchEvent(new Event(control.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    filled += 1;
  }
  const status = document.getElementById('aiExampleStatus');
  if (status) status.textContent = `${filled} editable fields filled. Review the fictional example before generating.`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  if (token && currentUser) {
    try {
      const session = await apiRequest('/api/auth/me');
      currentUser = session.user;
      localStorage.setItem('user', JSON.stringify(currentUser));
      showApp();
    } catch (error) {
      token = null;
      currentUser = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showLogin();
      const errorElement = document.getElementById('loginError');
      errorElement.textContent = 'Your session expired. Log in again.';
      errorElement.style.display = 'block';
    }
  } else {
    showLogin();
  }
});

// ===== AUTH =====
function showLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('appLayout').style.display = 'none';
}

function showApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appLayout').style.display = 'flex';
  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.name || 'Comic Creator';
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userAvatar').textContent = (currentUser.name || 'CC').substring(0, 2).toUpperCase();
  }
  navigateTo('dashboard');
  loadAllCounts();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
});

document.getElementById('fillCredsBtn').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  if (button.disabled) return;
  const errorElement = document.getElementById('loginError');
  button.disabled = true;
  button.textContent = 'Signing in…';
  errorElement.style.display = 'none';
  try {
    const credentials = window.DEMO_CREDENTIALS || await apiRequest('/api/auth/defaults');
    if (!credentials?.email || !credentials?.password) throw new Error('Demo credentials are unavailable.');
    document.getElementById('loginEmail').value = credentials.email;
    document.getElementById('loginPassword').value = credentials.password;
    document.getElementById('loginForm').requestSubmit();
  } catch (error) {
    errorElement.textContent = error.message || 'Demo credentials are unavailable.';
    errorElement.style.display = 'block';
  } finally {
    button.disabled = false;
    button.innerHTML = '&#x26A1; Log In as Demo';
  }
});

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showLogin();
}

// ===== NAVIGATION =====
document.getElementById('sidebarNav').addEventListener('click', (e) => {
  const item = e.target.closest('.nav-item');
  if (!item) return;
  const section = item.dataset.section;
  navigateTo(section);
  document.querySelector('.sidebar').classList.remove('open');
});

function navigateTo(section) {
  if (activeGeneration && section !== currentSection) cancelAiGeneration(false);
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');

  if (section === 'dashboard') {
    renderDashboard();
  } else if (FEATURES[section]) {
    renderCrudSection(section);
  } else if (AI_FEATURES[section]) {
    renderAiSection(section);
  }
}

// ===== LOAD COUNTS =====
async function loadAllCounts() {
  const sections = Object.keys(FEATURES);
  const results = await Promise.allSettled(sections.map(async section => {
    const data = await apiRequest(`/api/${section}`);
    dataCache[section] = data;
    const badge = document.getElementById(`badge-${section}`);
    if (badge) badge.textContent = data.length;
    return section;
  }));
  const failures = results.filter(result => result.status === 'rejected');
  if (failures.length) toast(`${failures.length} collection count${failures.length === 1 ? '' : 's'} could not be loaded.`, 'error');
  if (currentSection === 'dashboard') renderDashboard();
}

// ===== DASHBOARD =====
function renderDashboard() {
  const main = document.getElementById('mainContent');
  const allFeatures = { ...FEATURES, ...AI_FEATURES };

  let statsHtml = '';
  const statItems = [
    { icon: '\u{1F4D6}', label: 'Stories', count: dataCache['comic-stories']?.length || 0, bg: 'rgba(99,102,241,0.15)' },
    { icon: '\u{1F9B8}', label: 'Characters', count: dataCache['characters']?.length || 0, bg: 'rgba(236,72,153,0.15)' },
    { icon: '\u{1F3A8}', label: 'Art Styles', count: dataCache['art-styles']?.length || 0, bg: 'rgba(139,92,246,0.15)' },
    { icon: '\u{1F4DA}', label: 'Series', count: dataCache['comic-series']?.length || 0, bg: 'rgba(245,158,11,0.15)' },
  ];
  for (const s of statItems) {
    statsHtml += `
      <div class="stat-card">
        <div class="stat-icon" style="background:${s.bg}">${s.icon}</div>
        <div class="stat-info">
          <div class="stat-value">${s.count}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      </div>`;
  }

  let cardsHtml = '';
  for (const [key, feat] of Object.entries(allFeatures)) {
    const color = feat.color || '#6366f1';
    const isAi = key.startsWith('ai-');
    cardsHtml += `
      <div class="feature-card" style="--card-color:${color}" onclick="navigateTo('${key}')">
        ${isAi ? '<div class="card-badge">AI Powered</div>' : ''}
        <div class="card-icon">${feat.icon}</div>
        <h3>${feat.label}</h3>
        <p>${feat.desc}</p>
      </div>`;
  }

  main.innerHTML = `
    <div class="dashboard-header">
      <h1>AI Comic Book Generator</h1>
      <p>Your creative AI-powered comic book studio</p>
    </div>
    <div class="stats-grid">${statsHtml}</div>
    <h2 style="margin-bottom:16px;font-size:20px;">All Features</h2>
    <div class="features-grid">${cardsHtml}</div>
  `;
}

// ===== CRUD SECTIONS =====
async function renderCrudSection(section) {
  const feat = FEATURES[section];
  const main = document.getElementById('mainContent');

  main.innerHTML = `
    <div class="section-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn-back" onclick="navigateTo('dashboard')">&#x2190; Back</button>
        <h2>${feat.icon} ${feat.label}</h2>
      </div>
      <button class="btn btn-success" onclick="openNewItemModal('${section}')">+ New ${feat.label.replace(/s$/, '')}</button>
    </div>
    <div id="sectionContent"><div class="empty-state"><div class="spinner"></div><p>Loading...</p></div></div>
  `;

  try {
    const data = await apiRequest(`/api/${section}`);
    dataCache[section] = data;

    if (data.length === 0) {
      document.getElementById('sectionContent').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${feat.icon}</div>
          <p>No ${feat.label.toLowerCase()} yet. Create your first one!</p>
        </div>`;
      return;
    }

    let tableHtml = `<div class="data-table-container"><table class="data-table"><thead><tr>`;
    for (const col of feat.columns) {
      tableHtml += `<th>${col.replace(/_/g, ' ')}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (const row of data) {
      tableHtml += `<tr onclick="openDetail('${section}', ${row.id})">`;
      for (const col of feat.columns) {
        let val = row[col] ?? '';
        if (col === 'status') {
          const badge = val === 'Published' || val === 'Completed' ? 'success' : val === 'In Progress' || val === 'Ongoing' ? 'warning' : val === 'Draft' || val === 'New' ? 'info' : 'default';
          val = `<span class="badge badge-${badge}">${val}</span>`;
        } else if (col === 'difficulty') {
          const badge = val === 'Beginner' ? 'success' : val === 'Intermediate' ? 'warning' : val === 'Advanced' ? 'danger' : 'default';
          val = `<span class="badge badge-${badge}">${val}</span>`;
        } else if (col === 'rating' && typeof val === 'number') {
          val = '\u2B50'.repeat(Math.min(val, 5));
        } else if (typeof val === 'string' && val.length > 60) {
          val = val.substring(0, 60) + '...';
        }
        const cell = typeof val === 'string' && /^<span class="badge /.test(val) ? val : escapeHtml(val);
        tableHtml += `<td>${cell}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div>`;
    document.getElementById('sectionContent').innerHTML = tableHtml;
  } catch (err) {
    document.getElementById('sectionContent').innerHTML = errorState(err.message, `renderCrudSection('${section}')`);
  }
}

// ===== DETAIL PANEL =====
async function openDetail(section, id) {
  const feat = FEATURES[section] || AI_FEATURES[section];
  try {
    const endpoint = AI_FEATURES[section] ? AI_FEATURES[section].listEndpoint : `/api/${section}`;
    const item = await apiRequest(`${endpoint}/${id}`);

    document.getElementById('detailTitle').textContent = item.title || item.name || item.character_name || item.villain_name || `Item #${item.id}`;

    let bodyHtml = '';
    for (const [key, val] of Object.entries(item)) {
      if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
      if (val === null || val === undefined || val === '') continue;

      let displayVal = val;
      const isAiContent = ['generated_story','generated_design','generated_dialogue','generated_suggestion','generated_twist','generated_scene','generated_profile'].includes(key);

      if (isAiContent) {
        displayVal = formatAiOutput(val);
        bodyHtml += `<div class="detail-field"><label>${escapeHtml(key.replace(/_/g, ' '))}</label><div class="ai-output">${displayVal}</div></div>`;
      } else if (key.endsWith('_color')) {
        const color = /^#[0-9a-f]{6}$/i.test(String(val)) ? val : '#6366f1';
        bodyHtml += `<div class="detail-field"><label>${escapeHtml(key.replace(/_/g, ' '))}</label><div class="value"><span class="color-dot" style="background:${color}"></span>${escapeHtml(val)}</div></div>`;
      } else {
        if (typeof displayVal === 'object') displayVal = JSON.stringify(displayVal, null, 2);
        bodyHtml += `<div class="detail-field"><label>${escapeHtml(key.replace(/_/g, ' '))}</label><div class="value">${escapeHtml(displayVal)}</div></div>`;
      }
    }

    if (item.created_at) {
      bodyHtml += `<div class="detail-field"><label>Created</label><div class="value">${new Date(item.created_at).toLocaleString()}</div></div>`;
    }

    document.getElementById('detailBody').innerHTML = bodyHtml;

    document.getElementById('detailActions').innerHTML = `
      <button class="btn btn-warning btn-sm" onclick="openEditModal('${section}', ${id})">&#x270E; Edit</button>
      <button class="btn btn-danger btn-sm" onclick="deleteItem('${section}', ${id})">&#x1F5D1; Delete</button>
      <button class="btn btn-secondary btn-sm" onclick="closeDetail()">Cancel</button>
    `;

    document.getElementById('detailPanel').classList.add('open');
    document.getElementById('panelOverlay').classList.add('open');
  } catch (err) {
    toast('Error loading details: ' + err.message, 'error');
  }
}

function closeDetail() {
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('open');
}

// ===== FORMAT AI OUTPUT =====
function formatAiOutput(text) {
  if (!text) return '<p>No content</p>';

  // Try parsing as JSON first
  try {
    const json = JSON.parse(text);
    return formatJsonBeautifully(json);
  } catch {
    // Not JSON, format as rich text
  }

  // Convert markdown-like formatting
  let html = escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h4>$1</h4>')
    .replace(/^# (.+)$/gm, '<h4>$1</h4>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Handle sections separated by bold headers
  const sections = html.split(/(?=<h4>)/);
  if (sections.length > 1) {
    html = sections.map(s => `<div class="ai-section">${s}</div>`).join('');
  }

  // Wrap remaining plain text in paragraphs
  html = html.replace(/^(?!<[hupold])(.*\S.*)$/gm, '<p>$1</p>');

  return html;
}

function formatJsonBeautifully(json) {
  let html = '';
  for (const [key, val] of Object.entries(json)) {
    const label = escapeHtml(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    if (Array.isArray(val)) {
      html += `<div class="ai-section"><h4>${label}</h4><ul>${val.map(v => {
        if (typeof v === 'object') {
          return `<li>${Object.entries(v).map(([k,v2]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(v2)}`).join(' | ')}</li>`;
        }
        return `<li>${escapeHtml(v)}</li>`;
      }).join('')}</ul></div>`;
    } else if (typeof val === 'object' && val !== null) {
      html += `<div class="ai-section"><h4>${label}</h4>${formatJsonBeautifully(val)}</div>`;
    } else {
      html += `<div class="ai-section"><h4>${label}</h4><p>${escapeHtml(val)}</p></div>`;
    }
  }
  return html;
}

// ===== MODAL: NEW ITEM =====
function openNewItemModal(section) {
  const feat = FEATURES[section];
  document.getElementById('modalTitle').textContent = `New ${feat.label.replace(/s$/, '')}`;

  let formHtml = '';
  for (const field of feat.fields) {
    formHtml += renderFormField(field, '');
  }

  document.getElementById('modalBody').innerHTML = `<form id="newItemForm">${formHtml}</form>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-success" onclick="saveNewItem('${section}')">Create</button>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

function openEditModal(section, id) {
  const feat = FEATURES[section] || AI_FEATURES[section];
  const item = dataCache[section]?.find(i => i.id === id);
  if (!item) return;

  closeDetail();
  document.getElementById('modalTitle').textContent = `Edit ${feat.label.replace(/s$/, '')}`;

  let formHtml = '';
  const fields = [...feat.fields];
  if (AI_FEATURES[section]) fields.push({ name: feat.displayKey, label: 'Generated content', type: 'textarea' });
  for (const field of fields) {
    formHtml += renderFormField(field, item[field.name] || '');
  }

  document.getElementById('modalBody').innerHTML = `<form id="editItemForm">${formHtml}</form>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-warning" onclick="saveEditItem('${section}', ${id})">Update</button>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

function renderFormField(field, value) {
  const name = escapeHtml(field.name);
  const label = escapeHtml(field.label);
  const placeholder = escapeHtml(field.placeholder || '');
  const safeValue = escapeHtml(value ?? '');
  let input;
  if (field.type === 'textarea') {
    input = `<textarea name="${name}" ${field.required ? 'required' : ''} placeholder="${placeholder}">${safeValue}</textarea>`;
  } else if (field.type === 'source-story-select') {
    const stories = dataCache['comic-stories'] || [];
    input = `<select name="${name}"><option value="">No source story</option>${stories.map(story => `<option value="${escapeHtml(story.id)}" ${String(value) === String(story.id) ? 'selected' : ''}>#${escapeHtml(story.id)} — ${escapeHtml(story.title)}</option>`).join('')}</select>`;
  } else if (field.type === 'select') {
    input = `<select name="${name}" ${field.required ? 'required' : ''}><option value="">Select...</option>${field.options.map(option => `<option value="${escapeHtml(option)}" ${value === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select>`;
  } else if (field.type === 'color') {
    const color = /^#[0-9a-f]{6}$/i.test(String(value)) ? value : '#6366f1';
    input = `<input type="color" name="${name}" value="${color}">`;
  } else {
    input = `<input type="${escapeHtml(field.type)}" name="${name}" value="${safeValue}" ${field.required ? 'required' : ''} placeholder="${placeholder}">`;
  }
  return `<div class="form-group"><label>${label}${field.required ? ' <span aria-hidden="true">*</span>' : ' <small>(optional)</small>'}</label>${input}</div>`;
}

async function saveNewItem(section) {
  const form = document.getElementById('newItemForm');
  const formData = new FormData(form);
  const body = {};
  for (const [key, val] of formData.entries()) {
    if (val !== '') body[key] = val;
  }

  try {
    await apiRequest(`/api/${section}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    closeModal();
    toast('Item created successfully!', 'success');
    renderCrudSection(section);
    loadAllCounts();
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

async function saveEditItem(section, id) {
  const form = document.getElementById('editItemForm');
  const formData = new FormData(form);
  const body = {};
  for (const [key, val] of formData.entries()) {
    if (val !== '') body[key] = val;
  }

  try {
    const endpoint = AI_FEATURES[section] ? AI_FEATURES[section].listEndpoint : `/api/${section}`;
    await apiRequest(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    closeModal();
    toast('Item updated successfully!', 'success');
    if (AI_FEATURES[section]) renderAiSection(section);
    else renderCrudSection(section);
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

async function deleteItem(section, id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  const endpoint = AI_FEATURES[section] ? AI_FEATURES[section].listEndpoint : `/api/${section}`;
  try {
    await apiRequest(`${endpoint}/${id}`, { method: 'DELETE' });
    closeDetail();
    toast('Item deleted successfully!', 'success');
    if (FEATURES[section]) {
      renderCrudSection(section);
    } else {
      renderAiSection(section);
    }
    loadAllCounts();
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ===== AI SECTIONS =====
async function renderAiSection(section) {
  const feat = AI_FEATURES[section];
  const main = document.getElementById('mainContent');

  try {
    if (!Array.isArray(dataCache['comic-stories'])) {
      dataCache['comic-stories'] = await apiRequest('/api/comic-stories');
    }
  } catch (error) {
    main.innerHTML = `<div class="section-header"><div><button class="btn-back" onclick="navigateTo('dashboard')">&#x2190; Back</button></div></div>${errorState(`Source stories could not be loaded: ${error.message}`, `renderAiSection('${section}')`)}`;
    return;
  }

  let formFieldsHtml = '';
  for (const field of feat.fields) {
    formFieldsHtml += renderFormField(field, '');
  }

  main.innerHTML = `
    <div class="section-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn-back" onclick="navigateTo('dashboard')">&#x2190; Back</button>
        <h2>${feat.icon} ${feat.label}</h2>
      </div>
    </div>
    <div class="ai-gen-form">
      <h3>&#x2728; Generate with OpenRouter</h3>
      ${renderAiExamples(section)}
      <form id="aiGenForm">${formFieldsHtml}</form>
      <div class="generation-actions">
        <button id="aiGenerateButton" type="button" class="btn btn-primary" style="width:auto;" onclick="generateAi('${section}')">&#x1F680; Generate with OpenRouter</button>
        <button id="aiCancelButton" type="button" class="btn btn-secondary" onclick="cancelAiGeneration()" disabled>Cancel</button>
      </div>
      <div class="generating" id="aiGenerating">
        <div class="spinner"></div>
        <span>AI is creating your content...</span>
      </div>
      <div id="aiResult"></div>
    </div>
    <h3 style="margin:24px 0 16px;font-size:18px;">Previous Generations</h3>
    <div id="aiListContent"><div class="empty-state"><div class="spinner"></div><p>Loading...</p></div></div>
  `;

  // Load existing
  try {
    const data = await apiRequest(feat.listEndpoint);
    dataCache[section] = data;

    if (data.length === 0) {
      document.getElementById('aiListContent').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${feat.icon}</div>
          <p>No generations yet. Try creating one above!</p>
        </div>`;
      return;
    }

    let tableHtml = `<div class="data-table-container"><table class="data-table"><thead><tr>`;
    for (const col of feat.columns) {
      tableHtml += `<th>${col.replace(/_/g, ' ')}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (const row of data) {
      tableHtml += `<tr onclick="openDetail('${section}', ${row.id})">`;
      for (const col of feat.columns) {
        let val = row[col] ?? '';
        if (col === 'rating' && typeof val === 'number') {
          val = '\u2B50'.repeat(Math.min(val, 5));
        } else if (typeof val === 'string' && val.length > 50) {
          val = val.substring(0, 50) + '...';
        }
        const cell = typeof val === 'string' && /^<span class="badge /.test(val) ? val : escapeHtml(val);
        tableHtml += `<td>${cell}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div>`;
    document.getElementById('aiListContent').innerHTML = tableHtml;
  } catch (err) {
    document.getElementById('aiListContent').innerHTML = errorState(err.message, `renderAiSection('${section}')`);
  }
}

function setGenerationControls(busy) {
  const generateButton = document.getElementById('aiGenerateButton');
  const cancelButton = document.getElementById('aiCancelButton');
  const form = document.getElementById('aiGenForm');
  if (generateButton) generateButton.disabled = busy;
  if (cancelButton) cancelButton.disabled = !busy;
  if (form) Array.from(form.elements).forEach(control => { control.disabled = busy; });
}

function cancelAiGeneration(showMessage = true) {
  if (!activeGeneration) return;
  activeGeneration.abort();
  if (showMessage) {
    const resultElement = document.getElementById('aiResult');
    if (resultElement) resultElement.innerHTML = '<div class="request-status request-status-neutral" role="status"><strong>Request cancelled</strong><p>No result was accepted or added to history.</p></div>';
  }
}

async function generateAi(section) {
  if (activeGeneration) return;
  const feat = AI_FEATURES[section];
  const form = document.getElementById('aiGenForm');
  if (!feat || !form) return;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const formData = new FormData(form);
  const body = {};
  for (const [key, val] of formData.entries()) body[key] = val;

  if (!body.prompt?.trim()) {
    toast('Please enter a prompt!', 'error');
    return;
  }

  const genEl = document.getElementById('aiGenerating');
  const resultEl = document.getElementById('aiResult');
  const controller = new AbortController();
  activeGeneration = controller;
  lastFailedGeneration = null;
  setGenerationControls(true);
  genEl.classList.add('active');
  resultEl.innerHTML = '';

  try {
    const res = await fetch(`${API}${feat.endpoint}`, {
      method: 'POST',
      headers: authHeaders(true),
      signal: controller.signal,
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Generation failed (${res.status})`);
    if (activeGeneration !== controller) return;

    const content = data[feat.displayKey];
    if (typeof content !== 'string' || !content.trim()) throw new Error('OpenRouter returned an empty response. Try again.');
    const model = data.model_used || data.model || 'Configured OpenRouter model';
    resultEl.innerHTML = `<article class="ai-output ai-output-current"><header><div><span class="ai-output-kicker">OpenRouter response</span><h4>${escapeHtml(feat.label)}</h4></div><span class="ai-model-badge">${escapeHtml(model)}</span></header><div class="ai-output-body">${formatAiOutput(content)}</div></article>`;
    toast('AI content generated and saved to history.', 'success');

    const listData = await apiRequest(feat.listEndpoint);
    dataCache[section] = listData;
    renderAiList(section, listData);
  } catch (err) {
    if (err.name === 'AbortError') {
      resultEl.innerHTML = '<div class="request-status request-status-neutral" role="status"><strong>Request cancelled</strong><p>No result was accepted or added to history.</p></div>';
    } else {
      lastFailedGeneration = { section };
      resultEl.innerHTML = `<div class="request-status request-status-error" role="alert"><strong>OpenRouter generation failed</strong><p>${escapeHtml(err.message)}</p><button type="button" class="btn btn-secondary" onclick="retryAiGeneration()">Retry</button></div>`;
      toast('Generation failed: ' + err.message, 'error');
    }
  } finally {
    if (activeGeneration === controller) activeGeneration = null;
    genEl.classList.remove('active');
    setGenerationControls(false);
  }
}

function retryAiGeneration() {
  if (!lastFailedGeneration || currentSection !== lastFailedGeneration.section) return;
  generateAi(lastFailedGeneration.section);
}

function renderAiList(section, data) {
  const feat = AI_FEATURES[section];
  const container = document.getElementById('aiListContent');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">${feat.icon}</div><p>No generations yet.</p></div>`;
    return;
  }

  let tableHtml = `<div class="data-table-container"><table class="data-table"><thead><tr>`;
  for (const col of feat.columns) {
    tableHtml += `<th>${col.replace(/_/g, ' ')}</th>`;
  }
  tableHtml += `</tr></thead><tbody>`;

  for (const row of data) {
    tableHtml += `<tr onclick="openDetail('${section}', ${row.id})">`;
    for (const col of feat.columns) {
      let val = row[col] ?? '';
      if (col === 'rating' && typeof val === 'number') {
        val = '\u2B50'.repeat(Math.min(val, 5));
      } else if (typeof val === 'string' && val.length > 50) {
        val = val.substring(0, 50) + '...';
      }
      const cell = typeof val === 'string' && /^<span class="badge /.test(val) ? val : escapeHtml(val);
      tableHtml += `<td>${cell}</td>`;
    }
    tableHtml += `</tr>`;
  }
  tableHtml += `</tbody></table></div>`;
  container.innerHTML = tableHtml;
}

// ===== TOAST =====
function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icon = type === 'success' ? '\u2705' : type === 'error' ? '\u274C' : '\u2139\uFE0F';
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.innerHTML = `<span>${icon}</span> ${message}`;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// ===== STATE =====
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let currentSection = 'dashboard';
let dataCache = {};

// ===== CONFIG =====
const API = '';

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
      { name: 'prompt', label: 'Villain Concept', type: 'textarea', placeholder: 'Describe the villain you want to create...', required: true },
      { name: 'villain_type', label: 'Villain Type', type: 'select', options: ['Mastermind','Brute','Tech','Nature','Magical','Cosmic','Corporate','Psychic','Shadow','Chaos'] },
      { name: 'threat_level', label: 'Threat Level', type: 'select', options: ['Low','Medium','High','Extreme','Omega'] }
    ],
    displayKey: 'generated_profile',
    columns: ['prompt', 'villain_name', 'villain_type', 'threat_level', 'rating']
  }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (token && currentUser) {
    showApp();
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

document.getElementById('fillCredsBtn').addEventListener('click', async () => {
  try {
    const res = await fetch(`${API}/api/auth/defaults`);
    const data = await res.json();
    document.getElementById('loginEmail').value = data.email;
    document.getElementById('loginPassword').value = data.password;
    toast('Credentials filled!', 'success');
  } catch {
    document.getElementById('loginEmail').value = 'admin@comicbook.ai';
    document.getElementById('loginPassword').value = 'Comic2024!';
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
  for (const s of sections) {
    try {
      const res = await fetch(`${API}/api/${s}`);
      const data = await res.json();
      dataCache[s] = data;
      const badge = document.getElementById(`badge-${s}`);
      if (badge) badge.textContent = data.length;
    } catch (e) { /* skip */ }
  }
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
    const res = await fetch(`${API}/api/${section}`);
    const data = await res.json();
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
        tableHtml += `<td>${val}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div>`;
    document.getElementById('sectionContent').innerHTML = tableHtml;
  } catch (err) {
    document.getElementById('sectionContent').innerHTML = `<div class="empty-state"><p>Error loading data: ${err.message}</p></div>`;
  }
}

// ===== DETAIL PANEL =====
async function openDetail(section, id) {
  const feat = FEATURES[section] || AI_FEATURES[section];
  try {
    const endpoint = AI_FEATURES[section] ? AI_FEATURES[section].listEndpoint : `/api/${section}`;
    const res = await fetch(`${API}${endpoint}/${id}`);
    const item = await res.json();

    document.getElementById('detailTitle').textContent = item.title || item.name || item.character_name || item.villain_name || `Item #${item.id}`;

    let bodyHtml = '';
    for (const [key, val] of Object.entries(item)) {
      if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
      if (val === null || val === undefined || val === '') continue;

      let displayVal = val;
      const isAiContent = ['generated_story','generated_design','generated_dialogue','generated_suggestion','generated_twist','generated_scene','generated_profile'].includes(key);

      if (isAiContent) {
        displayVal = formatAiOutput(val);
        bodyHtml += `<div class="detail-field"><label>${key.replace(/_/g, ' ')}</label><div class="ai-output">${displayVal}</div></div>`;
      } else if (key.endsWith('_color')) {
        bodyHtml += `<div class="detail-field"><label>${key.replace(/_/g, ' ')}</label><div class="value"><span class="color-dot" style="background:${val}"></span>${val}</div></div>`;
      } else {
        if (typeof displayVal === 'object') displayVal = JSON.stringify(displayVal, null, 2);
        bodyHtml += `<div class="detail-field"><label>${key.replace(/_/g, ' ')}</label><div class="value">${displayVal}</div></div>`;
      }
    }

    if (item.created_at) {
      bodyHtml += `<div class="detail-field"><label>Created</label><div class="value">${new Date(item.created_at).toLocaleString()}</div></div>`;
    }

    document.getElementById('detailBody').innerHTML = bodyHtml;

    const isAiSection = !!AI_FEATURES[section];
    document.getElementById('detailActions').innerHTML = `
      ${!isAiSection ? `<button class="btn btn-warning btn-sm" onclick="openEditModal('${section}', ${id})">&#x270E; Edit</button>` : ''}
      <button class="btn btn-danger btn-sm" onclick="deleteItem('${section}', ${id})">&#x1F5D1; Delete</button>
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
  let html = text
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
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (Array.isArray(val)) {
      html += `<div class="ai-section"><h4>${label}</h4><ul>${val.map(v => {
        if (typeof v === 'object') {
          return `<li>${Object.entries(v).map(([k,v2]) => `<strong>${k}:</strong> ${v2}`).join(' | ')}</li>`;
        }
        return `<li>${v}</li>`;
      }).join('')}</ul></div>`;
    } else if (typeof val === 'object' && val !== null) {
      html += `<div class="ai-section"><h4>${label}</h4>${formatJsonBeautifully(val)}</div>`;
    } else {
      html += `<div class="ai-section"><h4>${label}</h4><p>${val}</p></div>`;
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
  const feat = FEATURES[section];
  const item = dataCache[section]?.find(i => i.id === id);
  if (!item) return;

  closeDetail();
  document.getElementById('modalTitle').textContent = `Edit ${feat.label.replace(/s$/, '')}`;

  let formHtml = '';
  for (const field of feat.fields) {
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
  let input;
  if (field.type === 'textarea') {
    input = `<textarea name="${field.name}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">${value}</textarea>`;
  } else if (field.type === 'select') {
    input = `<select name="${field.name}"><option value="">Select...</option>${field.options.map(o => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  } else if (field.type === 'color') {
    input = `<input type="color" name="${field.name}" value="${value || '#6366f1'}">`;
  } else {
    input = `<input type="${field.type}" name="${field.name}" value="${value}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">`;
  }
  return `<div class="form-group"><label>${field.label}</label>${input}</div>`;
}

async function saveNewItem(section) {
  const form = document.getElementById('newItemForm');
  const formData = new FormData(form);
  const body = {};
  for (const [key, val] of formData.entries()) {
    if (val !== '') body[key] = val;
  }

  try {
    const res = await fetch(`${API}/api/${section}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json()).error);
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
    const res = await fetch(`${API}/api/${section}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    closeModal();
    toast('Item updated successfully!', 'success');
    renderCrudSection(section);
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

async function deleteItem(section, id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  const endpoint = AI_FEATURES[section] ? AI_FEATURES[section].listEndpoint : `/api/${section}`;
  try {
    const res = await fetch(`${API}${endpoint}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
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
      <h3>&#x2728; Generate New</h3>
      <form id="aiGenForm">${formFieldsHtml}</form>
      <div style="margin-top:16px;">
        <button class="btn btn-primary" style="width:auto;" onclick="generateAi('${section}')">&#x1F680; Generate with AI</button>
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
    const res = await fetch(`${API}${feat.listEndpoint}`);
    const data = await res.json();
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
        tableHtml += `<td>${val}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div>`;
    document.getElementById('aiListContent').innerHTML = tableHtml;
  } catch (err) {
    document.getElementById('aiListContent').innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

async function generateAi(section) {
  const feat = AI_FEATURES[section];
  const form = document.getElementById('aiGenForm');
  const formData = new FormData(form);
  const body = {};
  for (const [key, val] of formData.entries()) {
    if (val !== '') body[key] = val;
  }

  if (!body.prompt) {
    toast('Please enter a prompt!', 'error');
    return;
  }

  const genEl = document.getElementById('aiGenerating');
  const resultEl = document.getElementById('aiResult');
  genEl.classList.add('active');
  resultEl.innerHTML = '';

  try {
    const res = await fetch(`${API}${feat.endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Generation failed');

    const content = data[feat.displayKey] || '';
    resultEl.innerHTML = `<div class="ai-output">${formatAiOutput(content)}</div>`;
    toast('AI content generated successfully!', 'success');

    // Refresh list
    const listRes = await fetch(`${API}${feat.listEndpoint}`);
    const listData = await listRes.json();
    dataCache[section] = listData;
    // Re-render list without full page reload
    renderAiList(section, listData);
  } catch (err) {
    resultEl.innerHTML = `<div class="ai-output" style="border-color:var(--accent-danger)"><p style="color:#f87171;">Error: ${err.message}</p></div>`;
    toast('Generation failed: ' + err.message, 'error');
  } finally {
    genEl.classList.remove('active');
  }
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
      tableHtml += `<td>${val}</td>`;
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

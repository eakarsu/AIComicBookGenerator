-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) DEFAULT 'Comic Creator',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comic Stories
CREATE TABLE IF NOT EXISTS comic_stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    synopsis TEXT,
    status VARCHAR(50) DEFAULT 'Draft',
    panels_count INTEGER DEFAULT 0,
    author VARCHAR(255),
    cover_color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Characters
CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    alias VARCHAR(255),
    role VARCHAR(100),
    powers TEXT,
    backstory TEXT,
    personality VARCHAR(255),
    appearance TEXT,
    avatar_color VARCHAR(7) DEFAULT '#ec4899',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comic Panels
CREATE TABLE IF NOT EXISTS comic_panels (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES comic_stories(id) ON DELETE CASCADE,
    panel_number INTEGER,
    scene_description TEXT,
    dialogue TEXT,
    mood VARCHAR(100),
    layout_type VARCHAR(50) DEFAULT 'standard',
    art_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Art Styles
CREATE TABLE IF NOT EXISTS art_styles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    example_features TEXT,
    color_palette VARCHAR(255),
    difficulty VARCHAR(50),
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Speech Bubbles
CREATE TABLE IF NOT EXISTS speech_bubbles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    style VARCHAR(100),
    shape VARCHAR(100),
    border_style VARCHAR(100),
    use_case TEXT,
    css_properties TEXT,
    preview_color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comic Templates
CREATE TABLE IF NOT EXISTS comic_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    layout VARCHAR(100),
    panels_per_page INTEGER DEFAULT 4,
    description TEXT,
    genre VARCHAR(100),
    difficulty VARCHAR(50),
    page_size VARCHAR(50) DEFAULT 'A4',
    template_color VARCHAR(7) DEFAULT '#10b981',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comic Series
CREATE TABLE IF NOT EXISTS comic_series (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    issues_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Ongoing',
    publisher VARCHAR(255),
    rating VARCHAR(20) DEFAULT 'PG',
    series_color VARCHAR(7) DEFAULT '#f59e0b',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Generated Stories
CREATE TABLE IF NOT EXISTS ai_stories (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    generated_story TEXT,
    genre VARCHAR(100),
    tone VARCHAR(100),
    word_count INTEGER DEFAULT 0,
    model_used VARCHAR(100),
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Character Designs
CREATE TABLE IF NOT EXISTS ai_characters (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    character_name VARCHAR(255),
    generated_design TEXT,
    style VARCHAR(100),
    archetype VARCHAR(100),
    model_used VARCHAR(100),
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Dialogues
CREATE TABLE IF NOT EXISTS ai_dialogues (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    scene_context TEXT,
    generated_dialogue TEXT,
    characters_involved TEXT,
    emotion VARCHAR(100),
    model_used VARCHAR(100),
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Art Style Suggestions
CREATE TABLE IF NOT EXISTS ai_art_suggestions (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    generated_suggestion TEXT,
    style_type VARCHAR(100),
    reference_artists TEXT,
    color_mood VARCHAR(100),
    model_used VARCHAR(100),
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Plot Twists
CREATE TABLE IF NOT EXISTS ai_plot_twists (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    story_context TEXT,
    generated_twist TEXT,
    twist_type VARCHAR(100),
    intensity VARCHAR(50),
    model_used VARCHAR(100),
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Scene Descriptions
CREATE TABLE IF NOT EXISTS ai_scenes (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    generated_scene TEXT,
    setting VARCHAR(255),
    time_of_day VARCHAR(50),
    weather VARCHAR(50),
    mood VARCHAR(100),
    model_used VARCHAR(100),
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Villain Creator
CREATE TABLE IF NOT EXISTS ai_villains (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    villain_name VARCHAR(255),
    generated_profile TEXT,
    villain_type VARCHAR(100),
    threat_level VARCHAR(50),
    motivation VARCHAR(255),
    model_used VARCHAR(100),
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Gallery
CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    comic_type VARCHAR(100),
    pages_count INTEGER DEFAULT 1,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Published',
    gallery_color VARCHAR(7) DEFAULT '#8b5cf6',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

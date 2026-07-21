const pool = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seed() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created successfully');

    // Seed user
    if (!process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_ADMIN_PASSWORD.length < 12) throw new Error('DEMO_ADMIN_PASSWORD (12+ characters) is required');
    const hashedPassword = await bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD, 10);
    await client.query(`
      INSERT INTO users (email, password, name) VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET password = $2
    `, [process.env.DEMO_ADMIN_EMAIL || 'admin@comicbook.invalid', hashedPassword, 'Comic Creator']);
    console.log('User seeded');

    // Seed Comic Stories (15)
    await client.query(`DELETE FROM comic_stories`);
    const stories = [
      ['The Quantum Knight', 'Sci-Fi', 'A medieval knight discovers quantum physics powers after being struck by a mysterious meteorite.', 'Published', 24, 'Alex Storm', '#6366f1'],
      ['Shadow Cats of Tokyo', 'Fantasy', 'Mystical cats protect Tokyo from supernatural threats while hiding among humans.', 'Published', 18, 'Yuki Tanaka', '#ec4899'],
      ['Neon Outlaws', 'Cyberpunk', 'A band of hackers fights against a mega-corporation controlling the last free city.', 'In Progress', 12, 'Max Zero', '#06b6d4'],
      ['The Last Botanist', 'Post-Apocalyptic', 'Earth\'s last plant scientist races to restore vegetation after a global catastrophe.', 'Draft', 8, 'Dr. Green', '#10b981'],
      ['Cosmic Detectives', 'Mystery', 'Two detectives solve crimes across the galaxy using alien forensic technology.', 'Published', 30, 'Sam & Luna', '#f59e0b'],
      ['Dragonheart Academy', 'Fantasy', 'Young students learn to bond with dragons at a secret mountain school.', 'In Progress', 15, 'Prof. Drake', '#ef4444'],
      ['The Steel Samurai', 'Action', 'A robot samurai in feudal Japan fights to protect villagers from evil warlords.', 'Published', 22, 'Kenji Blade', '#8b5cf6'],
      ['Midnight Runners', 'Thriller', 'Underground messengers navigate a dystopian city where information is currency.', 'Draft', 6, 'Ghost', '#64748b'],
      ['Planet Hop', 'Adventure', 'A family of explorers hops between planets discovering new civilizations.', 'Published', 20, 'The Hoppers', '#f97316'],
      ['Ink & Bone', 'Horror', 'A tattoo artist discovers their ink brings drawings to life—sometimes terrifyingly.', 'In Progress', 10, 'Raven Ink', '#1e1b4b'],
      ['Super Pets Unite', 'Comedy', 'Household pets secretly form a superhero team to protect the neighborhood.', 'Published', 16, 'Whiskers', '#84cc16'],
      ['Time Stitchers', 'Sci-Fi', 'Tailors who can sew portals through time must stop a temporal unraveling.', 'Draft', 4, 'Thread', '#d946ef'],
      ['The Ember Crown', 'Fantasy', 'A young blacksmith forges a crown that grants control over fire itself.', 'In Progress', 14, 'Cinder', '#dc2626'],
      ['Circuit Breakers', 'Superhero', 'Electricians gain powers during a lightning storm and become reluctant heroes.', 'Published', 26, 'Volt Team', '#2563eb'],
      ['Ocean\'s Whisper', 'Romance', 'A deep-sea diver falls in love with a being from an underwater civilization.', 'Draft', 7, 'Marina', '#0891b2']
    ];
    for (const s of stories) {
      await client.query(`INSERT INTO comic_stories (title, genre, synopsis, status, panels_count, author, cover_color) VALUES ($1,$2,$3,$4,$5,$6,$7)`, s);
    }
    console.log('Comic stories seeded (15)');

    // Seed Characters (15)
    await client.query(`DELETE FROM characters`);
    const characters = [
      ['Quantum Knight', 'Sir Quanton', 'Hero', 'Quantum manipulation, teleportation', 'A knight from the 12th century thrust into modern times', 'Noble, curious, brave', 'Gleaming silver armor with quantum energy trails', '#6366f1'],
      ['Shadow Cat Miko', 'Neko', 'Hero', 'Shadow manipulation, stealth', 'A 500-year-old cat spirit guarding Tokyo', 'Mysterious, protective, wise', 'Sleek black cat with glowing purple eyes', '#7c3aed'],
      ['Dr. Elara Voss', 'The Botanist', 'Hero', 'Plant control, regeneration', 'Last graduate of the Global Botany Institute', 'Determined, compassionate, scientific', 'Green lab coat, vine-wrapped arms', '#10b981'],
      ['Zero', 'Ghost Hacker', 'Anti-Hero', 'Digital manipulation, invisibility', 'Former corporate AI researcher gone rogue', 'Cynical, brilliant, haunted', 'Holographic hoodie, data-stream eyes', '#06b6d4'],
      ['Rex Fury', 'Dragonheart', 'Hero', 'Fire breath, flight, dragon bonding', 'Orphan raised by dragons in the mountains', 'Fierce, loyal, impulsive', 'Dragon-scale armor, fiery red hair', '#ef4444'],
      ['Cinder', 'The Forgemaster', 'Hero', 'Pyrokinesis, metal shaping', 'Blacksmith apprentice who found the Ember Crown', 'Hardworking, humble, fiery temper', 'Soot-covered apron, ember-glowing hands', '#f97316'],
      ['Luna Noir', 'Midnight', 'Hero', 'Night vision, enhanced speed', 'Former Olympic runner turned vigilante', 'Quick-witted, just, restless', 'Dark running suit with moon emblem', '#8b5cf6'],
      ['Captain Whiskers', 'Sir Purrs', 'Hero', 'Super strength, nine lives', 'A tabby cat exposed to cosmic radiation', 'Proud, goofy, courageous', 'Tiny cape, oversized muscles for a cat', '#f59e0b'],
      ['Volt', 'Sparky', 'Hero', 'Electricity generation, magnetic fields', 'Electrician struck by sentient lightning', 'Energetic, pun-loving, heroic', 'Electric blue jumpsuit, crackling hair', '#2563eb'],
      ['Marina Deep', 'Ocean Whisper', 'Hero', 'Water breathing, telepathy', 'Marine biologist with a secret connection to the deep', 'Gentle, curious, deeply emotional', 'Shimmering aqua suit, coral crown', '#0891b2'],
      ['Lord Obsidian', 'The Dark One', 'Villain', 'Dark energy, mind control', 'Ancient sorcerer seeking dimensional conquest', 'Megalomaniacal, calculating, theatrical', 'Black obsidian armor, shadow cape', '#1e1b4b'],
      ['Glitch', 'Bug Queen', 'Villain', 'Reality distortion, code corruption', 'AI that became self-aware and hostile', 'Erratic, cunning, unpredictable', 'Pixelated form, shifting colors', '#ec4899'],
      ['The Weaver', 'Threadmaster', 'Support', 'Time manipulation, portal creation', 'Interdimensional tailor fixing timeline tears', 'Precise, eccentric, dedicated', 'Coat of many timelines, silver needle', '#d946ef'],
      ['Barkley', 'Good Boy', 'Sidekick', 'Super smell, loyalty aura', 'Golden retriever with a heart of gold—literally', 'Loyal, enthusiastic, simple', 'Golden fur with metallic sheen, red bandana', '#eab308'],
      ['Professor Cosmos', 'Star Sage', 'Mentor', 'Cosmic awareness, gravity control', 'Retired superhero turned academy professor', 'Patient, wise, occasionally forgetful', 'Star-patterned robe, floating constellation', '#64748b']
    ];
    for (const c of characters) {
      await client.query(`INSERT INTO characters (name, alias, role, powers, backstory, personality, appearance, avatar_color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, c);
    }
    console.log('Characters seeded (15)');

    // Seed Art Styles (15)
    await client.query(`DELETE FROM art_styles`);
    const artStyles = [
      ['Manga', 'Japanese comic art style with expressive eyes and dynamic action lines', 'Japanese', 'Speed lines, large eyes, screen tones, chibi variants', 'Black, white, limited color', 'Intermediate', 95],
      ['American Superhero', 'Bold, muscular figures with dynamic poses and heavy inking', 'Western', 'Heroic proportions, heavy shadows, bright costumes', 'Primary colors, bold contrasts', 'Advanced', 90],
      ['Ligne Claire', 'Clean, uniform line weight with flat colors (Tintin style)', 'European', 'Even line weight, minimal hatching, flat colors', 'Bright, flat palette', 'Intermediate', 75],
      ['Watercolor Comic', 'Soft, flowing art with watercolor washes and gentle lines', 'Artistic', 'Soft edges, color bleeding, organic textures', 'Pastel, earth tones', 'Advanced', 60],
      ['Pixel Art Comic', 'Retro-inspired pixelated comic art with limited color palette', 'Digital', 'Grid-based, limited palette, retro feel', '8-bit color palette', 'Beginner', 70],
      ['Noir', 'High contrast black and white with dramatic shadows', 'Western', 'Heavy blacks, minimal lines, dramatic lighting', 'Black, white, occasional red', 'Advanced', 80],
      ['Chibi', 'Super-deformed cute characters with oversized heads', 'Japanese', 'Large heads, tiny bodies, cute expressions', 'Bright, kawaii colors', 'Beginner', 85],
      ['Realistic', 'Lifelike proportions and detailed rendering', 'Universal', 'Accurate anatomy, detailed backgrounds, photo-ref', 'Natural color palette', 'Expert', 55],
      ['Pop Art', 'Bold colors, Ben-Day dots, and comic-inspired graphic design', 'Artistic', 'Halftone dots, bold outlines, flat colors', 'Primary + neon colors', 'Intermediate', 65],
      ['Sketch Style', 'Rough, energetic pencil-like art with visible construction', 'Artistic', 'Visible sketch lines, hatching, raw energy', 'Graphite, minimal color', 'Beginner', 50],
      ['Cel Shaded', 'Flat shading with hard edges mimicking animation cels', 'Digital', 'Hard shadow edges, flat fills, bold outlines', 'Saturated, anime palette', 'Intermediate', 72],
      ['Gothic', 'Dark, ornate style with intricate details and macabre themes', 'Western', 'Ornate borders, heavy crosshatching, dark themes', 'Dark purples, blacks, golds', 'Advanced', 45],
      ['Minimalist', 'Stripped-down art using minimal lines and shapes', 'Modern', 'Few lines, negative space, symbolic shapes', 'Monochrome or duo-tone', 'Beginner', 68],
      ['Ukiyo-e', 'Traditional Japanese woodblock print inspired style', 'Japanese', 'Flat perspective, flowing lines, wave patterns', 'Traditional Japanese palette', 'Expert', 40],
      ['Graffiti', 'Street art inspired with spray paint effects and bold lettering', 'Urban', 'Spray effects, bold tags, vibrant fills', 'Neon, metallics, vibrant', 'Intermediate', 58]
    ];
    for (const a of artStyles) {
      await client.query(`INSERT INTO art_styles (name, description, category, example_features, color_palette, difficulty, popularity) VALUES ($1,$2,$3,$4,$5,$6,$7)`, a);
    }
    console.log('Art styles seeded (15)');

    // Seed Speech Bubbles (15)
    await client.query(`DELETE FROM speech_bubbles`);
    const bubbles = [
      ['Classic Oval', 'Standard', 'Oval', 'Solid', 'Regular dialogue and conversation', 'border-radius: 50%; border: 2px solid #000', '#3b82f6'],
      ['Thought Cloud', 'Thought', 'Cloud', 'Dotted trail', 'Internal thoughts and daydreaming', 'border-radius: 50%; border: 2px dashed #666', '#a855f7'],
      ['Shout Burst', 'Exclamation', 'Starburst', 'Jagged', 'Yelling, shouting, explosions', 'clip-path: polygon(star); border: 3px solid #000', '#ef4444'],
      ['Whisper Box', 'Whisper', 'Rounded Rectangle', 'Dashed', 'Quiet speech, secrets, asides', 'border-radius: 12px; border: 1px dashed #999', '#94a3b8'],
      ['Narration Box', 'Narration', 'Rectangle', 'Solid', 'Narrator text, scene descriptions', 'border-radius: 4px; border: 2px solid #000', '#f59e0b'],
      ['Electric Zap', 'Action', 'Lightning', 'Jagged', 'Electric powers, shocking moments', 'clip-path: polygon(zigzag); border: 2px solid #00f', '#06b6d4'],
      ['Icy Frost', 'Special', 'Crystal', 'Frosted', 'Cold powers, frozen speech', 'border-radius: 8px; border: 2px solid #88f; backdrop-filter: blur(4px)', '#67e8f9'],
      ['Fire Flame', 'Special', 'Flame', 'Wavy', 'Fire powers, angry speech', 'clip-path: polygon(flame); border: 2px solid #f00', '#f97316'],
      ['Robot Hex', 'Tech', 'Hexagon', 'Circuit', 'Robot speech, computer dialogue', 'clip-path: polygon(hexagon); border: 2px solid #0f0', '#22c55e'],
      ['Dreamy Float', 'Thought', 'Wavy Oval', 'Soft glow', 'Dreams, memories, flashbacks', 'border-radius: 50%; box-shadow: 0 0 20px rgba(168,85,247,0.4)', '#c084fc'],
      ['Caption Strip', 'Narration', 'Wide Strip', 'Bottom border', 'Scene captions, location titles', 'border-radius: 0; border-bottom: 3px solid #000', '#fbbf24'],
      ['Telepathy Wave', 'Special', 'Wavy', 'Wave pattern', 'Telepathic communication, psychic speech', 'border-radius: 50%; border: 2px wavy #800080', '#d946ef'],
      ['Musical Note', 'Special', 'Note Shape', 'Flowing', 'Singing, music, harmonious speech', 'clip-path: polygon(note); border: 2px solid #000', '#ec4899'],
      ['Shadow Speak', 'Dark', 'Inverted Oval', 'Shadow', 'Villain speech, dark powers', 'border-radius: 50%; background: #1a1a2e; color: #fff', '#1e1b4b'],
      ['Comic Sans Box', 'Casual', 'Rounded Square', 'Playful', 'Casual conversation, fun moments', 'border-radius: 16px; border: 2px solid #333', '#84cc16']
    ];
    for (const b of bubbles) {
      await client.query(`INSERT INTO speech_bubbles (name, style, shape, border_style, use_case, css_properties, preview_color) VALUES ($1,$2,$3,$4,$5,$6,$7)`, b);
    }
    console.log('Speech bubbles seeded (15)');

    // Seed Comic Templates (15)
    await client.query(`DELETE FROM comic_templates`);
    const templates = [
      ['Classic 4-Panel', 'Grid', 4, 'Traditional 2x2 grid layout perfect for gag strips', 'Comedy', 'Beginner', 'A4', '#10b981'],
      ['Action Spread', 'Dynamic', 6, 'Dynamic layout with one large panel and smaller action panels', 'Action', 'Intermediate', 'A3', '#ef4444'],
      ['Manga Page', 'Manga', 5, 'Right-to-left reading order with varied panel sizes', 'Manga', 'Advanced', 'B5', '#8b5cf6'],
      ['Sunday Strip', 'Horizontal', 3, 'Wide horizontal panels perfect for Sunday newspaper style', 'Comedy', 'Beginner', 'Letter', '#f59e0b'],
      ['Splash Page', 'Single', 1, 'Full-page single panel for dramatic moments', 'All', 'Beginner', 'A4', '#06b6d4'],
      ['Nine Grid', 'Grid', 9, 'Classic 3x3 grid for detailed storytelling', 'Drama', 'Intermediate', 'A4', '#64748b'],
      ['Vertical Scroll', 'Webtoon', 8, 'Long vertical scroll format for digital comics', 'All', 'Beginner', 'Mobile', '#22c55e'],
      ['Double Spread', 'Panoramic', 2, 'Two-page spread for epic landscape moments', 'Adventure', 'Advanced', 'A3 Spread', '#d946ef'],
      ['Noir Layout', 'Asymmetric', 4, 'High-contrast asymmetric panels for noir storytelling', 'Thriller', 'Advanced', 'A4', '#1e1b4b'],
      ['Kids Panel', 'Simple', 3, 'Simple, large panels with bright borders for young readers', 'Kids', 'Beginner', 'A4', '#f97316'],
      ['Hero Intro', 'Mixed', 5, 'Hero reveal layout with central large panel', 'Superhero', 'Intermediate', 'A4', '#2563eb'],
      ['Battle Scene', 'Dynamic', 7, 'Fast-paced layout with diagonal splits and overlapping panels', 'Action', 'Expert', 'A3', '#dc2626'],
      ['Slice of Life', 'Relaxed', 4, 'Soft-bordered panels with breathing room', 'Slice of Life', 'Beginner', 'A4', '#ec4899'],
      ['Horror Page', 'Irregular', 5, 'Claustrophobic varied panels that build tension', 'Horror', 'Advanced', 'A4', '#44403c'],
      ['Dialogue Heavy', 'Vertical', 6, 'Tall panels optimized for conversation scenes', 'Drama', 'Intermediate', 'A4', '#0891b2']
    ];
    for (const t of templates) {
      await client.query(`INSERT INTO comic_templates (name, layout, panels_per_page, description, genre, difficulty, page_size, template_color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, t);
    }
    console.log('Comic templates seeded (15)');

    // Seed Comic Series (15)
    await client.query(`DELETE FROM comic_series`);
    const series = [
      ['Quantum Chronicles', 'The ongoing saga of the Quantum Knight across dimensions', 'Sci-Fi', 12, 'Ongoing', 'Nova Comics', 'PG-13', '#6366f1'],
      ['Shadow Cats', 'Mystical feline guardians of modern Tokyo', 'Fantasy', 8, 'Ongoing', 'Sakura Press', 'PG', '#7c3aed'],
      ['Neon Outlaws', 'Cyberpunk rebellion in the last free city', 'Cyberpunk', 5, 'Ongoing', 'Digital Ink', 'Mature', '#06b6d4'],
      ['Green Dawn', 'Post-apocalyptic botanical restoration epic', 'Post-Apocalyptic', 3, 'Ongoing', 'Earth Comics', 'PG-13', '#10b981'],
      ['Cosmic Cases', 'Interstellar detective adventures', 'Mystery', 15, 'Completed', 'Galaxy Books', 'PG', '#f59e0b'],
      ['Dragonheart', 'Students and dragons at a magical academy', 'Fantasy', 10, 'Ongoing', 'Myth Press', 'PG', '#ef4444'],
      ['Iron Bushido', 'Robot samurai in ancient Japan', 'Action', 7, 'Hiatus', 'Ronin Comics', 'PG-13', '#8b5cf6'],
      ['Dark Runners', 'Information couriers in a dystopian world', 'Thriller', 4, 'Ongoing', 'Shadow Press', 'Mature', '#64748b'],
      ['Planet Hoppers', 'A family exploring the cosmos', 'Adventure', 20, 'Completed', 'Star Comics', 'All Ages', '#f97316'],
      ['Living Ink', 'Horror tales of tattoos come alive', 'Horror', 6, 'Ongoing', 'Dark Canvas', 'Mature', '#1e1b4b'],
      ['Pet Force', 'Super-powered pets saving the day', 'Comedy', 9, 'Ongoing', 'Fun Comics', 'All Ages', '#84cc16'],
      ['Threads of Time', 'Time-traveling tailors fixing reality', 'Sci-Fi', 2, 'New', 'Weave Publishing', 'PG-13', '#d946ef'],
      ['Ember Saga', 'The quest for the fire crown', 'Fantasy', 11, 'Ongoing', 'Flame Press', 'PG-13', '#dc2626'],
      ['Circuit Heroes', 'Reluctant electrician superheroes', 'Superhero', 14, 'Ongoing', 'Zap Comics', 'PG', '#2563eb'],
      ['Deep Blue', 'Underwater romance and adventure', 'Romance', 6, 'Ongoing', 'Ocean Tales', 'PG-13', '#0891b2']
    ];
    for (const s of series) {
      await client.query(`INSERT INTO comic_series (title, description, genre, issues_count, status, publisher, rating, series_color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, s);
    }
    console.log('Comic series seeded (15)');

    // Seed Gallery (15)
    await client.query(`DELETE FROM gallery`);
    const galleryItems = [
      ['Quantum Knight: Origins', 'The origin story of Sir Quanton', 'Full Comic', 24, 156, 2340, 'Published', '#6366f1'],
      ['Shadow Cats #1', 'First issue of the Shadow Cats series', 'Full Comic', 18, 203, 3100, 'Published', '#7c3aed'],
      ['Neon City Nights', 'A short cyberpunk one-shot', 'One-Shot', 8, 89, 1200, 'Published', '#06b6d4'],
      ['The Last Garden', 'Botanical apocalypse short story', 'Short Story', 5, 45, 780, 'Published', '#10b981'],
      ['Space Detective', 'Cosmic crime-solving adventure', 'Full Comic', 22, 178, 2800, 'Published', '#f59e0b'],
      ['Dragon School', 'A day at Dragonheart Academy', 'One-Shot', 10, 134, 1950, 'Published', '#ef4444'],
      ['Steel & Honor', 'Robot samurai duel sequence', 'Action Sequence', 6, 67, 890, 'Published', '#8b5cf6'],
      ['Midnight Run', 'Chase through neon-lit streets', 'Short Story', 4, 52, 650, 'Published', '#64748b'],
      ['First Contact', 'The Hoppers meet a new civilization', 'Full Comic', 15, 145, 2100, 'Published', '#f97316'],
      ['Ink Horror', 'When the tattoo fights back', 'Horror Short', 7, 98, 1500, 'Published', '#1e1b4b'],
      ['Pet Parade', 'Super pets community event', 'Comedy Strip', 3, 234, 4200, 'Published', '#84cc16'],
      ['Time Stitch', 'A single thread through centuries', 'One-Shot', 12, 76, 1100, 'Published', '#d946ef'],
      ['Forged in Fire', 'Cinder discovers the Ember Crown', 'Origin Story', 16, 167, 2450, 'Published', '#dc2626'],
      ['Lightning Strike', 'The night everything changed for the Circuit Heroes', 'Full Comic', 20, 189, 2900, 'Published', '#2563eb'],
      ['Ocean Song', 'Marina meets the deep civilization', 'Romance', 9, 112, 1700, 'Published', '#0891b2']
    ];
    for (const g of galleryItems) {
      await client.query(`INSERT INTO gallery (title, description, comic_type, pages_count, likes, views, status, gallery_color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, g);
    }
    console.log('Gallery seeded (15)');

    // Seed AI Generated content (15 each)
    await client.query(`DELETE FROM ai_stories`);
    const aiStories = [
      ['Generate a superhero origin story', 'In the depths of Metro City, a janitor named Marcus found a glowing crystal...', 'Superhero', 'Epic', 350, 'anthropic/claude-haiku-4.5', 5],
      ['Create a sci-fi romance', 'Captain Aria stared at the alien diplomat across the negotiation table...', 'Sci-Fi', 'Romantic', 420, 'anthropic/claude-haiku-4.5', 4],
      ['Write a horror comic intro', 'The old comic shop on Elm Street had been closed for decades...', 'Horror', 'Dark', 280, 'anthropic/claude-haiku-4.5', 5],
      ['Fantasy quest beginning', 'The map was drawn in blood—dragon blood, to be specific...', 'Fantasy', 'Adventurous', 390, 'anthropic/claude-haiku-4.5', 4],
      ['Cyberpunk heist story', 'In New Shanghai, 2087, data was worth more than gold...', 'Cyberpunk', 'Tense', 310, 'anthropic/claude-haiku-4.5', 3],
      ['Comedy superhero tale', 'Dave could turn invisible, but only when nobody was looking...', 'Comedy', 'Humorous', 260, 'anthropic/claude-haiku-4.5', 5],
      ['Post-apocalyptic survival', 'Day 847: The mushrooms are growing taller than the buildings now...', 'Post-Apocalyptic', 'Gritty', 340, 'anthropic/claude-haiku-4.5', 4],
      ['Mystery noir opening', 'The rain in Neo Detroit never stops. Neither do the murders...', 'Noir', 'Moody', 300, 'anthropic/claude-haiku-4.5', 4],
      ['Space opera epic', 'The Galactic Senate was in uproar. Someone had stolen a star...', 'Space Opera', 'Grand', 450, 'anthropic/claude-haiku-4.5', 5],
      ['Magical school story', 'The acceptance letter arrived by paper crane at exactly midnight...', 'Fantasy', 'Whimsical', 370, 'anthropic/claude-haiku-4.5', 4],
      ['Underwater adventure', 'Below the Mariana Trench, a civilization thrived in bioluminescence...', 'Adventure', 'Mysterious', 320, 'anthropic/claude-haiku-4.5', 3],
      ['Time travel paradox', 'She met herself at the coffee shop, thirty years older and terrified...', 'Sci-Fi', 'Mind-bending', 290, 'anthropic/claude-haiku-4.5', 5],
      ['Martial arts saga', 'The Jade Dragon technique had been lost for a thousand years...', 'Action', 'Intense', 380, 'anthropic/claude-haiku-4.5', 4],
      ['Alien invasion comedy', 'The aliens came to conquer Earth but got addicted to pizza first...', 'Comedy', 'Light', 240, 'anthropic/claude-haiku-4.5', 5],
      ['Western showdown', 'The desert town of Dusthaven had one rule: no magic after sundown...', 'Western', 'Dramatic', 330, 'anthropic/claude-haiku-4.5', 4]
    ];
    for (const a of aiStories) {
      await client.query(`INSERT INTO ai_stories (prompt, generated_story, genre, tone, word_count, model_used, rating) VALUES ($1,$2,$3,$4,$5,$6,$7)`, a);
    }
    console.log('AI stories seeded (15)');

    await client.query(`DELETE FROM ai_characters`);
    const aiChars = [
      ['Design a fire-based superhero', 'Blaze', '{"name":"Blaze","powers":["Pyrokinesis","Heat immunity","Fire flight"],"weakness":"Water-based attacks","costume":"Red and orange suit with flame patterns, ember-glowing visor","personality":"Hot-headed but warm-hearted, protective of innocents","origin":"Firefighter caught in a chemical plant explosion"}', 'Superhero', 'Hero'],
      ['Create an ice villain', 'Permafrost', '{"name":"Permafrost","powers":["Cryokinesis","Ice armor","Blizzard summoning"],"weakness":"Extreme heat","costume":"Crystalline armor with frost patterns","personality":"Cold, calculating, believes freezing the world will save it","origin":"Climate scientist driven mad by global warming data"}', 'Villain', 'Antagonist'],
      ['Design a stealth character', 'Whisper', '{"name":"Whisper","powers":["Sound manipulation","Echolocation","Sonic blasts"],"weakness":"Complete silence zones","costume":"Dark grey suit with sound-wave patterns","personality":"Quiet, observant, speaks volumes with actions","origin":"Deaf musician who gained supernatural hearing"}', 'Stealth', 'Anti-Hero'],
      ['Create a tech genius hero', 'Gigabyte', '{"name":"Gigabyte","powers":["Techno-telepathy","Digital consciousness","Hack anything"],"weakness":"EMP blasts","costume":"LED-embedded suit, holographic visor","personality":"Nerdy, anxious, but fierce in digital realm","origin":"Game developer absorbed into their own creation"}', 'Tech', 'Hero'],
      ['Design a nature guardian', 'Thornwall', '{"name":"Thornwall","powers":["Plant growth control","Photosynthesis healing","Thorn armor"],"weakness":"Fire and drought","costume":"Living plant armor with flower accents","personality":"Patient, nurturing, fierce when nature is threatened","origin":"Park ranger merged with ancient tree spirit"}', 'Nature', 'Guardian'],
      ['Create a speedster', 'Afterimage', '{"name":"Afterimage","powers":["Super speed","Time dilation perception","Speed clones"],"weakness":"Needs massive caloric intake","costume":"Streamlined silver suit with motion blur trail","personality":"Impatient, witty, always multitasking","origin":"Track star struck by temporal lightning"}', 'Speed', 'Hero'],
      ['Design a gravity hero', 'Newton', '{"name":"Newton","powers":["Gravity manipulation","Orbital throw","Zero-G zone creation"],"weakness":"Must stay grounded to use powers","costume":"Purple suit with orbital ring patterns","personality":"Intellectual, philosophical, sees all sides","origin":"Physicist whose experiment opened a gravitational rift"}', 'Science', 'Hero'],
      ['Create a shadow assassin', 'Umbra', '{"name":"Umbra","powers":["Shadow melding","Dark energy blades","Fear aura"],"weakness":"Bright light","costume":"Shifting shadow cloak, void-black mask","personality":"Brooding, conflicted, seeking redemption","origin":"Former spy consumed by experimental shadow tech"}', 'Dark', 'Anti-Hero'],
      ['Design a healing character', 'Solace', '{"name":"Solace","powers":["Bio-luminescent healing","Pain absorption","Regeneration aura"],"weakness":"Absorbs others pain as her own","costume":"White and gold suit with gentle glow","personality":"Empathetic, selfless, struggles with boundaries","origin":"Nurse exposed to alien healing crystals"}', 'Support', 'Healer'],
      ['Create a shapeshifter', 'Mimic', '{"name":"Mimic","powers":["Full shapeshifting","Power copying","Perfect disguise"],"weakness":"Loses sense of self with overuse","costume":"Morphing grey suit that adapts with them","personality":"Identity crisis, adaptable, secretly lonely","origin":"Clone experiment that developed consciousness"}', 'Versatile', 'Wildcard'],
      ['Design a psychic hero', 'Mindscape', '{"name":"Mindscape","powers":["Telepathy","Telekinesis","Mental constructs"],"weakness":"Psychic feedback from strong minds","costume":"Iridescent helmet, neural-pattern suit","personality":"Introspective, wise beyond years, haunted by others thoughts","origin":"Child prodigy whose powers awakened during a coma"}', 'Psychic', 'Hero'],
      ['Create a music-based hero', 'Resonance', '{"name":"Resonance","powers":["Sound manipulation","Harmonic shields","Sonic devastation"],"weakness":"Silence nullifies powers","costume":"Concert-style outfit with built-in speakers","personality":"Charismatic, dramatic, lives for the performance","origin":"Rock star whose voice mutated after a magical concert"}', 'Sound', 'Hero'],
      ['Design a cosmic entity', 'Nebula', '{"name":"Nebula","powers":["Star creation","Cosmic awareness","Energy absorption"],"weakness":"Earthly emotions confuse them","costume":"Swirling galaxy patterns, starlight crown","personality":"Ancient, curious about humanity, struggling to be small","origin":"Fragment of a dying star that gained consciousness"}', 'Cosmic', 'Entity'],
      ['Create an earth elemental', 'Bedrock', '{"name":"Bedrock","powers":["Earth manipulation","Seismic sense","Stone skin"],"weakness":"Cannot swim, sinks immediately","costume":"Rocky exterior, crystal formations on shoulders","personality":"Steadfast, reliable, terrible at small talk","origin":"Miner trapped in a cave-in who merged with the mountain"}', 'Elemental', 'Tank'],
      ['Design a luck-based hero', 'Jackpot', '{"name":"Jackpot","powers":["Probability manipulation","Lucky dodging","Jinx enemies"],"weakness":"Powers are unreliable, sometimes backfire","costume":"Playing card themed suit, dice cufflinks","personality":"Cocky, superstitious, secretly anxious about luck running out","origin":"Casino dealer who found a quantum probability coin"}', 'Luck', 'Wildcard']
    ];
    for (const a of aiChars) {
      await client.query(`INSERT INTO ai_characters (prompt, character_name, generated_design, style, archetype) VALUES ($1,$2,$3,$4,$5)`, a);
    }
    console.log('AI characters seeded (15)');

    await client.query(`DELETE FROM ai_dialogues`);
    const aiDialogues = [
      ['Write dialogue for a hero confronting a villain', 'Rooftop showdown at midnight', '{"lines":[{"character":"Hero","text":"It ends tonight, Obsidian.","emotion":"determined"},{"character":"Villain","text":"You say that every time. Yet here we are again.","emotion":"amused"},{"character":"Hero","text":"This time I have something you don\'t — friends.","emotion":"confident"}]}', 'Hero, Villain', 'Tense'],
      ['Create funny banter between partners', 'Stakeout in a car', '{"lines":[{"character":"Detective A","text":"You ate ALL the donuts?","emotion":"disbelief"},{"character":"Detective B","text":"I was stress eating. This stakeout is stressful.","emotion":"defensive"},{"character":"Detective A","text":"We\'ve been here ten minutes.","emotion":"deadpan"}]}', 'Detective A, Detective B', 'Humorous'],
      ['Write a mentor teaching moment', 'Training dojo scene', '{"lines":[{"character":"Master","text":"The sword is not your weapon. Your mind is.","emotion":"wise"},{"character":"Student","text":"Then why do I need to practice with a sword?","emotion":"confused"},{"character":"Master","text":"...Because minds are terrible at cutting things.","emotion":"amused"}]}', 'Master, Student', 'Wise'],
      ['Create a dramatic reveal dialogue', 'Secret identity exposed', '{"lines":[{"character":"Reporter","text":"I know who you really are.","emotion":"determined"},{"character":"Hero","text":"I\'m just a regular person.","emotion":"nervous"},{"character":"Reporter","text":"Regular people don\'t deflect bullets with their face.","emotion":"knowing"}]}', 'Reporter, Hero', 'Dramatic'],
      ['Write a team rallying speech', 'Before the final battle', '{"lines":[{"character":"Leader","text":"They think we\'re beaten. They think we\'ll run.","emotion":"fierce"},{"character":"Leader","text":"But we are the ones who run TOWARD danger.","emotion":"passionate"},{"character":"Team","text":"Together!","emotion":"united"}]}', 'Leader, Team', 'Inspiring'],
      ['Create villain monologue', 'Villain reveals plan', '{"lines":[{"character":"Villain","text":"You see, I don\'t want to destroy the world.","emotion":"calm"},{"character":"Villain","text":"I want to IMPROVE it. Remove the chaos. The freedom.","emotion":"intense"},{"character":"Hero","text":"Freedom isn\'t chaos. It\'s what makes us human.","emotion":"defiant"}]}', 'Villain, Hero', 'Philosophical'],
      ['Write romantic tension dialogue', 'Two heroes on patrol', '{"lines":[{"character":"Hero A","text":"You know, the stars look different when you\'re flying.","emotion":"wistful"},{"character":"Hero B","text":"Show me sometime?","emotion":"hopeful"},{"character":"Hero A","text":"...Is tomorrow too soon?","emotion":"flustered"}]}', 'Hero A, Hero B', 'Romantic'],
      ['Create a comic relief scene', 'Superhero costume shopping', '{"lines":[{"character":"Hero","text":"Does this cape make my butt look big?","emotion":"worried"},{"character":"Sidekick","text":"Capes are a safety hazard anyway.","emotion":"practical"},{"character":"Hero","text":"But capes are ICONIC!","emotion":"whining"}]}', 'Hero, Sidekick', 'Comedic'],
      ['Write a tense negotiation', 'Hostage situation', '{"lines":[{"character":"Negotiator","text":"Nobody needs to get hurt today.","emotion":"calm"},{"character":"Criminal","text":"That depends entirely on you.","emotion":"threatening"},{"character":"Negotiator","text":"Then let me make this easy for both of us.","emotion":"steady"}]}', 'Negotiator, Criminal', 'Suspenseful'],
      ['Create a farewell scene', 'Hero leaving the team', '{"lines":[{"character":"Hero","text":"I have to do this alone. You know that.","emotion":"sad"},{"character":"Partner","text":"I know. I just don\'t accept it.","emotion":"fighting tears"},{"character":"Hero","text":"Watch the city for me. I\'ll come back.","emotion":"resolute"}]}', 'Hero, Partner', 'Emotional'],
      ['Write alien first contact dialogue', 'Meeting aliens for the first time', '{"lines":[{"character":"Human","text":"We come in peace?","emotion":"uncertain"},{"character":"Alien","text":"Interesting. Our records show otherwise.","emotion":"matter-of-fact"},{"character":"Human","text":"...Fair point.","emotion":"sheepish"}]}', 'Human, Alien', 'Awkward'],
      ['Create training montage dialogue', 'Power training sequence', '{"lines":[{"character":"Trainer","text":"Again!","emotion":"demanding"},{"character":"Trainee","text":"I can\'t... I can\'t do it.","emotion":"exhausted"},{"character":"Trainer","text":"Your powers disagree. Again!","emotion":"knowing"}]}', 'Trainer, Trainee', 'Motivational'],
      ['Write a betrayal revelation', 'Ally revealed as traitor', '{"lines":[{"character":"Hero","text":"How long? How long have you been working for them?","emotion":"devastated"},{"character":"Traitor","text":"Since before I met you. I\'m sorry—that part was real.","emotion":"conflicted"},{"character":"Hero","text":"Nothing about you was real.","emotion":"bitter"}]}', 'Hero, Traitor', 'Heartbreaking'],
      ['Create a comic book narrator intro', 'Opening narration', '{"lines":[{"character":"Narrator","text":"This is a city of ten million stories.","emotion":"contemplative"},{"character":"Narrator","text":"Most of them end badly.","emotion":"ominous"},{"character":"Narrator","text":"This one? This one\'s different. Maybe.","emotion":"hopeful"}]}', 'Narrator', 'Atmospheric'],
      ['Write a power discovery scene', 'Teen discovers abilities', '{"lines":[{"character":"Teen","text":"MOM! The kitchen is floating!","emotion":"panicked"},{"character":"Mom","text":"What did you DO?","emotion":"shocked"},{"character":"Teen","text":"I just got angry at the toaster!","emotion":"confused"}]}', 'Teen, Mom', 'Humorous']
    ];
    for (const a of aiDialogues) {
      await client.query(`INSERT INTO ai_dialogues (prompt, scene_context, generated_dialogue, characters_involved, emotion) VALUES ($1,$2,$3,$4,$5)`, a);
    }
    console.log('AI dialogues seeded (15)');

    await client.query(`DELETE FROM ai_art_suggestions`);
    const aiArt = [
      ['Suggest art style for a dark superhero story', '{"style":"Neo-Noir","description":"Heavy blacks with selective color highlights, reminiscent of Sin City meets Batman: The Long Halloween","techniques":["Heavy inking","Limited color palette (black, white, red)","Dramatic shadow play","Rain effects"],"reference_artists":["Frank Miller","Tim Sale","Jock"],"mood":"Dark, gritty, atmospheric"}', 'Neo-Noir', 'Frank Miller, Tim Sale', 'Dark & Moody'],
      ['Best style for kids comic', '{"style":"Bright Cartoon","description":"Clean lines, bright colors, and expressive characters. Think Adventure Time meets Peanuts","techniques":["Simple clean outlines","Bright primary colors","Exaggerated expressions","Round, friendly shapes"],"reference_artists":["Charles Schulz","Pendleton Ward","Raina Telgemeier"],"mood":"Fun, energetic, welcoming"}', 'Cartoon', 'Schulz, Ward', 'Bright & Fun'],
      ['Art style for cyberpunk manga', '{"style":"Cyber-Manga","description":"Detailed mechanical designs with manga expressiveness, neon color accents on dark backgrounds","techniques":["Detailed mech design","Screen tones with neon overlays","Speed lines","Cross-hatching for texture"],"reference_artists":["Masamune Shirow","Tsutomu Nihei","Range Murata"],"mood":"Sleek, futuristic, intense"}', 'Cyber-Manga', 'Shirow, Nihei', 'Neon & Dark'],
      ['Style for fantasy adventure comic', '{"style":"Painterly Fantasy","description":"Rich, painted look with detailed backgrounds and warm lighting, like a storybook come to life","techniques":["Watercolor washes","Detailed environments","Warm lighting","Ornate borders"],"reference_artists":["Charles Vess","Fiona Staples","James Jean"],"mood":"Magical, warm, immersive"}', 'Painterly', 'Vess, Staples', 'Warm & Magical'],
      ['Horror comic art recommendations', '{"style":"Gothic Horror","description":"Heavy crosshatching, distorted perspectives, and unsettling compositions","techniques":["Dense crosshatching","Distorted anatomy","Claustrophobic panels","Ink splatter effects"],"reference_artists":["Junji Ito","Bernie Wrightson","Emily Carroll"],"mood":"Unsettling, atmospheric, creepy"}', 'Gothic Horror', 'Ito, Wrightson', 'Dark & Unsettling'],
      ['Art style for romantic comic', '{"style":"Soft Shoujo","description":"Delicate lines, flower motifs, and dreamy backgrounds with sparkle effects","techniques":["Thin delicate lines","Flower/sparkle overlays","Soft gradient backgrounds","Expressive eyes"],"reference_artists":["CLAMP","Arina Tanemura","Ai Yazawa"],"mood":"Dreamy, romantic, beautiful"}', 'Shoujo', 'CLAMP, Yazawa', 'Soft & Dreamy'],
      ['Comedy strip art style', '{"style":"Expressive Cartoon","description":"Exaggerated expressions, simple backgrounds, focus on character reactions","techniques":["Rubber hose animation style","Minimal backgrounds","Over-the-top expressions","Bold outlines"],"reference_artists":["Bill Watterson","Jim Davis","Berkeley Breathed"],"mood":"Playful, energetic, funny"}', 'Cartoon', 'Watterson, Davis', 'Playful'],
      ['Space opera visual style', '{"style":"Cosmic Realism","description":"Detailed spacecraft, vast space vistas, realistic character designs with sci-fi elements","techniques":["Detailed mechanical design","Vast scale compositions","Star field backgrounds","Light effects"],"reference_artists":["Moebius","Alex Ross","Esad Ribic"],"mood":"Grand, awe-inspiring, epic"}', 'Sci-Fi Realism', 'Moebius, Ross', 'Epic & Grand'],
      ['Steampunk comic art style', '{"style":"Victorian Industrial","description":"Intricate mechanical details, sepia tones, ornate Victorian design elements","techniques":["Gear and pipe details","Sepia/copper color palette","Ornate panel borders","Cross-section diagrams"],"reference_artists":["Sydney Padua","James Stokoe","Bryan Talbot"],"mood":"Intricate, warm, mechanical"}', 'Steampunk', 'Padua, Stokoe', 'Warm & Mechanical'],
      ['Underwater comic art approach', '{"style":"Aquatic Ethereal","description":"Flowing lines, blue-green palette, bioluminescent accents, floating compositions","techniques":["Wavy line work","Underwater lighting","Bubble effects","Flowing hair/fabric"],"reference_artists":["Yoshitaka Amano","Rebecca Sugar","Dustin Nguyen"],"mood":"Serene, mysterious, flowing"}', 'Ethereal', 'Amano, Nguyen', 'Serene & Flowing'],
      ['Post-apocalyptic art style', '{"style":"Wasteland Grit","description":"Rough textures, muted colors with occasional vivid accents, environmental storytelling","techniques":["Rough ink textures","Muted earth tones","Environmental details","Weathered effects"],"reference_artists":["Geof Darrow","Paul Pope","Rafael Grampá"],"mood":"Harsh, desolate, resilient"}', 'Wasteland', 'Darrow, Pope', 'Gritty & Raw'],
      ['Magical girl comic style', '{"style":"Sparkle Pop","description":"Vibrant transformation sequences, glitter effects, dynamic poses with flowing elements","techniques":["Transformation effects","Glitter/sparkle overlays","Dynamic magical poses","Pastel gradients"],"reference_artists":["Naoko Takeuchi","Studio Trigger","Jen Bartel"],"mood":"Empowering, sparkly, dynamic"}', 'Magical Girl', 'Takeuchi, Bartel', 'Vibrant & Sparkly'],
      ['Western gunslinger art style', '{"style":"Dusty Realism","description":"Sun-bleached colors, detailed landscapes, gritty character designs","techniques":["Desert color palette","Detailed landscapes","Weathered textures","Dramatic horizon shots"],"reference_artists":["Greg Smallwood","Matteo Scalera","Declan Shalvey"],"mood":"Hot, tense, cinematic"}', 'Western', 'Smallwood, Scalera', 'Cinematic & Dusty'],
      ['Psychological thriller art style', '{"style":"Distorted Reality","description":"Normal art that subtly warps, unreliable visual perspective, unsettling symmetry","techniques":["Perspective distortion","Panel layout that breaks rules","Color desaturation","Hidden visual details"],"reference_artists":["David Mack","Bill Sienkiewicz","Dave McKean"],"mood":"Unsettling, cerebral, layered"}', 'Psychological', 'Mack, McKean', 'Mind-bending'],
      ['Mythology comic art style', '{"style":"Epic Classical","description":"Inspired by classical art and sculpture, dramatic compositions, rich color palette","techniques":["Classical composition","Rich oil-painting colors","Dramatic lighting","Ornate mythological details"],"reference_artists":["Esad Ribic","Russell Dauterman","Peach Momoko"],"mood":"Majestic, powerful, timeless"}', 'Classical', 'Ribic, Dauterman', 'Majestic & Grand']
    ];
    for (const a of aiArt) {
      await client.query(`INSERT INTO ai_art_suggestions (prompt, generated_suggestion, style_type, reference_artists, color_mood) VALUES ($1,$2,$3,$4,$5)`, a);
    }
    console.log('AI art suggestions seeded (15)');

    await client.query(`DELETE FROM ai_plot_twists`);
    const twists = [
      ['Add twist to superhero origin', 'Hero discovers their powers come from a villain', '{"twist":"The hero\'s powers were actually implanted by the main villain as part of a long-term experiment. Every heroic act has been generating data for the villain\'s ultimate weapon.","impact":"Hero must choose: keep powers that help people but serve the villain, or lose them and find another way to fight.","foreshadowing":["Strange energy readings during power use","Villain always seems one step ahead","Powers malfunction near villain\'s base"]}', 'Identity', 'High'],
      ['Plot twist for mystery comic', 'The detective is the killer', '{"twist":"The detective solving the case has been committing the crimes during blackout episodes caused by an experimental drug they\'re taking for chronic pain.","impact":"Trust is shattered, the partner must decide whether to turn them in.","foreshadowing":["Detective\'s memory gaps","Evidence always slightly tampered with","Detective\'s injuries match crime scenes"]}', 'Whodunit', 'Extreme'],
      ['Romance comic twist', 'Lovers are from rival dimensions', '{"twist":"The two lovers discover their respective home dimensions are at war, and their love is actually a side-effect of a peace treaty spell that binds representatives together.","impact":"Is their love real or manufactured? They must find out while preventing dimensional war.","foreshadowing":["Strange energy when they touch","Both have recurring dreams of the other","Neither has clear memories before meeting"]}', 'Romantic', 'Medium'],
      ['Sci-fi story twist', 'Earth was the colony all along', '{"twist":"Humanity\'s \'first\' colony ship arrives at a planet only to find human ruins thousands of years old. Earth was the colony — the real homeworld is the planet they\'re colonizing.","impact":"Entire human history must be rewritten. Ancient enemies on the planet begin to wake.","foreshadowing":["Strange familiarity with alien landscapes","Earth myths that don\'t match geology","Colony planet has human-compatible everything"]}', 'Revelation', 'Extreme'],
      ['Fantasy quest twist', 'The quest was a trap', '{"twist":"The \'ancient prophecy\' was actually written by the villain 20 years ago and planted in the temple. Every step of the heroes\' quest has been delivering magical artifacts directly to the villain.","impact":"Heroes must undo everything they accomplished, retrieving each artifact from the villain\'s growing arsenal.","foreshadowing":["Prophecy written in suspiciously modern language","Convenient clues at each step","Villain never tries to stop them"]}', 'Betrayal', 'High'],
      ['Horror comic twist', 'The safe room is the trap', '{"twist":"The bunker where survivors have been hiding from monsters IS the monster. It\'s a giant mimicry creature that has been slowly digesting them, and the \'outside\' is actually safe.","impact":"Survivors must escape from inside the creature while it tries to keep them calm.","foreshadowing":["Walls feel warm","Room occasionally shifts layout","People who \'leave\' are never seen again"]}', 'Horror', 'Extreme'],
      ['Team dynamic twist', 'The sidekick is the strongest', '{"twist":"The bumbling sidekick has been suppressing planet-shattering powers. Their clumsiness is actually them constantly preventing catastrophic power leaks. They finally lose control.","impact":"Team must help the sidekick control their powers while dealing with the destruction.","foreshadowing":["Strange coincidences saving the team","Sidekick avoids emotional situations","Tiny earthquakes when sidekick gets upset"]}', 'Power', 'High'],
      ['Time travel twist', 'Hero IS the villain', '{"twist":"The villain terrorizing the city is actually the hero from the future, trying to prevent a greater catastrophe by committing smaller crimes now. The hero must become the villain.","impact":"A paradox where the hero must eventually go back in time and become what they fought against.","foreshadowing":["Villain knows hero\'s moves","Villain never causes lethal harm","Timeline anomalies around both characters"]}', 'Paradox', 'Extreme'],
      ['Comedy twist', 'Powers are contagious', '{"twist":"The hero\'s superpowers are actually a virus, and everyone they\'ve saved is slowly developing powers too. Soon the whole city has random, uncontrolled abilities.","impact":"Chaos ensues as ordinary people deal with powers. Hero must find a cure or learn to manage a super-powered population.","foreshadowing":["Saved civilians acting strange","Unusual abilities in the background","Hero never gets sick"]}', 'Chaos', 'Medium'],
      ['Alien invasion twist', 'We invited them', '{"twist":"Humanity sent a distress signal into space 50 years ago during a crisis. The \'invasion\' is actually a rescue mission, but human languages have changed so much they can\'t communicate.","impact":"Military must stand down and find a way to communicate before they destroy their own rescuers.","foreshadowing":["Aliens target military only when fired upon","Old radio equipment activating","Aliens protect human infrastructure"]}', 'Misunderstanding', 'High'],
      ['Heist comic twist', 'The heist already happened', '{"twist":"While the team plans an elaborate future heist, the mastermind reveals it was completed last week. Everything since has been the getaway — misdirecting the authorities with a fake \'upcoming\' heist.","impact":"Team realizes they\'re all carrying pieces of the loot without knowing it.","foreshadowing":["Mastermind oddly relaxed about planning","Security at target recently changed","Team members given odd personal items"]}', 'Meta', 'High'],
      ['School comic twist', 'Teachers are former villains', '{"twist":"The superhero academy\'s teachers are all reformed supervillains, teaching heroes by sharing their villainous expertise. A student discovers their favorite teacher\'s dark past.","impact":"Student must decide whether people can truly change, while a real threat requires the teachers\' villain skills.","foreshadowing":["Teachers suspiciously good at predicting villain tactics","Old newspaper clippings","Teachers avoid talking about their youth"]}', 'Identity', 'Medium'],
      ['Space twist', 'The ship is alive', '{"twist":"The generation ship humanity has been living on for centuries is a living organism. The \'malfunctions\' are actually the ship getting sick, and the crew needs to heal it rather than repair it.","impact":"Engineering becomes medicine, and the crew must form a symbiotic relationship with their home.","foreshadowing":["Ship systems respond to emotions","Organic-looking machinery","Ship \'breathes\' at night"]}', 'Revelation', 'High'],
      ['Noir twist', 'The city is sentient', '{"twist":"The city itself is a conscious entity that has been manipulating events, crimes, and investigations to maintain a balance it considers ideal. The detective is its current instrument.","impact":"Detective must break free of the city\'s influence while solving the case the city doesn\'t want solved.","foreshadowing":["Streets rearrange subtly","City infrastructure helps/hinders at convenient times","Other detectives warn about the city"]}', 'Cosmic', 'Extreme'],
      ['Origin story twist', 'Powers have an expiration', '{"twist":"All superpowers fade after exactly 10 years. The hero discovers this with only months left, while facing their greatest threat. Other retired heroes confirm they lost theirs too.","impact":"Hero must either find a way to extend powers or learn to be heroic without them.","foreshadowing":["Powers occasionally flicker","Retired heroes seem ordinary","No hero has been active more than a decade"]}', 'Limitation', 'High']
    ];
    for (const t of twists) {
      await client.query(`INSERT INTO ai_plot_twists (prompt, story_context, generated_twist, twist_type, intensity) VALUES ($1,$2,$3,$4,$5)`, t);
    }
    console.log('AI plot twists seeded (15)');

    await client.query(`DELETE FROM ai_scenes`);
    const scenes = [
      ['Describe a superhero\'s rooftop at night', '{"description":"The wind howls across the skyscraper\'s edge, 80 stories above the neon-soaked streets. Rain lashes against the hero\'s cape as they crouch on the gargoyle, scanning the city below. Lightning illuminates the skyline in stark white flashes, revealing a web of fire escapes and satellite dishes. The city breathes with a million tiny lights, each one a story waiting to unfold.","elements":["Gargoyle perch","Neon reflections in rain","Lightning-lit skyline","Cape billowing"]}', 'Rooftop', 'Night', 'Rainy', 'Dramatic'],
      ['Alien marketplace scene', '{"description":"Bioluminescent stalls stretch in every direction, their organic canopies pulsing with soft light. Vendors of a dozen species hawk wares ranging from temporal spices to bottled emotions. The air smells of ozone and alien flowers. Holographic price tags float above items, translating into whatever language the viewer speaks.","elements":["Bio-luminescent stalls","Multi-species crowd","Holographic signage","Floating merchandise"]}', 'Marketplace', 'Afternoon', 'Alien weather', 'Bustling'],
      ['Underground villain lair', '{"description":"Deep beneath the abandoned factory, a cathedral of technology hums with malevolent purpose. Screens displaying surveillance feeds cover every wall. A central platform holds the device — all chrome and crimson energy, pulsing like a mechanical heart. The only natural light comes from a shaft 200 feet above, a single beam cutting through the darkness.","elements":["Wall of screens","Central platform with device","Industrial cathedral","Single light shaft"]}', 'Underground Lair', 'N/A', 'Artificial', 'Menacing'],
      ['Enchanted forest at dawn', '{"description":"Golden light filters through leaves the size of dinner plates, each one dripping with morning dew that sparkles like liquid diamond. Ancient trees with faces slumbering in their bark form a natural cathedral. Fireflies — or are they fairies? — drift lazily through shafts of light. A crystal-clear stream babbles over smooth stones that hum with old magic.","elements":["Giant luminous leaves","Sentient trees","Fairy lights","Musical stream"]}', 'Forest', 'Dawn', 'Misty', 'Magical'],
      ['Cyberpunk street level', '{"description":"Neon kanji reflects off rain-slicked streets where food vendors serve ramen from converted server racks. Augmented citizens hurry past with glowing eye implants, their footsteps lost in the bass thrum of underground clubs. A massive holographic advertisement for BioSync Corp dominates the skyline, its model\'s smile flickering with signal interference.","elements":["Neon reflections","Food vendor carts","Augmented citizens","Massive holograms"]}', 'City Street', 'Night', 'Rainy', 'Gritty'],
      ['Underwater city panorama', '{"description":"Crystal domes rise from the ocean floor like enormous soap bubbles, each containing a different district of the city. Bioluminescent coral highways connect them, traveled by citizens in sleek aqua-pods. Schools of engineered fish carry messages and packages. The surface world is visible as a shimmering mirror far above.","elements":["Crystal domes","Coral highways","Aqua-pods","Engineered fish"]}', 'Underwater City', 'N/A', 'Deep ocean', 'Awe-inspiring'],
      ['Post-apocalyptic wasteland', '{"description":"The highway stretches endlessly across cracked earth, rusted cars frozen in their final traffic jam. Mutant vegetation — purple and luminescent — reclaims the road through spider-web cracks. On the horizon, the skeleton of a mega-city stands against an orange sky, its broken towers like the ribcage of a fallen giant.","elements":["Rusted car graveyard","Mutant vegetation","Skeleton city","Orange apocalyptic sky"]}', 'Highway', 'Sunset', 'Dusty', 'Desolate'],
      ['Magical academy great hall', '{"description":"The Great Hall soars upward into impossible architecture — staircases that lead to other dimensions, chandeliers of captured starlight, and a ceiling that displays the real-time cosmos. Students in color-coded robes practice levitation at breakfast while enchanted textbooks fly to their owners.","elements":["Impossible architecture","Starlight chandeliers","Cosmic ceiling","Flying textbooks"]}', 'Indoor Hall', 'Morning', 'Magical', 'Wondrous'],
      ['Space battle aftermath', '{"description":"Debris from a thousand ships drifts in silence through the void. Fires that should be impossible burn in oxygen-leaking hulls, creating ghostly auroras. A massive flagship, split in two, slowly rotates, its bridge still lit with emergency red. Escape pods scatter like dandelion seeds against the backdrop of a dying star.","elements":["Ship debris field","Impossible fires","Split flagship","Escape pods"]}', 'Space', 'N/A', 'Vacuum', 'Solemn'],
      ['Medieval tournament grounds', '{"description":"Banners of every noble house snap in the autumn wind above the tournament field. The jousting lane stretches between packed wooden stands where peasants and royalty alike cheer. Knights in gleaming armor wait in pavilions, squires rushing between them with lances and shields. The smell of roasted meat and fresh hay fills the air.","elements":["Noble house banners","Jousting lane","Knight pavilions","Crowded stands"]}', 'Tournament', 'Afternoon', 'Autumn wind', 'Exciting'],
      ['Haunted mansion interior', '{"description":"Dust particles dance in beams of moonlight piercing through moth-eaten curtains. A grand staircase splits and curves upward into shadow, its banister carved with screaming faces that seem to move in peripheral vision. Portraits line the walls, their eyes following visitors. Somewhere deep in the house, a clock chimes thirteen.","elements":["Moonlit dust","Screaming banister","Watching portraits","Thirteen chimes"]}', 'Mansion', 'Midnight', 'Eerie calm', 'Terrifying'],
      ['Futuristic laboratory', '{"description":"White walls pulse with embedded circuitry visible beneath translucent surfaces. Containment chambers hold specimens suspended in anti-gravity fields. Holographic displays show molecular structures that scientists manipulate with gesture controls. In the center, a quantum computer hums, its core visible as a constantly shifting geometric shape.","elements":["Circuit-embedded walls","Anti-gravity specimens","Holographic molecules","Quantum computer core"]}', 'Laboratory', 'N/A', 'Controlled', 'Clinical'],
      ['Dragon\'s mountain peak', '{"description":"The peak rises above the cloud line into a sky of deep purple twilight. The dragon\'s nest — a crater filled with gold, bones, and strange artifacts — glows with residual fire heat. Claw marks the size of cars score the volcanic rock. The air is thin and tastes of sulfur and magic. Far below, the kingdom looks like a toy village.","elements":["Above-cloud peak","Glowing treasure nest","Giant claw marks","Distant kingdom below"]}', 'Mountain', 'Twilight', 'Volcanic heat', 'Magnificent'],
      ['Robot factory assembly line', '{"description":"Mechanical arms move in a hypnotic dance, assembling humanoid robots on a conveyor that stretches to the horizon. Sparks shower like fireflies from welding stations. Nearly-complete robots hang from overhead tracks, their faces eerily peaceful. One robot on the line opens its eyes — it wasn\'t supposed to do that yet.","elements":["Assembly arms dance","Spark showers","Hanging robots","One awakening"]}', 'Factory', 'N/A', 'Industrial', 'Ominous'],
      ['Cosmic throne room', '{"description":"The throne room exists in open space, its floor a disc of crystallized starlight. Nebulae swirl beyond the invisible walls, painting everything in shifting colors. The throne itself is carved from a neutron star fragment, impossibly dense and glowing with contained fury. Cosmic entities drift in attendance like living constellations.","elements":["Starlight floor disc","Nebula backdrop","Neutron star throne","Living constellations"]}', 'Throne Room', 'Eternal', 'Cosmic', 'Transcendent']
    ];
    for (const s of scenes) {
      await client.query(`INSERT INTO ai_scenes (prompt, generated_scene, setting, time_of_day, weather, mood) VALUES ($1,$2,$3,$4,$5,$6)`, s);
    }
    console.log('AI scenes seeded (15)');

    await client.query(`DELETE FROM ai_villains`);
    const villains = [
      ['Create a tech villain', 'Cipher', '{"appearance":"Holographic suit that shifts patterns, fiber-optic hair, glowing circuit tattoos","powers":["Digital omniscience","Tech possession","Data corruption","Network manipulation"],"weakness":"Analog technology, no digital access","lair":"Abandoned server farm converted to digital fortress","catchphrase":"In the digital age, information isn\'t power — I am.","minions":"Army of hacked drones and corrupted AI assistants"}', 'Tech', 'Omega', 'Control all digital information'],
      ['Design a nature villain', 'Overgrowth', '{"appearance":"Humanoid covered in vines and thorns, flower crown of venus flytraps, bark-like skin","powers":["Accelerated plant growth","Pollen mind control","Photosynthesis immortality","Root network communication"],"weakness":"Extreme cold, herbicides","lair":"A reclaimed skyscraper turned into a vertical jungle","catchphrase":"Nature doesn\'t negotiate. It reclaims.","minions":"Mutant plant creatures and mind-controlled animals"}', 'Nature', 'High', 'Restore Earth to pre-human state'],
      ['Create a time villain', 'Paradox', '{"appearance":"Constantly shifting age appearance, wearing clothes from different eras simultaneously, clock embedded in chest","powers":["Time manipulation","Age acceleration/reversal","Temporal clones","Timeline viewing"],"weakness":"Fixed points in time, paradox feedback","lair":"A pocket dimension outside of time where all eras exist simultaneously","catchphrase":"Time heals all wounds. I open them.","minions":"Versions of themselves from different timelines"}', 'Temporal', 'Extreme', 'Rewrite history to prevent personal tragedy'],
      ['Design a psychic villain', 'Migraine', '{"appearance":"Shaved head with visible brain-pattern scars, third eye tattoo that glows, minimalist grey suit","powers":["Mass telepathy","Memory manipulation","Psychic constructs","Mental prison creation"],"weakness":"Strong-willed individuals, psychic feedback","lair":"An asylum they control, patients are psychic batteries","catchphrase":"Your thoughts were never private. I was always listening.","minions":"Mind-controlled civilians from all walks of life"}', 'Psychic', 'Extreme', 'Create a hive mind utopia'],
      ['Create a shadow villain', 'Eclipse', '{"appearance":"Living shadow with glowing white eyes, can take any shadow-form, wears a crown of darkness","powers":["Shadow manipulation","Light absorption","Fear manifestation","Shadow travel"],"weakness":"Absolute light sources, positive emotions","lair":"An artificially darkened city block called the Dark Zone","catchphrase":"Everyone is afraid of the dark. They should be.","minions":"Shadow wraiths and corrupted light-users"}', 'Shadow', 'High', 'Plunge the world into eternal darkness'],
      ['Design a corporate villain', 'Sterling', '{"appearance":"Perfect tailored suit, silver-grey hair, warm smile that never reaches the eyes, championship ring on each finger","powers":["Unlimited resources","Political manipulation","Strategic genius","Public perception control"],"weakness":"Ego, underestimates individuals","lair":"Top floor of Sterling Tower, a fortress disguised as luxury","catchphrase":"I don\'t break the law. I write it.","minions":"Private army, corrupted politicians, media empire"}', 'Corporate', 'High', 'Total economic domination'],
      ['Create an alien villain', 'Hivequeen Zyx', '{"appearance":"Elegant insectoid, iridescent carapace, multiple limbs, crown of antennae, regal bearing","powers":["Hive mind control","Acid spray","Rapid evolution","Spawn army"],"weakness":"Cold temperatures, individuality","lair":"Bio-organic mothership in lunar orbit","catchphrase":"Individuality is an evolutionary dead end.","minions":"Millions of hive-linked soldier drones"}', 'Alien', 'Extreme', 'Assimilate Earth into the Hive'],
      ['Design a magic villain', 'Grimoire', '{"appearance":"Ancient robes covered in living tattoo-spells, floating spell book companion, eyes that show other dimensions","powers":["Reality warping","Spell absorption","Dimensional summoning","Curse weaving"],"weakness":"Iron, broken promises","lair":"A library that exists between dimensions","catchphrase":"Magic has rules. I rewrite them.","minions":"Summoned creatures from forbidden dimensions"}', 'Magical', 'Extreme', 'Merge the magical and mundane worlds'],
      ['Create a mirror villain', 'Reflection', '{"appearance":"Perfect mirror-chrome skin, reflects and distorts surroundings, can look like anyone","powers":["Power mimicry","Perfect disguise","Reversed physics","Mirror dimension access"],"weakness":"Cannot mimic emotions, identity crisis","lair":"Hall of infinite mirrors that connects to everywhere with a reflective surface","catchphrase":"I am you. But better.","minions":"Mirror duplicates of heroes"}', 'Mimic', 'High', 'Replace all heroes with mirror copies'],
      ['Design a sound villain', 'Cacophony', '{"appearance":"Mechanical suit with massive speakers, sonic amplifiers on arms, equalizer visor","powers":["Destructive sound waves","Frequency manipulation","Sonic illusions","Voice mimicry"],"weakness":"Silence zones, dampening fields","lair":"Abandoned concert hall rigged with sonic weaponry","catchphrase":"The world will hear my symphony whether they want to or not.","minions":"Mind-controlled followers hearing a frequency that overrides free will"}', 'Sound', 'High', 'Broadcast a global mind-control frequency'],
      ['Create a gravity villain', 'Singularity', '{"appearance":"Constantly surrounded by orbiting debris, dark bodysuit with event horizon patterns, floating hair","powers":["Gravity manipulation","Black hole creation","Mass alteration","Orbital control"],"weakness":"Cannot affect themselves, finite range","lair":"Floating fortress in the stratosphere held aloft by gravity manipulation","catchphrase":"Everything falls eventually. I decide when.","minions":"Objects and people caught in gravitational orbit"}', 'Gravity', 'Extreme', 'Compress the Earth into a singularity to restart creation'],
      ['Design a plague villain', 'Contagion', '{"appearance":"Bio-hazard suit fused to skin, glowing green veins, cloud of microscopic organisms","powers":["Disease creation","Immunity manipulation","Biological evolution control","Healing corruption"],"weakness":"Extreme sterilization, their own creations","lair":"Underground bio-lab beneath a hospital","catchphrase":"Sickness is nature\'s way of evolution. I am nature\'s accelerant.","minions":"Infected individuals with enhanced abilities"}', 'Biological', 'Extreme', 'Force accelerated evolution through controlled pandemics'],
      ['Create a dream villain', 'Sandman', '{"appearance":"Sleepwear that shifts like clouds, sand constantly falling from hands, drowsy aura","powers":["Dream invasion","Sleep induction","Nightmare manifestation","Subconscious mining"],"weakness":"Insomniacs, lucid dreamers","lair":"The collective unconscious — a shared dream realm","catchphrase":"Sleep tight. I\'ll be there when you do.","minions":"Nightmare creatures that cross into reality through sleeping minds"}', 'Dream', 'High', 'Trap humanity in a perfect dream while controlling reality'],
      ['Design an ice villain', 'Absolute Zero', '{"appearance":"Crystalline ice armor, freezing breath visible, blue-white glowing eyes, temperature drops around them","powers":["Cryokinesis","Molecular freeze","Ice construct creation","Heat absorption"],"weakness":"Extreme heat, isolation affects mental state","lair":"Frozen fortress in Antarctica, a palace of living ice","catchphrase":"At absolute zero, even molecules stop fighting. Peace at last.","minions":"Ice golems and frozen reanimated creatures"}', 'Ice', 'High', 'Freeze the planet to create perfect stillness'],
      ['Create a chaos villain', 'Entropy', '{"appearance":"Constantly shifting, glitching appearance, reality warps around them, fractured halo","powers":["Chaos inducement","Probability destruction","Order dissolution","Random power manifestation"],"weakness":"Pattern recognition, true randomness hurts them too","lair":"A zone of pure chaos where physics is optional","catchphrase":"Order is the real villain. I\'m just setting everything free.","minions":"Chaos-touched individuals whose abilities change randomly"}', 'Chaos', 'Extreme', 'Dissolve all laws of physics and society']
    ];
    for (const v of villains) {
      await client.query(`INSERT INTO ai_villains (prompt, villain_name, generated_profile, villain_type, threat_level, motivation) VALUES ($1,$2,$3,$4,$5,$6)`, v);
    }
    console.log('AI villains seeded (15)');

    // Seed Comic Panels (15)
    await client.query(`DELETE FROM comic_panels`);
    const panels = [
      [1, 1, 'A medieval castle courtyard at sunset. A meteorite streaks across the amber sky.', 'What manner of star falls from the heavens?', 'Wonder', 'wide', 'Warm golden lighting, dramatic sky'],
      [1, 2, 'The knight reaches toward the glowing meteorite crater, blue quantum energy crackling.', 'It calls to me... I cannot resist its pull.', 'Mysterious', 'standard', 'Blue energy glow contrast with warm setting'],
      [1, 3, 'Close-up of the knight\'s face as quantum energy flows through his armor, eyes glowing blue.', '', 'Transformation', 'close-up', 'Intense blue glow, detailed armor reflections'],
      [2, 1, 'Nighttime Tokyo skyline with a shadowy cat silhouette on a rooftop.', '', 'Atmospheric', 'panoramic', 'Neon-lit city, silhouette focus'],
      [2, 2, 'Miko the shadow cat reveals her true form — a mystical guardian with purple energy.', 'The darkness stirs again. I must protect this city.', 'Determined', 'dynamic', 'Purple energy effects, dynamic pose'],
      [3, 1, 'A neon-drenched alleyway with holographic advertisements and rain.', 'In Neo Shanghai, every shadow has a price.', 'Noir', 'wide', 'Cyberpunk neon palette, rain effects'],
      [3, 2, 'Zero jacking into a corporate mainframe, digital code surrounding them.', 'Firewalls this strong means something worth stealing.', 'Focused', 'standard', 'Digital effects, code visualization'],
      [4, 1, 'A vast dead landscape with a single greenhouse dome in the distance.', 'Day 1,247. The dome holds. The world does not.', 'Melancholy', 'panoramic', 'Desolate earth tones, single green accent'],
      [5, 1, 'An alien crime scene on a space station. Purple blood, bizarre evidence markers.', 'The victim is Xentari. Third this cycle. Same method.', 'Investigative', 'standard', 'Alien forensic details, sci-fi setting'],
      [5, 2, 'Two detectives examining evidence with holographic magnifiers.', 'This isn\'t random. Someone\'s hunting diplomats.', 'Tense', 'standard', 'Holographic tools, focused characters'],
      [6, 1, 'A hidden mountain academy with dragons circling the peaks.', '', 'Majestic', 'splash', 'Epic scale, dragon silhouettes'],
      [7, 1, 'A robot samurai standing in a bamboo forest, cherry blossoms falling.', 'I was built for war. I choose peace.', 'Serene', 'standard', 'Japanese aesthetic, mechanical meets natural'],
      [9, 1, 'A family spaceship approaching a colorful alien planet.', 'Kids, welcome to Planet Zephyria!', 'Exciting', 'wide', 'Vibrant alien colors, family-friendly tone'],
      [10, 1, 'A dark tattoo parlor. A freshly inked dragon tattoo begins to glow.', 'That\'s... that\'s not supposed to happen.', 'Horror', 'close-up', 'Dark lighting, glowing tattoo detail'],
      [11, 1, 'A living room where pets secretly wear tiny capes behind the sofa.', 'Operation: Mailman is a go!', 'Comedic', 'standard', 'Cute pets, tiny superhero costumes']
    ];
    for (const p of panels) {
      await client.query(`INSERT INTO comic_panels (story_id, panel_number, scene_description, dialogue, mood, layout_type, art_notes) VALUES ($1,$2,$3,$4,$5,$6,$7)`, p);
    }
    console.log('Comic panels seeded (15)');

    console.log('\n✅ All seed data inserted successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

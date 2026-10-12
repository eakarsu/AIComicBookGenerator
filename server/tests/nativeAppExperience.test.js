'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const express = require('express');
const jwt = require('jsonwebtoken');

const projectRoot = path.resolve(__dirname, '..', '..');

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise(resolve => server.close(resolve));
}

test('native experience exposes demo login, complete examples, explicit generation controls, retry, and centered details', () => {
  const html = fs.readFileSync(path.join(projectRoot, 'public/index.html'), 'utf8');
  const script = fs.readFileSync(path.join(projectRoot, 'public/js/app.js'), 'utf8');
  const css = fs.readFileSync(path.join(projectRoot, 'public/css/styles.css'), 'utf8');

  assert.match(html, /id="fillCredsBtn"[^>]*>[^<]*Log In as Demo/);
  assert.match(script, /await apiRequest\('\/api\/auth\/defaults'\)/);
  assert.match(script, /const AI_EXAMPLE_PROFILES = \[/);
  assert.equal((script.match(/label: '.*?', subject:/g) || []).length, 3);
  assert.equal((script.match(/name: 'source_story_id'/g) || []).length, 7);
  assert.match(script, /type === 'source-story-select'/);
  assert.match(script, /Existing source-record selections are preserved/);
  assert.match(script, /Generate with OpenRouter/);
  assert.match(script, /function cancelAiGeneration/);
  assert.match(script, /signal: controller\.signal/);
  assert.match(script, /headers: authHeaders\(true\)/);
  assert.match(script, /function retryAiGeneration/);
  assert.match(script, /OpenRouter generation failed/);
  assert.match(script, /Edit<\/button>[\s\S]*Delete<\/button>[\s\S]*Cancel<\/button>/);
  assert.match(css, /\.detail-panel \{[\s\S]*top: 50%; left: 50%;[\s\S]*transform: translate\(-50%, -50%\)/);
  assert.match(css, /\.ai-output-current/);
});

test('AI route uses authenticated deterministic provider and never writes on unavailable provider', async t => {
  const originalEnv = {
    JWT_SECRET: process.env.JWT_SECRET,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
  };
  const providerRequests = [];
  let signalDelayedRequest;
  const delayedRequestSeen = new Promise(resolve => { signalDelayedRequest = resolve; });
  const provider = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const parsedBody = JSON.parse(body);
    providerRequests.push({ authorization: req.headers.authorization, body: parsedBody });
    if (parsedBody.messages?.[1]?.content === 'Delayed cancellation fixture') {
      signalDelayedRequest();
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      model: 'fixture/comic-writer',
      choices: [{ message: { content: '# Fixture Story\n\n- Panel one: Nova checks the beacon.\n- Panel two: Malik marks the safe route.' } }],
      usage: { total_tokens: 42 },
    }));
  });
  const providerPort = await listen(provider);

  process.env.JWT_SECRET = 'fixture-jwt-secret-at-least-thirty-two-characters';
  process.env.OPENROUTER_API_KEY = 'fixture-provider-key';
  process.env.OPENROUTER_BASE_URL = `http://127.0.0.1:${providerPort}`;
  process.env.OPENROUTER_MODEL = 'fixture/comic-writer';

  const writes = [];
  const fakePool = {
    async query(sql, values) {
      if (/SELECT id, title, genre, synopsis FROM comic_stories/.test(sql)) {
        assert.deepEqual(values, [42]);
        return { rows: [{ id: 42, title: 'Existing Beacon Story', genre: 'Adventure', synopsis: 'Nova protects the flood beacon.' }] };
      }
      assert.match(sql, /INSERT INTO ai_stories/);
      writes.push({ sql, values });
      return { rows: [{
        id: 9001,
        prompt: values[0],
        generated_story: values[1],
        genre: values[2],
        tone: values[3],
        word_count: values[4],
        model_used: values[5],
        rating: 0,
      }] };
    },
  };

  const dbPath = require.resolve('../db');
  const routePath = require.resolve('../routes/ai');
  const previousDb = require.cache[dbPath];
  const previousRoute = require.cache[routePath];
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fakePool };
  delete require.cache[routePath];

  const app = express();
  app.use(express.json());
  app.use('/api/ai', require('../routes/ai'));
  const server = http.createServer(app);
  const appPort = await listen(server);
  const token = jwt.sign({ id: 77, email: 'fixture@example.invalid' }, process.env.JWT_SECRET);

  t.after(async () => {
    await close(server);
    await close(provider);
    if (previousDb) require.cache[dbPath] = previousDb; else delete require.cache[dbPath];
    if (previousRoute) require.cache[routePath] = previousRoute; else delete require.cache[routePath];
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    });
  });

  const response = await fetch(`http://127.0.0.1:${appPort}/api/ai/generate-story`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_story_id: 42, prompt: 'Fixture rescue brief', genre: 'Superhero', tone: 'Hopeful' }),
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.id, 9001);
  assert.match(data.generated_story, /Fixture Story/);
  assert.equal(providerRequests.length, 1);
  assert.equal(providerRequests[0].authorization, 'Bearer fixture-provider-key');
  assert.equal(providerRequests[0].body.model, 'fixture/comic-writer');
  assert.match(providerRequests[0].body.messages[1].content, /AUTHENTIC SOURCE STORY/);
  assert.match(providerRequests[0].body.messages[1].content, /Existing Beacon Story/);
  assert.match(providerRequests[0].body.messages[1].content, /Fixture rescue brief/);
  assert.equal(writes.length, 1);

  const cancellation = new AbortController();
  const cancelledRequest = fetch(`http://127.0.0.1:${appPort}/api/ai/generate-story`, {
    method: 'POST',
    signal: cancellation.signal,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Delayed cancellation fixture', genre: 'Superhero', tone: 'Hopeful' }),
  });
  await delayedRequestSeen;
  cancellation.abort();
  await assert.rejects(cancelledRequest, error => error.name === 'AbortError');
  await new Promise(resolve => setTimeout(resolve, 180));
  assert.equal(providerRequests.length, 2);
  assert.equal(writes.length, 1, 'a cancelled provider request must not persist a generation');

  delete process.env.OPENROUTER_API_KEY;
  const unavailable = await fetch(`http://127.0.0.1:${appPort}/api/ai/generate-story`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Must not run', genre: 'Mystery', tone: 'Tense' }),
  });
  const unavailableData = await unavailable.json();
  assert.equal(unavailable.status, 503);
  assert.match(unavailableData.error, /OPENROUTER_API_KEY/);
  assert.equal(providerRequests.length, 2);
  assert.equal(writes.length, 1);
});

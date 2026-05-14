# Audit Note — AIComicBookGenerator

Source: `_AUDIT/reports/batch_01.md` (Project 33)

## Maturity: TEMPLATE-CLONE (5 routes, 9 AI endpoints, deps installed)

## Original audit recommendations

### Gaps & Opportunities
- "Mature feature set" — core AI workflow already in place.

### Strategic Feature Suggestions
1. Rights Management Agent (subsidiary rights, translation, audiobook).
2. Multilingual Launch Optimization.
3. Real-time Competitive Pricing.
4. Integrations: IngramSpark, Amazon KDP, Smashwords, translation APIs.

## Categorization
- **MECHANICAL:** None — the audit reports a mature feature set; the strategic
  suggestions all require third-party data feeds (KDP/IngramSpark) or substantial
  agentic infrastructure.
- **NEEDS-CREDS:** All four integrations.
- **NEEDS-PRODUCT-DECISION:** Rights Management Agent (multi-step negotiation), pricing model.

## Implementations applied
- None this round. The 9 AI endpoints (generate-story, generate-character,
  generate-dialogue, generate-art-suggestion, generate-scene, generate-villain,
  plot-twist, generate-plot-twist, generate-panel) cover the core domain.

## Backlog (prioritized)

### High priority
- **Multilingual story export** — `POST /api/ai/translate-story` (mechanical to add given the existing pattern in `routes/ai.js`).
- **Audio narration script generation** (`POST /api/ai/generate-narration`).

### Medium priority
- **Rights agent** — multi-step negotiation; needs market-data inputs.
- **KDP / IngramSpark / Smashwords connectors** — credentials.

### Low priority
- Real-time competitive pricing.
- Translation API connector (DeepL, Google Translate) for the multilingual feature.

## Apply pass 3 (frontend)

**Action:** UPDATED-FE.

**Stack:** Express server + Vite/React (JSX, plain react-router-dom). Auth via `localStorage.getItem('comic_token')` (see `client/src/App.jsx` `AuthProvider`).

**Backend AI endpoints surfaced:** `/api/ai/generate-story`, `/generate-character`, `/generate-dialogue`, `/generate-art-suggestion`, `/generate-scene`, `/generate-villain`, `/plot-twist`, `/generate-plot-twist` (legacy alias), `/generate-panel`. All in `server/routes/ai.js`, mounted at `/api/ai` in `server/index.js`. They are public (no `authenticate` middleware) but the FE still sends `Authorization: Bearer <comic_token>` for forward compat.

**Frontend gap before this pass:** `CreateStory.jsx` only wires `generate-story`, `generate-villain`, and `plot-twist` — 6 of the 9 AI endpoints had no UI.

**Files:**
- `client/src/pages/AITools.jsx` (new). Tabs for Character / Dialogue / Art Style / Scene / Panel covering the 5 unwired user-facing endpoints. Reuses the dark theme inline-style palette of `CreateStory.jsx`. JWT Bearer header from `localStorage`. 503/auth-error message detection so the page shows "AI service unavailable: OPENROUTER_API_KEY not configured on server" instead of a generic 500.
- `client/src/App.jsx` (edited). Added `import AITools` and `<Route path="/ai-tools">`. Added an "AI Tools" link to the nav.

**Syntax check:** PASS — `esbuild --loader:.jsx=jsx` clean for both edited files.

**Notes:** `generate-panel` requires a `story_id`; the new tab lazy-fetches `/api/stories` so the user can pick from a dropdown. The legacy `generate-plot-twist` route is intentionally not exposed in the UI (it's superseded by `plot-twist`, already wired in `CreateStory.jsx`). No new dependencies; no `npm install` performed.

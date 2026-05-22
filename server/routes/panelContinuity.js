const express = require('express');
const router = express.Router();

router.post('/check', (req, res) => {
  const panels = Array.isArray(req.body?.panels) ? req.body.panels : [
    { panel: 1, character: 'Nova', costume: 'red jacket', location: 'rooftop', prop: 'signal watch' },
    { panel: 2, character: 'Nova', costume: 'blue jacket', location: 'rooftop', prop: 'signal watch' },
  ];
  const firstByCharacter = new Map();
  const findings = [];
  for (const panel of panels) {
    const prev = firstByCharacter.get(panel.character);
    if (!prev) {
      firstByCharacter.set(panel.character, panel);
      continue;
    }
    ['costume', 'location', 'prop'].forEach((key) => {
      if (prev[key] && panel[key] && prev[key] !== panel[key]) {
        findings.push({ panel: panel.panel, character: panel.character, field: key, expected: prev[key], actual: panel[key] });
      }
    });
  }
  res.json({ findingCount: findings.length, status: findings.length ? 'continuity_review' : 'consistent', findings });
});

module.exports = router;

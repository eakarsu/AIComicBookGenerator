import React, { useState } from 'react';

export default function PanelContinuityPage() {
  const [payload, setPayload] = useState(JSON.stringify({ panels: [
    { panel: 1, character: 'Nova', costume: 'red jacket', location: 'rooftop', prop: 'signal watch' },
    { panel: 2, character: 'Nova', costume: 'blue jacket', location: 'rooftop', prop: 'signal watch' }
  ] }, null, 2));
  const [result, setResult] = useState(null);
  const run = async () => {
    const res = await fetch('/api/panel-continuity/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(JSON.parse(payload)) });
    setResult(await res.json());
  };
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Panel Continuity Checker</h1>
      <textarea style={{ width: '100%', minHeight: 220 }} value={payload} onChange={(event) => setPayload(event.target.value)} />
      <button onClick={run}>Check Continuity</button>
      {result && <section><h2>{result.status} · {result.findingCount}</h2>{result.findings.map((row) => <p key={`${row.panel}-${row.field}`}>Panel {row.panel}: {row.character} {row.field} expected {row.expected}, got {row.actual}</p>)}</section>}
    </main>
  );
}

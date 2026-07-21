'use strict';
const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const auth = require('../middleware/auth');
const { transition, validateExport } = require('../domain/publishingWorkflow');
const router = express.Router();
router.use(auth);

function tenant(req, res) { if (!req.user.tenant_id) { res.status(403).json({ error: 'Tenant-scoped identity required' }); return null; } return req.user.tenant_id; }

router.post('/projects', async (req, res) => {
  const tenantId = tenant(req, res); if (!tenantId) return;
  const { title, brief, characterBible = {} } = req.body;
  if (!title || !brief || typeof brief !== 'object') return res.status(400).json({ error: 'Title and structured brief required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); const projectId = crypto.randomUUID(); const versionId = crypto.randomUUID();
    await client.query(`INSERT INTO studio_projects(id,tenant_id,title,status) VALUES($1,$2,$3,'brief')`, [projectId, tenantId, title]);
    await client.query(`INSERT INTO project_versions(id,tenant_id,project_id,version,brief,character_bible,created_by) VALUES($1,$2,$3,1,$4,$5,$6)`, [versionId, tenantId, projectId, JSON.stringify(brief), JSON.stringify(characterBible), req.user.id]);
    await client.query(`INSERT INTO studio_audit_events(tenant_id,aggregate_id,actor_id,event_type,payload) VALUES($1,$2,$3,'project.created',$4)`, [tenantId, projectId, req.user.id, JSON.stringify({ version: 1 })]);
    await client.query('COMMIT'); res.status(201).json({ id: projectId, versionId, status: 'brief' });
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Unable to create project' }); } finally { client.release(); }
});

router.post('/projects/:id/assets', async (req, res) => {
  const tenantId = tenant(req, res); if (!tenantId) return;
  const { objectKey, sha256, rightsBasis, licensor, licenseReference } = req.body;
  if (!objectKey || !/^[a-f0-9]{64}$/i.test(sha256 || '') || !rightsBasis) return res.status(400).json({ error: 'Object key, SHA-256, and rights basis required' });
  const result = await pool.query(`INSERT INTO source_assets(id,tenant_id,project_id,object_key,sha256,rights_basis,licensor,license_reference)
    SELECT $1,$2,p.id,$4,$5,$6,$7,$8 FROM studio_projects p WHERE p.id=$3 AND p.tenant_id=$2 RETURNING *`, [crypto.randomUUID(), tenantId, req.params.id, objectKey, sha256.toLowerCase(), rightsBasis, licensor || null, licenseReference || null]);
  if (!result.rowCount) return res.status(404).json({ error: 'Project not found in tenant' });
  res.status(201).json(result.rows[0]);
});

router.post('/assets/:id/verify-rights', async (req, res) => {
  const tenantId = tenant(req, res); if (!tenantId) return;
  if (!['editor','publisher','admin'].includes(req.user.role)) return res.status(403).json({ error: 'Rights verification role required' });
  if (!req.body.licenseReference) return res.status(400).json({ error: 'License reference required' });
  const result = await pool.query(`UPDATE source_assets SET license_reference=COALESCE($1,license_reference),rights_verified_by=$2,rights_verified_at=now() WHERE id=$3 AND tenant_id=$4 RETURNING *`, [req.body.licenseReference || null, String(req.user.id), req.params.id, tenantId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Asset not found' });
  res.json(result.rows[0]);
});

router.post('/projects/:id/transition', async (req, res) => {
  const tenantId = tenant(req, res); if (!tenantId) return;
  if (!['creator','editor','publisher','admin'].includes(req.user.role)) return res.status(403).json({ error: 'Studio role required' });
  if (['approved','published'].includes(req.body.status)) return res.status(400).json({ error: 'Use the governed approval/export path' });
  if (req.body.moderationStatus && !['editor','publisher','admin'].includes(req.user.role)) return res.status(403).json({ error: 'Moderation decision role required' });
  try {
    const found = await pool.query('SELECT * FROM studio_projects WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]);
    if (!found.rowCount) return res.status(404).json({ error: 'Project not found' });
    const next = transition(found.rows[0].status, req.body.status, { actorRole: req.user.role });
    await pool.query(`UPDATE studio_projects SET status=$1,version=version+1,moderation_status=CASE WHEN $2::text IS NULL THEN moderation_status ELSE $2 END WHERE id=$3 AND tenant_id=$4`, [next, req.body.moderationStatus || null, req.params.id, tenantId]);
    await pool.query(`INSERT INTO studio_audit_events(tenant_id,aggregate_id,actor_id,event_type,payload) VALUES($1,$2,$3,'project.status_changed',$4)`, [tenantId, req.params.id, String(req.user.id), JSON.stringify({ from: found.rows[0].status, to: next, moderationStatus: req.body.moderationStatus || null })]);
    res.json({ status: next });
  } catch (error) { res.status(409).json({ error: error.message }); }
});

router.post('/projects/:id/approve', async (req, res) => {
  const tenantId = tenant(req, res); if (!tenantId) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const project = await client.query('SELECT * FROM studio_projects WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, tenantId]);
    if (!project.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Project not found' }); }
    const rights = await client.query(`SELECT count(*)::int AS total,count(rights_verified_at)::int AS verified FROM source_assets WHERE project_id=$1 AND tenant_id=$2`, [req.params.id, tenantId]);
    const context = { rightsVerified: rights.rows[0].total > 0 && rights.rows[0].total === rights.rows[0].verified, moderationStatus: project.rows[0].moderation_status, actorRole: req.user.role };
    transition(project.rows[0].status, 'approved', context);
    const version = await client.query('SELECT id FROM project_versions WHERE project_id=$1 AND tenant_id=$2 ORDER BY version DESC LIMIT 1', [req.params.id, tenantId]);
    await client.query(`INSERT INTO publishing_approvals(id,tenant_id,project_version_id,approver_id,decision,notes) VALUES($1,$2,$3,$4,'approved',$5)`, [crypto.randomUUID(), tenantId, version.rows[0].id, req.user.id, req.body.notes || null]);
    await client.query(`UPDATE studio_projects SET status='approved',approved_by=$1,approved_at=now(),version=version+1 WHERE id=$2 AND tenant_id=$3`, [req.user.id, req.params.id, tenantId]);
    await client.query(`INSERT INTO studio_audit_events(tenant_id,aggregate_id,actor_id,event_type,payload) VALUES($1,$2,$3,'project.approved',$4)`, [tenantId, req.params.id, String(req.user.id), JSON.stringify({ versionId: version.rows[0].id })]);
    await client.query('COMMIT'); res.json({ status: 'approved' });
  } catch (error) { await client.query('ROLLBACK'); res.status(409).json({ error: error.message }); } finally { client.release(); }
});

router.post('/projects/:id/exports', async (req, res) => {
  const tenantId = tenant(req, res); if (!tenantId) return;
  const key = req.get('Idempotency-Key'); if (!key) return res.status(400).json({ error: 'Idempotency-Key required' });
  try {
    const check = validateExport(req.body.manifest);
    const project = await pool.query(`SELECT p.status,v.id AS version_id FROM studio_projects p JOIN project_versions v ON v.project_id=p.id AND v.version=p.current_version WHERE p.id=$1 AND p.tenant_id=$2`, [req.params.id, tenantId]);
    if (!project.rowCount || project.rows[0].status !== 'approved') return res.status(409).json({ error: 'Only approved project versions can be exported' });
    const result = await pool.query(`INSERT INTO export_jobs(id,tenant_id,project_version_id,idempotency_key,format,manifest,status) VALUES($1,$2,$3,$4,$5,$6,'queued') ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`, [crypto.randomUUID(), tenantId, project.rows[0].version_id, key, check.format, JSON.stringify(req.body.manifest)]);
    res.status(202).json(result.rows[0]);
  } catch (error) { res.status(422).json({ error: error.message }); }
});
module.exports = router;

BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'creator';
CREATE TABLE IF NOT EXISTS studio_projects (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, title text NOT NULL, status text NOT NULL CHECK (status IN ('brief','generating','editing','review','approved','packaging','published','failed')),
  current_version integer NOT NULL DEFAULT 1, moderation_status text NOT NULL DEFAULT 'pending', approved_by text, approved_at timestamptz,
  version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS source_assets (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES studio_projects(id), object_key text NOT NULL,
  sha256 char(64) NOT NULL, rights_basis text NOT NULL, licensor text, license_reference text, rights_verified_by text,
  rights_verified_at timestamptz, private boolean NOT NULL DEFAULT true, UNIQUE (tenant_id, sha256)
);
CREATE TABLE IF NOT EXISTS project_versions (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES studio_projects(id), version integer NOT NULL,
  brief jsonb NOT NULL, character_bible jsonb NOT NULL, created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id, version)
);
CREATE TABLE IF NOT EXISTS generated_assets (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_version_id uuid NOT NULL REFERENCES project_versions(id), idempotency_key text NOT NULL,
  kind text NOT NULL, object_key text, sha256 char(64), width integer, height integer, model text, prompt_version integer,
  provenance jsonb NOT NULL DEFAULT '{}', status text NOT NULL CHECK (status IN ('queued','rendering','ready','failed')), failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (tenant_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS publishing_approvals (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_version_id uuid NOT NULL REFERENCES project_versions(id), approver_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved','changes_requested')), notes text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS export_jobs (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, project_version_id uuid NOT NULL REFERENCES project_versions(id), idempotency_key text NOT NULL,
  format text NOT NULL CHECK (format IN ('cbz','pdf','epub','print_pdf')), manifest jsonb NOT NULL, package_checksum char(64),
  status text NOT NULL CHECK (status IN ('queued','processing','ready','failed')), failure_code text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS studio_audit_events (
  sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tenant_id uuid NOT NULL, aggregate_id uuid NOT NULL, actor_id text,
  event_type text NOT NULL, payload jsonb NOT NULL DEFAULT '{}', occurred_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;

# Operations

Copy `.env.example` to `.env`, replace secrets, run `scripts/bootstrap.sh` once, and run `scripts/migrate.sh` for reviewed schema changes. `start.sh` does not install, seed, migrate, elevate database users, or kill ports. Demo seeding requires `CONFIRM_DEMO_SEED=yes` and an explicit password.

The governed API is `/api/publishing-workflow`. It stores versioned briefs, checksummed private source assets, rights evidence, render provenance, editorial approvals, and idempotent export jobs. Rendering, object storage, editor integration, moderation, publication targets, rights verification, and visual/export-fidelity review require configured external systems and accountable reviewers; queued work is never reported as delivered.

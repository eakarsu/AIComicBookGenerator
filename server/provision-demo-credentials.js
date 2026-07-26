const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const pool = require('./db');

async function main() {
  const email = String(process.env.DEMO_EMAIL || process.env.DEMO_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.DEMO_PASSWORD || process.env.DEMO_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '');
  const digest = crypto.createHash('sha256').update(email).digest('hex');
  const tenantId = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
  if (!email || password.length < 12) throw new Error('Local demo credentials are incomplete');
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users(email,password,name,role,tenant_id) VALUES($1,$2,$3,'admin',$4)
     ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role='admin',tenant_id=EXCLUDED.tenant_id`,
    [email, hash, 'Runtime Administrator', tenantId],
  );
  await pool.end();
  console.log('Provisioned local demo administrator.');
}
main().catch((error) => { console.error(error.message); process.exit(1); });

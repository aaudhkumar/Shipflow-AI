const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/shipflow'
});

async function run() {
  try {
    const res = await pool.query("SELECT event_id, event_type, status, created_at, payload->>'action' as action FROM webhook_events WHERE event_type LIKE 'issues%' ORDER BY created_at DESC LIMIT 5");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();

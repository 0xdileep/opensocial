import { pool } from './client.js';
import { schemaSql } from './schema.js';
async function main() {
    await pool.query(schemaSql);
    await pool.end();
    console.log('database schema ready');
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});

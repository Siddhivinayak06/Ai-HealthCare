const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runSql() {
    try {
        const client = await pool.connect();
        console.log('Connected to database');

        const sqlPath = path.join(__dirname, 'frontend/scripts/004-create_prescriptions_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running SQL...');
        await client.query(sql);
        console.log('Prescriptions table created successfully');

        client.release();
        await pool.end();
    } catch (error) {
        console.error('Error running SQL:', error);
        process.exit(1);
    }
}

runSql();

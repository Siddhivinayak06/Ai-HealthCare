const db = require('./config/db');

async function addResetColumns() {
    try {
        console.log('Adding reset token columns to users table...');
        await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `);
        console.log('Columns added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error adding columns:', error);
        process.exit(1);
    }
}

addResetColumns();

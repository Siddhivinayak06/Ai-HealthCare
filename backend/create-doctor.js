const db = require('./config/db');
const bcrypt = require('bcryptjs');

const createDoctor = async () => {
    try {
        const check = await db.query("SELECT * FROM users WHERE role = 'doctor'");
        console.log(`Found ${check.rows.length} doctors.`);

        if (check.rows.length === 0) {
            console.log('Creating a test doctor...');
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash('password123', salt);

            const res = await db.query(
                "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *",
                ['Dr. Strange', 'strange@medai.com', hashed, 'doctor']
            );
            console.log('Doctor created:', res.rows[0]);
        } else {
            console.log('Doctors exist:', check.rows);
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createDoctor();

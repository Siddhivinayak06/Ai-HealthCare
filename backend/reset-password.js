const db = require('./config/db');
const bcrypt = require('bcryptjs');

const resetPassword = async () => {
    try {
        const email = 'siddhivinayaksawant04@gmail.com';
        const newPassword = 'password123';

        console.log(`Resetting password for ${email}...`);

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        const res = await db.query(
            "UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING *",
            [hashed, email]
        );

        if (res.rows.length > 0) {
            console.log('Password updated successfully for:', res.rows[0].email);
        } else {
            console.log('User not found!');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();

const axios = require('axios');
const db = require('./config/db');
const bcrypt = require('bcryptjs');

const API_URL = 'http://localhost:5001/api';

async function run() {
    try {
        // 1. Reset patient password
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash('password123', salt);
        await db.query("UPDATE users SET password_hash = $1 WHERE email = $2", [hashed, 'siddhivinayaksawant04@gmail.com']);
        console.log("Password reset for patient.");

        // 2. Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'siddhivinayaksawant04@gmail.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log("Logged in as:", loginRes.data.role);

        // 3. Get Appointments
        const apptRes = await axios.get(`${API_URL}/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Appointments found:", apptRes.data.length);
        console.log(apptRes.data);

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    } finally {
        process.exit();
    }
}

run();

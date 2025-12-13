const db = require('./config/db');

// You might need to hardcode a user email or ID here to test, or pass it as an arg.
// For now, let's list all users and their linked patients.

const debugPatients = async () => {
    try {
        console.log("--- Users ---");
        const users = await db.query("SELECT id, name, email, role FROM users");
        console.table(users.rows);

        console.log("\n--- Patients (Linked to Users) ---");
        const patients = await db.query("SELECT id, user_id, first_name, last_name FROM patients");
        console.table(patients.rows);

        console.log("\n--- Appointments ---");
        const appts = await db.query("SELECT id, user_id, patient_id, title, start_time FROM appointments");
        console.table(appts.rows);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugPatients();

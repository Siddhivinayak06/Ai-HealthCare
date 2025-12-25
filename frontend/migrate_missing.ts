import { db } from "./lib/db";
import { sql } from "drizzle-orm";

async function createMissingTables() {
    try {
        console.log("Creating health_records table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS health_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
        recorded_by UUID REFERENCES users(id),
        record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        weight_kg DECIMAL(5, 2),
        height_cm DECIMAL(5, 2),
        blood_pressure_systolic INTEGER,
        blood_pressure_diastolic INTEGER,
        heart_rate INTEGER,
        temperature_celsius DECIMAL(4, 1),
        oxygen_saturation INTEGER,
        blood_sugar INTEGER,
        cholesterol_total INTEGER,
        cholesterol_hdl INTEGER,
        cholesterol_ldl INTEGER,
        smoking_status TEXT,
        alcohol_consumption TEXT,
        exercise_frequency TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

        console.log("Creating image_analyses table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS image_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        patient_id UUID REFERENCES patients(id),
        scan_type TEXT NOT NULL,
        image_url TEXT,
        diagnosis TEXT,
        confidence DECIMAL(4, 3),
        severity VARCHAR(20),
        findings JSONB,
        recommendations TEXT,
        processing_time DECIMAL(10, 3),
        model_version TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

        console.log("Creating risk_predictions table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS risk_predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        patient_id UUID REFERENCES patients(id) NOT NULL,
        health_record_id UUID REFERENCES health_records(id),
        condition TEXT NOT NULL,
        risk_score DECIMAL(4, 3),
        severity VARCHAR(20),
        contributing_factors TEXT,
        recommendations TEXT,
        model_version TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

        console.log("Creating appointments table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        patient_id UUID REFERENCES patients(id) NOT NULL,
        title TEXT NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled',
        type TEXT DEFAULT 'checkup',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

        console.log("All missing tables created (if they didn't exist).");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

createMissingTables();

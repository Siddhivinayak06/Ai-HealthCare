-- AI Healthcare System Consolidated Schema
-- Matches User Specification from Step 60

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    role VARCHAR(20) DEFAULT 'patient', -- 'doctor' | 'patient'
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender VARCHAR(20),
    medical_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Medical Scans Table
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    scan_type VARCHAR(20) NOT NULL, -- 'xray' | 'ct' | 'mri'
    image_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AI Diagnoses Table
CREATE TABLE IF NOT EXISTS diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    predicted_condition TEXT NOT NULL,
    confidence_score DECIMAL(4, 3),
    risk_level VARCHAR(20), -- 'Low' | 'Moderate' | 'High' | 'Critical'
    explanation JSONB,
    model_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. NLP Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    raw_text TEXT,
    extracted_entities JSONB,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Doctor Feedback Table (Human-in-the-Loop)
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    approved BOOLEAN NOT NULL,
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Model Governance & Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL, -- e.g. 'PREDICTION', 'OVERRIDE', 'MODEL_UPDATE'
    model_version TEXT,
    confidence DECIMAL(4, 3),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_patient_id ON scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_scan_id ON diagnoses(scan_id);
CREATE INDEX IF NOT EXISTS idx_reports_patient_id ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_diagnosis_id ON feedback(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

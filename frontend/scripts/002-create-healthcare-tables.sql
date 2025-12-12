-- Healthcare Diagnostics Database Schema

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(50),
  blood_type VARCHAR(10),
  allergies TEXT[],
  medical_conditions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient health records (vitals, lab results)
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES users(id),
  record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Vitals
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  temperature_celsius DECIMAL(4,2),
  oxygen_saturation INTEGER,
  -- Lab results
  blood_sugar INTEGER,
  cholesterol_total INTEGER,
  cholesterol_hdl INTEGER,
  cholesterol_ldl INTEGER,
  -- Lifestyle
  smoking_status VARCHAR(50),
  alcohol_consumption VARCHAR(50),
  exercise_frequency VARCHAR(50),
  -- Notes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical image analyses
CREATE TABLE IF NOT EXISTS image_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scan_type VARCHAR(100) NOT NULL,
  image_url TEXT,
  diagnosis TEXT,
  confidence INTEGER,
  severity VARCHAR(20),
  findings JSONB,
  recommendations TEXT[],
  processing_time DECIMAL(5,2),
  model_version VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health risk predictions
CREATE TABLE IF NOT EXISTS risk_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  health_record_id UUID REFERENCES health_records(id) ON DELETE SET NULL,
  condition VARCHAR(100) NOT NULL,
  risk_score INTEGER NOT NULL,
  severity VARCHAR(20),
  contributing_factors TEXT[],
  recommendations TEXT[],
  model_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  content JSONB,
  status VARCHAR(20) DEFAULT 'ready',
  file_size VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings/preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_alerts BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  default_scan_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_patient_id ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_image_analyses_user_id ON image_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_image_analyses_patient_id ON image_analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_patient_id ON risk_predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

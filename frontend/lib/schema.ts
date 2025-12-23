import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, decimal, varchar } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name'),
    role: varchar('role', { length: 20 }).default('patient'), // 'doctor' | 'patient'
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    resetPasswordToken: text('reset_password_token'),
    resetPasswordExpires: timestamp('reset_password_expires'),
});

// Patients Table
export const patients = pgTable('patients', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    age: integer('age'),
    gender: varchar('gender', { length: 20 }),
    medicalHistory: jsonb('medical_history'),
    dateOfBirth: timestamp('date_of_birth'),
    email: text('email'),
    phone: varchar('phone', { length: 20 }),
    address: text('address'),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
    bloodType: varchar('blood_type', { length: 10 }),
    allergies: text('allergies'),
    medicalConditions: text('medical_conditions'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Health Records Table
export const healthRecords = pgTable('health_records', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    recordedBy: uuid('recorded_by').references(() => users.id),
    recordDate: timestamp('record_date').defaultNow(),
    weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
    heightCm: decimal('height_cm', { precision: 5, scale: 2 }),
    bloodPressureSystolic: integer('blood_pressure_systolic'),
    bloodPressureDiastolic: integer('blood_pressure_diastolic'),
    heartRate: integer('heart_rate'),
    temperatureCelsius: decimal('temperature_celsius', { precision: 4, scale: 1 }),
    oxygenSaturation: integer('oxygen_saturation'),
    bloodSugar: integer('blood_sugar'),
    cholesterolTotal: integer('cholesterol_total'),
    cholesterolHdl: integer('cholesterol_hdl'),
    cholesterolLdl: integer('cholesterol_ldl'),
    smokingStatus: text('smoking_status'),
    alcoholConsumption: text('alcohol_consumption'),
    exerciseFrequency: text('exercise_frequency'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Reports Table
export const reports = pgTable('reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => patients.id),
    userId: uuid('user_id').references(() => users.id).notNull(), // Link to the user who created it/owns it
    rawText: text('raw_text'),
    extractedEntities: jsonb('extracted_entities'),
    summary: text('summary'),
    title: text('title').notNull(),
    reportType: text('report_type').notNull(),
    content: jsonb('content'),
    fileSize: text('file_size'),
    status: varchar('status', { length: 20 }).default('ready'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Appointments Table
export const appointments = pgTable('appointments', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    title: text('title').notNull(),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    status: varchar('status', { length: 20 }).default('scheduled'),
    type: text('type').default('checkup'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Prescriptions Table
export const prescriptions = pgTable('prescriptions', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    doctorId: uuid('doctor_id').references(() => users.id).notNull(),
    medicationName: text('medication_name').notNull(),
    dosage: text('dosage').notNull(),
    frequency: text('frequency').notNull(),
    duration: text('duration').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Medical Scans Table [Replacing/Complementing Image Analyses]
export const scans = pgTable('scans', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    scanType: varchar('scan_type', { length: 20 }).notNull(), // 'xray' | 'ct' | 'mri'
    imageUrl: text('image_url').notNull(),
    uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// AI Diagnoses Table
export const diagnoses = pgTable('diagnoses', {
    id: uuid('id').defaultRandom().primaryKey(),
    scanId: uuid('scan_id').references(() => scans.id).notNull(),
    predictedCondition: text('predicted_condition').notNull(),
    confidenceScore: decimal('confidence_score', { precision: 4, scale: 3 }),
    riskLevel: varchar('risk_level', { length: 20 }), // 'Low' | 'Moderate' | 'High' | 'Critical'
    explanation: jsonb('explanation'),
    modelVersion: text('model_version'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Image Analyses Table (Legacy, keeping for compatibility during migration if needed)
export const imageAnalyses = pgTable('image_analyses', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    patientId: uuid('patient_id').references(() => patients.id),
    scanType: text('scan_type').notNull(),
    imageUrl: text('image_url'),
    diagnosis: text('diagnosis'),
    confidence: decimal('confidence', { precision: 4, scale: 3 }),
    severity: varchar('severity', { length: 20 }),
    findings: jsonb('findings'),
    recommendations: text('recommendations'),
    processingTime: decimal('processing_time', { precision: 10, scale: 3 }),
    modelVersion: text('model_version'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Risk Predictions Table (Legacy)
export const riskPredictions = pgTable('risk_predictions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    healthRecordId: uuid('health_record_id').references(() => healthRecords.id),
    condition: text('condition').notNull(),
    riskScore: decimal('risk_score', { precision: 4, scale: 3 }),
    severity: varchar('severity', { length: 20 }),
    contributingFactors: text('contributing_factors'),
    recommendations: text('recommendations'),
    modelVersion: text('model_version'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Doctor Feedback Table
export const feedback = pgTable('feedback', {
    id: uuid('id').defaultRandom().primaryKey(),
    diagnosisId: uuid('diagnosis_id').references(() => diagnoses.id).notNull(),
    doctorId: uuid('doctor_id').references(() => users.id).notNull(),
    approved: boolean('approved').notNull(),
    overrideReason: text('override_reason'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Activity Log Table
export const activityLog = pgTable('activity_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    action: text('action').notNull(),
    actionType: varchar('action_type', { length: 50 }),
    details: jsonb('details'),
    createdAt: timestamp('created_at').defaultNow(),
});

// User Settings Table
export const userSettings = pgTable('user_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull().unique(),
    notificationsEnabled: boolean('notifications_enabled').default(true),
    emailAlerts: boolean('email_alerts').default(true),
    darkMode: boolean('dark_mode').default(false),
    language: varchar('language', { length: 10 }).default('en'),
    timezone: varchar('timezone', { length: 50 }).default('UTC'),
    defaultScanType: varchar('default_scan_type', { length: 20 }).default('X-Ray'),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Model Governance & Versions Table
export const modelVersions = pgTable('model_versions', {
    id: uuid('id').defaultRandom().primaryKey(),
    modelName: varchar('model_name', { length: 50 }).notNull(),
    version: varchar('version', { length: 20 }).notNull(),
    description: text('description'),
    accuracy: decimal('accuracy', { precision: 5, scale: 4 }),
    isActive: boolean('is_active').default(true),
    trainingHistory: jsonb('training_history'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Audit Logs Table (AI Accountability)
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    action: text('action').notNull(), // e.g. "PREDICTION", "OVERRIDE", "MODEL_UPDATE"
    modelVersion: text('model_version'),
    confidence: decimal('confidence', { precision: 4, scale: 3 }),
    entityType: varchar('entity_type', { length: 50 }), // e.g. "IMAGE_ANALYSIS", "RISK_PREDICTION"
    entityId: uuid('entity_id'),
    findings: jsonb('findings'),
    doctorOverride: boolean('doctor_override').default(false),
    overrideReason: text('override_reason'),
    feedback: text('feedback'),
    createdAt: timestamp('created_at').defaultNow(),
    timestamp: timestamp('timestamp').defaultNow(),
});

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { InferSelectModel } from 'drizzle-orm';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Export types inferred from schema for component usage
export type Patient = InferSelectModel<typeof schema.patients>;
export type HealthRecord = InferSelectModel<typeof schema.healthRecords>;
export type Report = InferSelectModel<typeof schema.reports>;

export type RiskPrediction = InferSelectModel<typeof schema.riskPredictions>;
export type ActivityLog = InferSelectModel<typeof schema.activityLog>;
export type UserSettings = InferSelectModel<typeof schema.userSettings>;
export type Appointment = InferSelectModel<typeof schema.appointments>;
export type Scan = InferSelectModel<typeof schema.scans>;
export type Diagnosis = InferSelectModel<typeof schema.diagnoses>;
export type Feedback = InferSelectModel<typeof schema.feedback>;
export type AuditLog = InferSelectModel<typeof schema.auditLogs>;

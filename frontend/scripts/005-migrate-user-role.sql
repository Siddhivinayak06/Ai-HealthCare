-- Change default value for future inserts
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'patient';

-- Migrate existing users with 'user' role to 'patient'
UPDATE users SET role = 'patient' WHERE role = 'user';

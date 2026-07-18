ALTER TABLE app.users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(500);
ALTER TABLE app.users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE app.users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(500);
ALTER TABLE app.users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;
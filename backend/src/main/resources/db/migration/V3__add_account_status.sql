DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE account_status AS ENUM ('ACTIVE', 'PENDING_EMAIL');
    END IF;
END $$;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_status account_status;

UPDATE users
SET account_status = CAST('ACTIVE' AS account_status)
WHERE account_status IS NULL;

ALTER TABLE users
ALTER COLUMN account_status SET DEFAULT CAST('ACTIVE' AS account_status);

ALTER TABLE users
ALTER COLUMN account_status SET NOT NULL;

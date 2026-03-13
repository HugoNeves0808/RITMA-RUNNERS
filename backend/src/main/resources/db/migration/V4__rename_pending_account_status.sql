DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'PENDING'
          AND enumtypid = 'account_status'::regtype
    ) THEN
        ALTER TYPE account_status ADD VALUE 'PENDING';
    END IF;
END $$;

UPDATE users
SET account_status = CAST('PENDING' AS account_status)
WHERE account_status::text = 'PENDING_EMAIL';

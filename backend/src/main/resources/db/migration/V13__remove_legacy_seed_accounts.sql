DELETE FROM user_settings
WHERE user_id IN (
    SELECT id
    FROM users
    WHERE lower(email) IN ('admin@ritma.com', 'user@ritma.com')
);

DELETE FROM users
WHERE lower(email) IN ('admin@ritma.com', 'user@ritma.com');

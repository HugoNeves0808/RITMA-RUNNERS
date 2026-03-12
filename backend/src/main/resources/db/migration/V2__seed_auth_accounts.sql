INSERT INTO users (
    id,
    email,
    password_hash,
    role,
    force_password_change
)
SELECT
    gen_random_uuid(),
    'admin@ritma.com',
    crypt('pass1234', gen_salt('bf')),
    CAST('ADMIN' AS user_role),
    false
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE lower(email) = 'admin@ritma.com'
);

INSERT INTO users (
    id,
    email,
    password_hash,
    role,
    force_password_change
)
SELECT
    gen_random_uuid(),
    'user@ritma.com',
    crypt('pass1234', gen_salt('bf')),
    CAST('USER' AS user_role),
    false
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE lower(email) = 'user@ritma.com'
);

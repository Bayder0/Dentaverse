-- Create default owner account
-- Email: admin@dentaverse.com
-- Password: admin123
-- Role: OWNER

INSERT INTO "User" (
    "id",
    "email",
    "name",
    "role",
    "hashedPassword",
    "plainPassword",
    "createdAt",
    "updatedAt"
)
VALUES (
    'clxadmin0000000000000000001',
    'admin@dentaverse.com',
    'Admin',
    'OWNER',
    '$2b$10$B4dNYp13rcTGkkD8yNcHfOemt0v/Y/LZsKRw7OgqjJNxBEWcKMdcG',
    'admin123',
    NOW(),
    NOW()
)
ON CONFLICT ("email") DO NOTHING;


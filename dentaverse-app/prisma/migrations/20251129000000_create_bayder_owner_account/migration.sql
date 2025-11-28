-- Create bayder owner account
-- Email: baydershghl@gmail.com
-- Password: bayder2025
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
  'clx0000000000000000000000001',
  'baydershghl@gmail.com',
  'bayder',
  'OWNER',
  '$2b$10$kFNdObOH5ciw8lSpgRC3weWhnTeA8YnHaNkXcdaeuJV2aZKlqMbqK',
  'bayder2025',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "hashedPassword" = EXCLUDED."hashedPassword",
  "plainPassword" = EXCLUDED."plainPassword",
  "updatedAt" = NOW();


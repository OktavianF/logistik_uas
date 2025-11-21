-- Backfill owner_user_id for existing rows and set to admin user_id = 1
-- Run this AFTER you've applied migration 001_add_owner_columns.sql

-- Assign existing customers to admin
UPDATE CUSTOMERS
SET owner_user_id = 1
WHERE owner_user_id IS NULL;

-- Assign existing couriers to admin
UPDATE COURIERS
SET owner_user_id = 1
WHERE owner_user_id IS NULL;

-- Assign existing shipments to admin
UPDATE SHIPMENTS
SET owner_user_id = 1
WHERE owner_user_id IS NULL;

COMMIT;

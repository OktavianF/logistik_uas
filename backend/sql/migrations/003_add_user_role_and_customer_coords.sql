-- Migration: add role to USERS and latitude/longitude to CUSTOMERS
-- Non-destructive: add new nullable columns with defaults where appropriate

-- Add a role column to USERS (nullable to avoid breaking existing rows)
ALTER TABLE USERS ADD (role VARCHAR2(20));

-- If you want to set a default role for new users in the future, consider
-- adding a default value and a constraint. For now keep it nullable to be safe.

-- Add latitude/longitude for customers to store coordinates (nullable)
ALTER TABLE CUSTOMERS ADD (lat NUMBER(9,6), lng NUMBER(9,6));

-- Add indexes to make geolocation queries efficient (optional)
CREATE INDEX IDX_CUSTOMERS_LAT_LNG ON CUSTOMERS(lat, lng);

COMMIT;

-- Migration: add owner_user_id to domain tables
-- Run this as the schema owner (e.g., LOGISTIK)

ALTER TABLE CUSTOMERS ADD (owner_user_id NUMBER);
ALTER TABLE COURIERS ADD (owner_user_id NUMBER);
ALTER TABLE SHIPMENTS ADD (owner_user_id NUMBER);

-- Optional: add foreign key constraints to USERS
ALTER TABLE CUSTOMERS ADD CONSTRAINT fk_customers_owner FOREIGN KEY (owner_user_id) REFERENCES USERS(user_id);
ALTER TABLE COURIERS ADD CONSTRAINT fk_couriers_owner FOREIGN KEY (owner_user_id) REFERENCES USERS(user_id);
ALTER TABLE SHIPMENTS ADD CONSTRAINT fk_shipments_owner FOREIGN KEY (owner_user_id) REFERENCES USERS(user_id);

-- Add indexes for lookups by owner
CREATE INDEX IDX_CUSTOMERS_OWNER ON CUSTOMERS(owner_user_id);
CREATE INDEX IDX_COURIERS_OWNER ON COURIERS(owner_user_id);
CREATE INDEX IDX_SHIPMENTS_OWNER ON SHIPMENTS(owner_user_id);

COMMIT;

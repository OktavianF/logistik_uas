-- ============================
-- LOGISTIK UAS - CONSOLIDATED SCHEMA (v2)
-- Includes roles, customer coordinates, and shipment requests
-- Run these statements as the schema owner (e.g., LOGISTIK)
-- Review and adapt sequences / connection details before applying
-- ============================

-- DROP (optional cleanup) - comment out in production
DROP TABLE STATUS_LOG CASCADE CONSTRAINTS;
DROP TABLE SHIPMENTS CASCADE CONSTRAINTS;
DROP TABLE COURIERS CASCADE CONSTRAINTS;
DROP TABLE CUSTOMERS CASCADE CONSTRAINTS;
DROP SEQUENCE customers_seq;
DROP SEQUENCE couriers_seq;
DROP SEQUENCE shipments_seq;
DROP SEQUENCE status_log_seq;
DROP FUNCTION fn_estimasi_tiba;
DROP PROCEDURE sp_report_per_courier;
DROP PROCEDURE sp_report_per_region;
COMMIT;

-- ============================
-- Sequences
-- ============================
CREATE SEQUENCE customers_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE admins_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE couriers_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE shipments_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE status_log_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE shipment_requests_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

COMMIT;

-- ============================
-- Tables
-- ============================

-- CUSTOMERS with optional coordinates and authentication fields
CREATE TABLE CUSTOMERS (
  customer_id NUMBER PRIMARY KEY,
  name VARCHAR2(200) NOT NULL,
  address VARCHAR2(400),
  phone VARCHAR2(50),
  email VARCHAR2(255) UNIQUE,
  password_hash VARCHAR2(200),
  lat NUMBER(9,6),
  lng NUMBER(9,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COURIERS (managed by admin)
CREATE TABLE COURIERS (
  courier_id NUMBER PRIMARY KEY,
  name VARCHAR2(200) NOT NULL,
  phone VARCHAR2(50),
  email VARCHAR2(255),
  username VARCHAR2(100),
  password_hash VARCHAR2(200),
  region VARCHAR2(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ADMINS (internal administrators)
CREATE TABLE ADMINS (
  admin_id NUMBER PRIMARY KEY,
  username VARCHAR2(100) UNIQUE NOT NULL,
  display_name VARCHAR2(200),
  email VARCHAR2(255) UNIQUE NOT NULL,
  password_hash VARCHAR2(200) NOT NULL,
  contact VARCHAR2(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SHIPMENTS, store origin/destination as text and optional coordinates
CREATE TABLE SHIPMENTS (
  shipment_id NUMBER PRIMARY KEY,
  tracking_number VARCHAR2(80) UNIQUE NOT NULL,
  customer_id NUMBER NOT NULL,
  courier_id NUMBER,
  created_by_admin_id NUMBER,
  origin VARCHAR2(255) NOT NULL,
  origin_lat NUMBER(9,6),
  origin_lng NUMBER(9,6),
  destination VARCHAR2(255) NOT NULL,
  dest_lat NUMBER(9,6),
  dest_lng NUMBER(9,6),
  distance_km NUMBER(10,2) DEFAULT 0 NOT NULL,
  service_type VARCHAR2(20) CHECK (service_type IN ('Reguler','Express')),
  shipping_date DATE DEFAULT SYSDATE,
  delivery_estimate NUMBER,
  delivery_status VARCHAR2(20) DEFAULT 'Diproses' CHECK (delivery_status IN ('Diproses','Dalam Pengiriman','Terkirim','Dibatalkan')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipments_customer FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id),
  CONSTRAINT fk_shipments_courier FOREIGN KEY (courier_id) REFERENCES COURIERS(courier_id)
);

-- STATUS_LOG
CREATE TABLE STATUS_LOG (
  log_id NUMBER PRIMARY KEY,
  shipment_id NUMBER NOT NULL,
  old_status VARCHAR2(20),
  new_status VARCHAR2(20) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR2(200),
  updated_by_admin_id NUMBER,
  notes VARCHAR2(4000),
  CONSTRAINT fk_status_log_shipment FOREIGN KEY (shipment_id) REFERENCES SHIPMENTS(shipment_id)
);

-- SHIPMENT_REQUESTS (customer-initiated)
CREATE TABLE SHIPMENT_REQUESTS (
  request_id NUMBER PRIMARY KEY,
  customer_id NUMBER NOT NULL,
  pickup_address VARCHAR2(400),
  pickup_lat NUMBER(9,6),
  pickup_lng NUMBER(9,6),
  dropoff_address VARCHAR2(400),
  dropoff_lat NUMBER(9,6),
  dropoff_lng NUMBER(9,6),
  service_type VARCHAR2(20) CHECK (service_type IN ('Reguler','Express')),
  notes VARCHAR2(4000),
  status VARCHAR2(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Accepted','Rejected')),
  processed_by_admin_id NUMBER,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_req_customer FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id)
);

COMMIT;

-- ============================
-- Indexes
-- ============================
CREATE INDEX IDX_SHIPMENT_TRACKING_NUMBER ON SHIPMENTS(tracking_number);
CREATE INDEX IDX_TRACKING_NUMBER ON SHIPMENTS(tracking_number);
CREATE INDEX IDX_COURIER_ID ON SHIPMENTS(courier_id);
CREATE INDEX IDX_SHIPPING_DATE ON SHIPMENTS(shipping_date);
CREATE INDEX IDX_DELIVERY_STATUS ON SHIPMENTS(delivery_status);
CREATE INDEX IDX_SHIPMENT_REQ_CUSTOMER ON SHIPMENT_REQUESTS(customer_id);
CREATE INDEX IDX_ADMINS_EMAIL ON ADMINS(email);
CREATE INDEX IDX_COURIERS_EMAIL ON COURIERS(email);
CREATE INDEX IDX_COURIERS_USERNAME ON COURIERS(username);
CREATE INDEX IDX_SHIPMENTS_CREATED_BY_ADMIN ON SHIPMENTS(created_by_admin_id);
CREATE INDEX IDX_SHIPMENT_REQ_PROCESSED_BY_ADMIN ON SHIPMENT_REQUESTS(processed_by_admin_id);
CREATE INDEX IDX_STATUSLOG_UPDATED_BY_ADMIN ON STATUS_LOG(updated_by_admin_id);

COMMIT;

-- ============================
-- Function: estimate days (reuse)
-- ============================
CREATE OR REPLACE FUNCTION fn_estimasi_tiba(
  distance_km NUMBER,
  service_type VARCHAR2
) RETURN NUMBER IS
  estimasi_hari NUMBER;
  kecepatan NUMBER;
BEGIN
  IF service_type = 'Reguler' THEN
    kecepatan := 40;
  ELSIF service_type = 'Express' THEN
    kecepatan := 60;
  ELSE
    kecepatan := 40;
  END IF;

  estimasi_hari := CEIL(distance_km / (kecepatan * 8));
  IF estimasi_hari < 1 THEN
    estimasi_hari := 1;
  END IF;
  RETURN estimasi_hari;
END;
/ 

-- ============================
-- Stored Procedure: report per courier
-- Returns two SYS_REFCURSORs:
--  - summary: one-row summary for the courier (total shipments, totals, counts by status, avg estimate)
--  - details: list of shipments assigned to the courier in the optional date range
-- Parameters:
--  p_courier_id IN NUMBER (mandatory) - courier id to report on
--  p_start_date IN DATE (optional) - start of shipping_date range (inclusive)
--  p_end_date IN DATE (optional) - end of shipping_date range (inclusive)
--  p_summary OUT SYS_REFCURSOR
--  p_details OUT SYS_REFCURSOR
-- Usage example (SQL*Plus / SQL Developer):
-- VARIABLE rc1 REFCURSOR
-- VARIABLE rc2 REFCURSOR
-- EXEC sp_report_per_courier(1, TO_DATE('2025-01-01','YYYY-MM-DD'), TO_DATE('2025-12-31','YYYY-MM-DD'), :rc1, :rc2);
-- PRINT rc1; PRINT rc2;
-- ============================
CREATE OR REPLACE PROCEDURE sp_report_per_courier(
  p_courier_id IN NUMBER,
  p_start_date IN DATE,
  p_end_date IN DATE,
  p_summary OUT SYS_REFCURSOR,
  p_details OUT SYS_REFCURSOR
) IS
BEGIN
  OPEN p_summary FOR
    SELECT
      c.courier_id,
      c.name AS courier_name,
      COUNT(s.shipment_id) AS total_shipments,
      NVL(SUM(s.distance_km),0) AS total_distance_km,
      SUM(CASE WHEN s.delivery_status = 'Terkirim' THEN 1 ELSE 0 END) AS delivered_count,
      SUM(CASE WHEN s.delivery_status = 'Dalam Pengiriman' THEN 1 ELSE 0 END) AS in_transit_count,
      SUM(CASE WHEN s.delivery_status = 'Diproses' THEN 1 ELSE 0 END) AS pending_count,
      ROUND(NVL(AVG(s.delivery_estimate),0),2) AS avg_estimate_days
    FROM COURIERS c
    LEFT JOIN SHIPMENTS s
      ON c.courier_id = s.courier_id
      AND (p_start_date IS NULL OR s.shipping_date >= p_start_date)
      AND (p_end_date IS NULL OR s.shipping_date <= p_end_date)
    WHERE c.courier_id = p_courier_id
    GROUP BY c.courier_id, c.name;

  OPEN p_details FOR
    SELECT
      s.shipment_id,
      s.tracking_number,
      s.customer_id,
      cu.name AS customer_name,
      s.origin,
      s.destination,
      s.distance_km,
      s.service_type,
      s.shipping_date,
      s.delivery_estimate,
      s.delivery_status,
      s.updated_at
    FROM SHIPMENTS s
    LEFT JOIN CUSTOMERS cu ON s.customer_id = cu.customer_id
    WHERE s.courier_id = p_courier_id
      AND (p_start_date IS NULL OR s.shipping_date >= p_start_date)
      AND (p_end_date IS NULL OR s.shipping_date <= p_end_date)
    ORDER BY s.shipping_date DESC;

EXCEPTION
  WHEN OTHERS THEN
    -- In case of error, raise application error with message
    RAISE_APPLICATION_ERROR(-20001, 'sp_report_per_courier failed: ' || SQLERRM);
END sp_report_per_courier;
/

-- ============================
-- Trigger: auto-update status when courier is assigned
-- Also insert into STATUS_LOG
-- ============================
CREATE OR REPLACE TRIGGER trg_update_shipment_status
AFTER UPDATE OF courier_id ON SHIPMENTS
FOR EACH ROW
WHEN (OLD.courier_id IS NULL AND NEW.courier_id IS NOT NULL)
BEGIN
  UPDATE SHIPMENTS
  SET delivery_status = 'Dalam Pengiriman', updated_at = CURRENT_TIMESTAMP
  WHERE shipment_id = :NEW.shipment_id;

  INSERT INTO STATUS_LOG (log_id, shipment_id, old_status, new_status, updated_at, updated_by, notes)
  VALUES (status_log_seq.NEXTVAL, :NEW.shipment_id, :OLD.delivery_status, 'Dalam Pengiriman', CURRENT_TIMESTAMP, USER, 'Auto: courier assigned');
END;
/

-- ============================
-- Sample seed data (safe defaults). Replace passwords and sensitive data.
-- ============================

-- Example customer (used for authentication in the app). Replace password hash with a real bcrypt hash.
INSERT INTO CUSTOMERS (customer_id, name, address, phone, email, password_hash, lat, lng) 
VALUES (customers_seq.NEXTVAL, 'Customer Demo', 'Jl. Contoh 1', '081200000000', 'customer@example.com', 'REPLACE_WITH_BCRYPT_HASH', NULL, NULL);

COMMIT;

-- ============================
-- End of script
-- ============================

-- ...existing code...
-- Add FK constraints to reference ADMINS (optional, run after ADMINS created)
ALTER TABLE SHIPMENTS
  ADD CONSTRAINT fk_shipments_admin FOREIGN KEY (created_by_admin_id) REFERENCES ADMINS(admin_id);

ALTER TABLE SHIPMENT_REQUESTS
  ADD CONSTRAINT fk_requests_admin FOREIGN KEY (processed_by_admin_id) REFERENCES ADMINS(admin_id);

ALTER TABLE STATUS_LOG
  ADD CONSTRAINT fk_statuslog_admin FOREIGN KEY (updated_by_admin_id) REFERENCES ADMINS(admin_id);
COMMIT;
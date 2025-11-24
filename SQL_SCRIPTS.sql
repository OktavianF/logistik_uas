-- ============================
-- SISTEM MANAJEMEN LOGISTIK & PENGIRIMAN
-- Oracle Database Script
-- ============================

-- ============================
-- 1. DROP EXISTING OBJECTS (Optional - untuk cleanup)
-- ============================

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

-- ============================
-- 2. CREATE SEQUENCES
-- ============================

CREATE SEQUENCE customers_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

CREATE SEQUENCE couriers_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

CREATE SEQUENCE shipments_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

CREATE SEQUENCE status_log_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;


-- ============================
-- 3. CREATE TABLES
-- ============================

-- Table: USERS
CREATE TABLE USERS (
  user_id      NUMBER PRIMARY KEY,
  email        VARCHAR2(255) NOT NULL UNIQUE,
  password_hash VARCHAR2(200) NOT NULL,
  full_name    VARCHAR2(200),
  created_at   TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Table: CUSTOMERS
CREATE TABLE CUSTOMERS (
  customer_id NUMBER PRIMARY KEY,
  name VARCHAR2(100) NOT NULL,
  address VARCHAR2(255) NOT NULL,
  phone VARCHAR2(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: COURIERS
CREATE TABLE COURIERS (
  courier_id NUMBER PRIMARY KEY,
  name VARCHAR2(100) NOT NULL,
  phone VARCHAR2(20) NOT NULL,
  region VARCHAR2(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: SHIPMENTS
CREATE TABLE SHIPMENTS (
  shipment_id NUMBER PRIMARY KEY,
  tracking_number VARCHAR2(50) UNIQUE NOT NULL,
  customer_id NUMBER NOT NULL,
  courier_id NUMBER,
  origin VARCHAR2(100) NOT NULL,
  destination VARCHAR2(100) NOT NULL,
  distance_km NUMBER(10,2) NOT NULL,
  service_type VARCHAR2(20) CHECK (service_type IN ('Reguler', 'Express')),
  shipping_date DATE DEFAULT SYSDATE,
  delivery_estimate NUMBER,
  -- Removed statuses 'Dikirim' and 'Transit'; using 'Dalam Pengiriman' as intermediate state
  delivery_status VARCHAR2(20) DEFAULT 'Diproses' CHECK (delivery_status IN ('Diproses', 'Dalam Pengiriman', 'Terkirim', 'Dibatalkan')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipments_customer FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id),
  CONSTRAINT fk_shipments_courier FOREIGN KEY (courier_id) REFERENCES COURIERS(courier_id)
);

-- Table: STATUS_LOG
CREATE TABLE STATUS_LOG (
  log_id NUMBER PRIMARY KEY,
  shipment_id NUMBER NOT NULL,
  old_status VARCHAR2(20),
  new_status VARCHAR2(20) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR2(100),
  notes VARCHAR2(255),
  CONSTRAINT fk_status_log_shipment FOREIGN KEY (shipment_id) REFERENCES SHIPMENTS(shipment_id)
);

-- ============================
-- 4. CREATE INDEXES
-- ============================

-- Index untuk optimasi query tracking
CREATE INDEX IDX_TRACKING_NUMBER ON SHIPMENTS(tracking_number);

-- Index untuk optimasi query courier
CREATE INDEX IDX_COURIER_ID ON SHIPMENTS(courier_id);

-- Index untuk optimasi query berdasarkan tanggal
CREATE INDEX IDX_SHIPPING_DATE ON SHIPMENTS(shipping_date);

-- Index untuk optimasi query customer
CREATE INDEX IDX_CUSTOMER_ID ON SHIPMENTS(customer_id);

-- Index untuk optimasi query status
CREATE INDEX IDX_DELIVERY_STATUS ON SHIPMENTS(delivery_status);

-- ============================
-- 5. CREATE FUNCTION
-- ============================

-- Function untuk menghitung estimasi waktu tiba
CREATE OR REPLACE FUNCTION fn_estimasi_tiba(
  distance_km NUMBER,
  service_type VARCHAR2
) RETURN NUMBER IS
  estimasi_hari NUMBER;
  kecepatan NUMBER;
BEGIN
  -- Tentukan kecepatan berdasarkan jenis layanan
  IF service_type = 'Reguler' THEN
    kecepatan := 40; -- km per jam
  ELSIF service_type = 'Express' THEN
    kecepatan := 60; -- km per jam
  ELSE
    kecepatan := 40; -- default
  END IF;
  
  -- Hitung estimasi dalam hari (asumsi 8 jam per hari)
  estimasi_hari := CEIL(distance_km / (kecepatan * 8));
  
  -- Minimum 1 hari
  IF estimasi_hari < 1 THEN
    estimasi_hari := 1;
  END IF;
  
  RETURN estimasi_hari;
END;
/

-- Test function
-- SELECT fn_estimasi_tiba(200, 'Express') FROM DUAL;
-- SELECT fn_estimasi_tiba(200, 'Reguler') FROM DUAL;

-- ============================
-- 6. CREATE TRIGGER
-- ============================

-- Trigger untuk auto-update status saat courier ditugaskan
CREATE OR REPLACE TRIGGER trg_update_shipment_status
AFTER UPDATE OF courier_id ON SHIPMENTS
FOR EACH ROW
WHEN (OLD.courier_id IS NULL AND NEW.courier_id IS NOT NULL)
BEGIN
  -- Update status menjadi 'Dalam Pengiriman'
  UPDATE SHIPMENTS
  SET delivery_status = 'Dalam Pengiriman',
      updated_at = CURRENT_TIMESTAMP
  WHERE shipment_id = :NEW.shipment_id;
  
  -- Insert log ke STATUS_LOG
  INSERT INTO STATUS_LOG (
    log_id,
    shipment_id,
    old_status,
    new_status,
    updated_at,
    updated_by,
    notes
  ) VALUES (
    status_log_seq.NEXTVAL,
    :NEW.shipment_id,
    :OLD.delivery_status,
    'Dalam Pengiriman',
    CURRENT_TIMESTAMP,
    USER,
    'Status auto-updated by trigger: Courier assigned'
  );
END;
/

-- ============================
-- 7. CREATE STORED PROCEDURES
-- ============================

-- Procedure untuk laporan pengiriman per kurir
CREATE OR REPLACE PROCEDURE sp_report_per_courier(
  p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
  OPEN p_cursor FOR
    SELECT 
      c.courier_id,
      c.name AS courier_name,
      c.region,
      COUNT(s.shipment_id) AS total_pengiriman,
      COUNT(CASE WHEN s.delivery_status = 'Terkirim' THEN 1 END) AS terkirim,
      COUNT(CASE WHEN s.delivery_status = 'Dalam Pengiriman' THEN 1 END) AS dalam_pengiriman,
      COUNT(CASE WHEN s.delivery_status = 'Diproses' THEN 1 END) AS diproses,
      ROUND(AVG(s.distance_km), 2) AS avg_distance_km
    FROM COURIERS c
    LEFT JOIN SHIPMENTS s ON c.courier_id = s.courier_id
    GROUP BY c.courier_id, c.name, c.region
    ORDER BY total_pengiriman DESC;
END;
/

-- Procedure untuk laporan pengiriman per wilayah
CREATE OR REPLACE PROCEDURE sp_report_per_region(
  p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
  OPEN p_cursor FOR
    SELECT 
      c.region,
      COUNT(DISTINCT c.courier_id) AS total_courier,
      COUNT(s.shipment_id) AS total_pengiriman,
      COUNT(CASE WHEN s.delivery_status = 'Terkirim' THEN 1 END) AS terkirim,
      COUNT(CASE WHEN s.delivery_status = 'Dalam Pengiriman' THEN 1 END) AS dalam_pengiriman,
      COUNT(CASE WHEN s.delivery_status = 'Diproses' THEN 1 END) AS diproses,
      ROUND(AVG(s.distance_km), 2) AS avg_distance_km,
      ROUND(AVG(s.delivery_estimate), 2) AS avg_delivery_days
    FROM COURIERS c
    LEFT JOIN SHIPMENTS s ON c.courier_id = s.courier_id
    GROUP BY c.region
    ORDER BY total_pengiriman DESC;
END;
/

-- Materialized view removed: dashboard uses direct queries joining SHIPMENTS, CUSTOMERS, and COURIERS.

-- ============================
-- 9. SEED DATA (Sample Data)
-- ============================

-- Insert sample customers
INSERT INTO CUSTOMERS (customer_id, name, address, phone)
VALUES (customers_seq.NEXTVAL, 'PT. Maju Jaya', 'Jl. Sudirman No. 123, Jakarta Pusat', '021-12345678');

INSERT INTO CUSTOMERS (customer_id, name, address, phone)
VALUES (customers_seq.NEXTVAL, 'CV. Berkah Sentosa', 'Jl. Asia Afrika No. 45, Bandung', '022-87654321');

INSERT INTO CUSTOMERS (customer_id, name, address, phone)
VALUES (customers_seq.NEXTVAL, 'UD. Cahaya Mandiri', 'Jl. Pemuda No. 78, Surabaya', '031-55667788');

INSERT INTO CUSTOMERS (customer_id, name, address, phone)
VALUES (customers_seq.NEXTVAL, 'PT. Global Makmur', 'Jl. Gatot Subroto No. 90, Jakarta Selatan', '021-99887766');

INSERT INTO CUSTOMERS (customer_id, name, address, phone)
VALUES (customers_seq.NEXTVAL, 'CV. Jaya Abadi', 'Jl. Diponegoro No. 34, Semarang', '024-33221100');

-- Insert sample couriers
INSERT INTO COURIERS (courier_id, name, phone, region)
VALUES (couriers_seq.NEXTVAL, 'Ahmad Rizki', '0812-3456-7890', 'Jakarta Selatan');

INSERT INTO COURIERS (courier_id, name, phone, region)
VALUES (couriers_seq.NEXTVAL, 'Budi Santoso', '0813-8765-4321', 'Bandung');

INSERT INTO COURIERS (courier_id, name, phone, region)
VALUES (couriers_seq.NEXTVAL, 'Citra Dewi', '0814-5566-7788', 'Surabaya');

INSERT INTO COURIERS (courier_id, name, phone, region)
VALUES (couriers_seq.NEXTVAL, 'Dedi Kurniawan', '0815-2233-4455', 'Jakarta Pusat');

INSERT INTO COURIERS (courier_id, name, phone, region)
VALUES (couriers_seq.NEXTVAL, 'Eka Pratama', '0816-6677-8899', 'Semarang');

-- Insert sample shipments (menggunakan function untuk estimasi)
INSERT INTO SHIPMENTS (
  shipment_id, tracking_number, customer_id, courier_id, 
  origin, destination, distance_km, service_type, delivery_estimate, delivery_status
) VALUES (
  shipments_seq.NEXTVAL,
  'TRK' || TO_CHAR(SYSDATE, 'YYYYMMDD') || LPAD(shipments_seq.CURRVAL, 6, '0'),
  1,
  1,
  'Jakarta Pusat',
  'Jakarta Selatan',
  25,
  'Express',
   fn_estimasi_tiba(25, 'Express'),
   'Dalam Pengiriman'
);

INSERT INTO SHIPMENTS (
  shipment_id, tracking_number, customer_id, courier_id,
  origin, destination, distance_km, service_type, delivery_estimate, delivery_status
) VALUES (
  shipments_seq.NEXTVAL,
  'TRK' || TO_CHAR(SYSDATE, 'YYYYMMDD') || LPAD(shipments_seq.CURRVAL, 6, '0'),
  2,
  2,
  'Jakarta',
  'Bandung',
  150,
  'Reguler',
  fn_estimasi_tiba(150, 'Reguler'),
   'Dalam Pengiriman'
);

INSERT INTO SHIPMENTS (
  shipment_id, tracking_number, customer_id, courier_id,
  origin, destination, distance_km, service_type, delivery_estimate, delivery_status
) VALUES (
  shipments_seq.NEXTVAL,
  'TRK' || TO_CHAR(SYSDATE, 'YYYYMMDD') || LPAD(shipments_seq.CURRVAL, 6, '0'),
  3,
  3,
  'Jakarta',
  'Surabaya',
  800,
  'Express',
  fn_estimasi_tiba(800, 'Express'),
  'Terkirim'
);

INSERT INTO SHIPMENTS (
  shipment_id, tracking_number, customer_id, courier_id,
  origin, destination, distance_km, service_type, delivery_estimate, delivery_status
) VALUES (
  shipments_seq.NEXTVAL,
  'TRK' || TO_CHAR(SYSDATE, 'YYYYMMDD') || LPAD(shipments_seq.CURRVAL, 6, '0'),
  4,
  NULL,
  'Jakarta Selatan',
  'Tangerang',
  35,
  'Reguler',
  fn_estimasi_tiba(35, 'Reguler'),
  'Diproses'
);

INSERT INTO SHIPMENTS (
  shipment_id, tracking_number, customer_id, courier_id,
  origin, destination, distance_km, service_type, delivery_estimate, delivery_status
) VALUES (
  shipments_seq.NEXTVAL,
  'TRK' || TO_CHAR(SYSDATE, 'YYYYMMDD') || LPAD(shipments_seq.CURRVAL, 6, '0'),
  5,
  5,
  'Jakarta',
  'Semarang',
  450,
  'Express',
  fn_estimasi_tiba(450, 'Express'),
   'Dalam Pengiriman'
);

-- Commit data
COMMIT;

-- FROM SHIPMENTS s
-- LEFT JOIN CUSTOMERS c ON s.customer_id = c.customer_id
-- LEFT JOIN COURIERS co ON s.courier_id = co.courier_id
-- ORDER BY s.updated_at DESC;

-- Test procedure: Report per courier
DECLARE
  v_cursor SYS_REFCURSOR;
  v_courier_id NUMBER;
  v_courier_name VARCHAR2(100);
  v_region VARCHAR2(100);
  v_total NUMBER;
  v_terkirim NUMBER;
  v_dalam_pengiriman NUMBER;
  v_diproses NUMBER;
  v_avg_distance NUMBER;
BEGIN
  sp_report_per_courier(v_cursor);
  LOOP
    FETCH v_cursor INTO v_courier_id, v_courier_name, v_region, v_total, v_terkirim, v_dalam_pengiriman, v_diproses, v_avg_distance;
    EXIT WHEN v_cursor%NOTFOUND;
    DBMS_OUTPUT.PUT_LINE('Courier: ' || v_courier_name || ' | Region: ' || v_region || ' | Total: ' || v_total);
  END LOOP;
  CLOSE v_cursor;
END;
/

-- Test procedure: Report per region
DECLARE
  v_cursor SYS_REFCURSOR;
  v_region VARCHAR2(100);
  v_total_courier NUMBER;
  v_total_pengiriman NUMBER;
  v_terkirim NUMBER;
  v_dalam_pengiriman NUMBER;
  v_diproses NUMBER;
  v_avg_distance NUMBER;
  v_avg_days NUMBER;
BEGIN
  sp_report_per_region(v_cursor);
  LOOP
    FETCH v_cursor INTO v_region, v_total_courier, v_total_pengiriman, v_terkirim, v_dalam_pengiriman, v_diproses, v_avg_distance, v_avg_days;
    EXIT WHEN v_cursor%NOTFOUND;
    DBMS_OUTPUT.PUT_LINE('Region: ' || v_region || ' | Couriers: ' || v_total_courier || ' | Total: ' || v_total_pengiriman);
  END LOOP;
  CLOSE v_cursor;
END;
/

-- Test trigger (assign courier ke shipment yang belum ada courier)
-- UPDATE SHIPMENTS SET courier_id = 4 WHERE shipment_id = 4;
-- SELECT * FROM STATUS_LOG ORDER BY updated_at DESC;

-- ============================
-- 12. EXECUTION PLAN EXAMPLES
-- ============================

-- Analyze query performance
EXPLAIN PLAN FOR
SELECT * FROM SHIPMENTS WHERE tracking_number = 'TRK20250110000001';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Check index usage
EXPLAIN PLAN FOR
SELECT * FROM SHIPMENTS WHERE courier_id = 1;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- ============================
-- END OF SCRIPT
-- ============================

-- Verify all objects created
SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_name IN (
  'CUSTOMERS', 'COURIERS', 'SHIPMENTS', 'STATUS_LOG',
  'FN_ESTIMASI_TIBA', 'SP_REPORT_PER_COURIER', 'SP_REPORT_PER_REGION',
  -- materialized view removed: 'VW_SHIPMENT_STATUS',
  'IDX_TRACKING_NUMBER', 'IDX_COURIER_ID', 'IDX_SHIPPING_DATE'
)
ORDER BY object_type, object_name;

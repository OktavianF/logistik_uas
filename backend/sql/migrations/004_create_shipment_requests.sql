-- Migration: create SHIPMENT_REQUESTS table for customer-initiated requests
CREATE TABLE SHIPMENT_REQUESTS (
  request_id NUMBER PRIMARY KEY,
  customer_id NUMBER NOT NULL,
  pickup_address VARCHAR2(255),
  pickup_lat NUMBER(9,6),
  pickup_lng NUMBER(9,6),
  dropoff_address VARCHAR2(255),
  dropoff_lat NUMBER(9,6),
  dropoff_lng NUMBER(9,6),
  service_type VARCHAR2(20) CHECK (service_type IN ('Reguler','Express')),
  notes VARCHAR2(4000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_by_user_id NUMBER,
  processed_at TIMESTAMP,
  status VARCHAR2(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Accepted','Rejected'))
);

-- Foreign keys
ALTER TABLE SHIPMENT_REQUESTS ADD CONSTRAINT fk_req_customer FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id);

COMMIT;

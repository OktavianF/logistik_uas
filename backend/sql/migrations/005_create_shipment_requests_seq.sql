-- Migration: create sequence for SHIPMENT_REQUESTS.request_id
CREATE SEQUENCE shipment_requests_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

COMMIT;

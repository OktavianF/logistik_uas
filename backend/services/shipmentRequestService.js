const database = require('../config/database');
const oracledb = require('oracledb');
const shipmentService = require('./shipmentService');

exports.createRequest = async ({ customer_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, service_type, notes }) => {
  const pool = database.getPool();
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(
      `INSERT INTO SHIPMENT_REQUESTS (request_id, customer_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, service_type, notes)
       VALUES (shipment_requests_seq.NEXTVAL, :customer_id, :pickup_address, :pickup_lat, :pickup_lng, :dropoff_address, :dropoff_lat, :dropoff_lng, :service_type, :notes)
       RETURNING request_id INTO :id`,
      {
        customer_id,
        pickup_address,
        pickup_lat: pickup_lat || null,
        pickup_lng: pickup_lng || null,
        dropoff_address,
        dropoff_lat: dropoff_lat || null,
        dropoff_lng: dropoff_lng || null,
        service_type,
        notes: notes || null,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );

    return { request_id: result.outBinds.id[0] };
  } finally {
    await conn.close();
  }
};

// Fetch requests: if user is admin, caller should pass role='admin' and userId ignored.
exports.getRequestsForUser = async (userId, role) => {
  const pool = database.getPool();
  const conn = await pool.getConnection();
  try {
    if (role && role.toLowerCase() === 'admin') {
      const res = await conn.execute(`SELECT * FROM SHIPMENT_REQUESTS ORDER BY created_at DESC`);
      return res.rows;
    }
    // For customer: userId is the customer_id (set in JWT as user_id)
    if (!userId) return [];
    const res = await conn.execute(`SELECT * FROM SHIPMENT_REQUESTS WHERE customer_id = :1 ORDER BY created_at DESC`, [userId]);
    return res.rows;
  } finally {
    await conn.close();
  }
};

exports.getRequestById = async (requestId) => {
  const pool = database.getPool();
  const conn = await pool.getConnection();
  try {
    const res = await conn.execute(`SELECT * FROM SHIPMENT_REQUESTS WHERE request_id = :1`, [requestId]);
    return res.rows && res.rows[0] ? res.rows[0] : null;
  } finally {
    await conn.close();
  }
};

// Accept a request: create shipment and mark request processed
exports.acceptRequest = async (requestId, adminUserId) => {
  const pool = database.getPool();
  const conn = await pool.getConnection();
  try {
    // Get the request
    const reqRes = await conn.execute(`SELECT * FROM SHIPMENT_REQUESTS WHERE request_id = :1`, [requestId]);
    if (!reqRes.rows || reqRes.rows.length === 0) throw new Error('Request not found');
    const r = reqRes.rows[0];

    const customer_id = r.CUSTOMER_ID || r[1];
    const dropoff_address = r.DROPOFF_ADDRESS || r[6] || null;
    const service_type = r.SERVICE_TYPE || 'Reguler';

    // Use shipmentService to create shipment. Origin fixed to Lamongan per requirements.
    // Create shipment: record admin FK in created_by_admin_id
    const shipment = await shipmentService.createShipment({
      customer_id,
      origin: 'Lamongan',
      destination: dropoff_address || 'Unknown',
      distance_km: 0,
      service_type,
      created_by_admin_id: adminUserId
    });

    // Mark request as accepted and record admin who processed it
    await conn.execute(
      `UPDATE SHIPMENT_REQUESTS SET status = 'Accepted', processed_by_admin_id = :admin, processed_at = SYSDATE WHERE request_id = :id`,
      { admin: adminUserId, id: requestId },
      { autoCommit: true }
    );

    return { shipment, request_id: requestId };
  } finally {
    await conn.close();
  }
};

exports.rejectRequest = async (requestId, adminUserId, reason) => {
  const pool = database.getPool();
  const conn = await pool.getConnection();
  try {
    await conn.execute(
      `UPDATE SHIPMENT_REQUESTS SET status = 'Rejected', processed_by_admin_id = :admin, processed_at = SYSDATE, notes = NVL(notes, '') || '\n[REJECTED] ' || :reason WHERE request_id = :id`,
      { admin: adminUserId, reason: reason || 'Rejected by admin', id: requestId },
      { autoCommit: true }
    );

    return { request_id: requestId };
  } finally {
    await conn.close();
  }
};

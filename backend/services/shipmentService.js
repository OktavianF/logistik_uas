const database = require("../config/database");
const oracledb = require("oracledb");

exports.getAllShipments = async () => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT s.shipment_id, s.tracking_number, s.customer_id, s.courier_id,
              s.origin, s.destination, s.distance_km, s.service_type,
              s.shipping_date, s.delivery_estimate, s.delivery_status,
              c.name as customer_name,
              co.name as courier_name
       FROM SHIPMENTS s
       LEFT JOIN CUSTOMERS c ON s.customer_id = c.customer_id
       LEFT JOIN COURIERS co ON s.courier_id = co.courier_id
       ORDER BY s.shipping_date DESC`
    );
    return result.rows;
  } finally {
    await connection.close();
  }
};

exports.getShipmentByTracking = async (trackingNumber) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT s.shipment_id, s.tracking_number, s.customer_id, s.courier_id,
              s.origin, s.destination, s.distance_km, s.service_type,
              s.shipping_date, s.delivery_estimate, s.delivery_status,
              c.name as customer_name, c.address as customer_address, c.phone as customer_phone,
              co.name as courier_name, co.phone as courier_phone, co.region as courier_region
       FROM SHIPMENTS s
       LEFT JOIN CUSTOMERS c ON s.customer_id = c.customer_id
       LEFT JOIN COURIERS co ON s.courier_id = co.courier_id
       WHERE s.tracking_number = :tracking`,
      [trackingNumber]
    );
    
    if (result.rows.length === 0) {
      return null;
    }

    // Get status history
    const historyResult = await connection.execute(
      `SELECT log_id, old_status, new_status, updated_at, updated_by
       FROM STATUS_LOG
       WHERE shipment_id = :id
       ORDER BY updated_at DESC`,
      [result.rows[0].SHIPMENT_ID]
    );

    return {
      ...result.rows[0],
      status_history: historyResult.rows
    };
  } finally {
    await connection.close();
  }
};

exports.createShipment = async ({ customer_id, origin, destination, distance_km, service_type }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    // Generate tracking number
    const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const result = await connection.execute(
      `INSERT INTO SHIPMENTS 
       (shipment_id, tracking_number, customer_id, origin, destination, 
        distance_km, service_type, shipping_date, delivery_estimate, delivery_status)
       VALUES 
       (shipments_seq.NEXTVAL, :tracking, :customer_id, :origin, :destination,
        :distance_km, :service_type, SYSDATE, 
        SYSDATE + fn_estimasi_tiba(:distance_km, :service_type), 'Diproses')
       RETURNING shipment_id INTO :id`,
      {
        tracking: trackingNumber,
        customer_id,
        origin,
        destination,
        distance_km,
        service_type,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );
    
    return {
      shipment_id: result.outBinds.id[0],
      tracking_number: trackingNumber,
      customer_id,
      origin,
      destination,
      distance_km,
      service_type,
      delivery_status: 'Diproses'
    };
  } finally {
    await connection.close();
  }
};

exports.assignCourier = async (shipmentId, courierId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    // Update akan trigger otomatis untuk ubah status dan log
    const result = await connection.execute(
      `UPDATE SHIPMENTS 
       SET courier_id = :courier_id
       WHERE shipment_id = :id`,
      { id: shipmentId, courier_id: courierId },
      { autoCommit: true }
    );
    
    if (result.rowsAffected === 0) {
      throw new Error("Shipment not found");
    }

    // Get updated shipment
    const updatedResult = await connection.execute(
      `SELECT shipment_id, tracking_number, customer_id, courier_id, delivery_status
       FROM SHIPMENTS
       WHERE shipment_id = :id`,
      [shipmentId]
    );
    
    return updatedResult.rows[0];
  } finally {
    await connection.close();
  }
};

exports.getDashboardStatus = async () => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    // Query recent shipments directly from tables (avoid materialized view)
    const result = await connection.execute(
      `SELECT s.tracking_number,
              c.name AS customer_name,
              co.name AS courier_name,
              s.delivery_status,
              s.updated_at AS last_update
       FROM SHIPMENTS s
       LEFT JOIN CUSTOMERS c ON s.customer_id = c.customer_id
       LEFT JOIN COURIERS co ON s.courier_id = co.courier_id
       ORDER BY s.updated_at DESC NULLS LAST
       FETCH FIRST 5 ROWS ONLY`
    );

    // Normalize rows: oracledb returns array of rows; keep as-is for controller to map
    return result.rows;
  } finally {
    await connection.close();
  }
};

exports.getDashboardMetrics = async () => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    // Run multiple lightweight queries to gather metrics
    const totalRes = await connection.execute(`SELECT COUNT(*) AS TOTAL_SHIPMENTS FROM SHIPMENTS`);
    const couriersRes = await connection.execute(`SELECT COUNT(DISTINCT courier_id) AS ACTIVE_COURIERS FROM SHIPMENTS WHERE courier_id IS NOT NULL`);
    const customersRes = await connection.execute(`SELECT COUNT(*) AS TOTAL_CUSTOMERS FROM CUSTOMERS`);
    const regionsRes = await connection.execute(`SELECT COUNT(DISTINCT region) AS TOTAL_REGIONS FROM COURIERS`);

    const getFirstNumber = (row) => {
      if (!row) return 0;
      const firstKey = Object.keys(row)[0];
      return Number(row[firstKey]) || 0;
    };

    const metrics = {
      totalShipments: getFirstNumber(totalRes.rows[0]),
      activeCouriers: getFirstNumber(couriersRes.rows[0]),
      totalCustomers: getFirstNumber(customersRes.rows[0]),
      totalRegions: getFirstNumber(regionsRes.rows[0])
    };

    return metrics;
  } finally {
    await connection.close();
  }
};

const database = require("../config/database");
const oracledb = require("oracledb");

exports.getReportPerCourier = async (courierId, startDate, endDate) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    // Bind parameters for the stored procedure
    const binds = {
      p_courier_id: { val: courierId, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
      p_start_date: { val: startDate || null, dir: oracledb.BIND_IN, type: oracledb.DATE },
      p_end_date: { val: endDate || null, dir: oracledb.BIND_IN, type: oracledb.DATE },
      p_summary: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
      p_details: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
    };

    const result = await connection.execute(
      `BEGIN
         sp_report_per_courier(:p_courier_id, :p_start_date, :p_end_date, :p_summary, :p_details);
       END;`,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Read summary cursor
    const summaryRs = result.outBinds.p_summary;
    const summaryRows = await summaryRs.getRows();
    await summaryRs.close();

    // Read details cursor (may be many rows; use getRows with a reasonable limit or fetch all)
    const detailsRs = result.outBinds.p_details;
    const detailsRows = await detailsRs.getRows();
    await detailsRs.close();

    return {
      summary: summaryRows,
      details: detailsRows
    };
  } finally {
    await connection.close();
  }
};

exports.getReportPerRegion = async () => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `BEGIN
         sp_report_per_region(:cursor);
       END;`,
      {
        cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
      }
    );

    const resultSet = result.outBinds.cursor;
    const rows = await resultSet.getRows();
    await resultSet.close();
    
    return rows;
  } finally {
    await connection.close();
  }
};

exports.getPerformanceAnalysis = async () => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    // Query dengan index
    await connection.execute(
      `EXPLAIN PLAN FOR
       SELECT * FROM SHIPMENTS WHERE tracking_number = 'TRK123456'`
    );

    const planResult = await connection.execute(
      `SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY())`
    );

    return {
      query: "SELECT * FROM SHIPMENTS WHERE tracking_number = 'TRK123456'",
      execution_plan: planResult.rows,
      indexes_used: [
        "IDX_TRACKING_NUMBER on SHIPMENTS(tracking_number)",
        "IDX_COURIER_ID on SHIPMENTS(courier_id)",
        "IDX_SHIPPING_DATE on SHIPMENTS(shipping_date)"
      ],
      performance_notes: [
        "Index IDX_TRACKING_NUMBER provides O(log n) lookup for tracking numbers",
        "Index IDX_COURIER_ID speeds up courier assignment queries",
        "Index IDX_SHIPPING_DATE optimizes date range queries"
      ]
    };
  } finally {
    await connection.close();
  }
};

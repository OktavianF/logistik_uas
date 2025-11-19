const database = require('../config/database');

exports.getShipmentsCount = async (req, res) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute(`SELECT COUNT(*) AS CNT FROM SHIPMENTS`);
    const row = result.rows && result.rows[0];
    const count = row ? Number(Object.values(row)[0]) : 0;
    res.json({ success: true, data: { shipmentsCount: count } });
  } catch (err) {
    console.error('Debug getShipmentsCount error:', err);
    res.status(500).json({ success: false, error: String(err) });
  } finally {
    try { await connection.close(); } catch (e) {}
  }
};

exports.ping = (req, res) => {
  res.json({ success: true, message: 'pong' });
};

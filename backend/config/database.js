const oracledb = require("oracledb");
require("dotenv").config();

// Set output format to object
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Uncomment and set this if you need to specify Oracle Instant Client path
oracledb.initOracleClient({ libDir: '/opt/oracle/instantclient_23_3' });

let pool;

async function initialize() {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      poolMin: parseInt(process.env.POOL_MIN) || 2,
      poolMax: parseInt(process.env.POOL_MAX) || 10,
      poolIncrement: parseInt(process.env.POOL_INCREMENT) || 1,
      poolTimeout: 60
    });
    console.log("✅ Oracle Connection Pool created successfully");
  } catch (err) {
    console.error("❌ Error creating connection pool:", err);
    throw err;
  }
}

async function close() {
  try {
    if (pool) {
      await pool.close(10);
      console.log("🔌 Connection pool closed");
    }
  } catch (err) {
    console.error("Error closing connection pool:", err);
    throw err;
  }
}

function getPool() {
  if (!pool) {
    throw new Error("Connection pool not initialized. Call initialize() first.");
  }
  return pool;
}

module.exports = {
  initialize,
  close,
  getPool
};

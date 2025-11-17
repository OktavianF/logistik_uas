const database = require("../config/database");
const oracledb = require("oracledb");

exports.getAllCouriers = async () => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT courier_id, name, phone, region 
       FROM COURIERS 
       ORDER BY courier_id`
    );
    return result.rows;
  } finally {
    await connection.close();
  }
};

exports.getCourierById = async (courierId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT courier_id, name, phone, region 
       FROM COURIERS 
       WHERE courier_id = :id`,
      [courierId]
    );
    
    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
};

exports.createCourier = async ({ name, phone, region }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `INSERT INTO COURIERS (courier_id, name, phone, region) 
       VALUES (couriers_seq.NEXTVAL, :name, :phone, :region)
       RETURNING courier_id INTO :id`,
      {
        name,
        phone,
        region,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );
    
    return { 
      courier_id: result.outBinds.id[0], 
      name, 
      phone, 
      region 
    };
  } finally {
    await connection.close();
  }
};

exports.updateCourier = async (courierId, { name, phone, region }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `UPDATE COURIERS 
       SET name = :name, phone = :phone, region = :region
       WHERE courier_id = :id`,
      { id: courierId, name, phone, region },
      { autoCommit: true }
    );
    
    if (result.rowsAffected === 0) {
      throw new Error("Courier not found");
    }
    
    return { courier_id: courierId, name, phone, region };
  } finally {
    await connection.close();
  }
};

exports.deleteCourier = async (courierId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `DELETE FROM COURIERS WHERE courier_id = :id`,
      [courierId],
      { autoCommit: true }
    );
    
    if (result.rowsAffected === 0) {
      throw new Error("Courier not found");
    }
  } finally {
    await connection.close();
  }
};

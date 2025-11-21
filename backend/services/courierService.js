const database = require("../config/database");
const oracledb = require("oracledb");

exports.getAllCouriers = async (userId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    let result;
    if (userId) {
      result = await connection.execute(
        `SELECT courier_id, name, phone, region, owner_user_id
         FROM COURIERS
         WHERE owner_user_id = :1
         ORDER BY courier_id`,
        [userId]
      );
    } else {
      // return only shared couriers (no owner)
      result = await connection.execute(
        `SELECT courier_id, name, phone, region, owner_user_id
         FROM COURIERS
         WHERE owner_user_id IS NULL
         ORDER BY courier_id`
      );
    }

    return result.rows;
  } finally {
    await connection.close();
  }
};

exports.getCourierById = async (courierId, userId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    let result;
    if (userId) {
      result = await connection.execute(
        `SELECT courier_id, name, phone, region, owner_user_id
         FROM COURIERS
         WHERE courier_id = :1 AND owner_user_id = :2`,
        [courierId, userId]
      );
    } else {
      result = await connection.execute(
        `SELECT courier_id, name, phone, region, owner_user_id
         FROM COURIERS
         WHERE courier_id = :1 AND owner_user_id IS NULL`,
        [courierId]
      );
    }

    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
};

exports.createCourier = async ({ name, phone, region, owner_user_id = null }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `INSERT INTO COURIERS (courier_id, name, phone, region, owner_user_id) 
       VALUES (couriers_seq.NEXTVAL, :name, :phone, :region, :owner)
       RETURNING courier_id INTO :id`,
      {
        name,
        phone,
        region,
        owner: owner_user_id,
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

exports.updateCourier = async (courierId, { name, phone, region }, userId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `UPDATE COURIERS
       SET name = :1, phone = :2, region = :3
       WHERE courier_id = :4 AND owner_user_id = :5`,
      [name, phone, region, courierId, userId],
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

exports.deleteCourier = async (courierId, userId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `DELETE FROM COURIERS WHERE courier_id = :1 AND owner_user_id = :2`,
      [courierId, userId],
      { autoCommit: true }
    );
    
    if (result.rowsAffected === 0) {
      throw new Error("Courier not found");
    }
  } finally {
    await connection.close();
  }
};

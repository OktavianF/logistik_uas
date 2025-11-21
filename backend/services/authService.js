const database = require("../config/database");
const oracledb = require("oracledb");

exports.getUserByEmail = async (email) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute(
      `SELECT user_id, email, password_hash, full_name, created_at
       FROM USERS
       WHERE email = :email`,
      [email]
    );

    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
};

exports.createUser = async ({ email, passwordHash, fullName }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute(
      `INSERT INTO USERS (user_id, email, password_hash, full_name, created_at)
       VALUES (users_seq.NEXTVAL, :email, :password_hash, :full_name, SYSTIMESTAMP)
       RETURNING user_id INTO :id`,
      {
        email,
        password_hash: passwordHash,
        full_name: fullName,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );

    return {
      user_id: result.outBinds.id[0],
      email,
      full_name: fullName
    };
  } finally {
    await connection.close();
  }
};

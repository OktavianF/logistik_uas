const database = require("../config/database");
const oracledb = require("oracledb");

exports.getAllCustomers = async (userId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    let result;
    if (userId) {
      // use positional bind to avoid any named-bind parsing issues
      result = await connection.execute(
        `SELECT customer_id, name, address, phone, owner_user_id
         FROM CUSTOMERS
         WHERE owner_user_id = :1
         ORDER BY customer_id`,
        [userId]
      );
    } else {
      // If no userId provided, return only shared rows (owner_user_id IS NULL)
      result = await connection.execute(
        `SELECT customer_id, name, address, phone, owner_user_id
         FROM CUSTOMERS
         WHERE owner_user_id IS NULL
         ORDER BY customer_id`
      );
    }

    return result.rows;
  } finally {
    await connection.close();
  }
};

exports.getCustomerById = async (customerId, userId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    let result;
    if (userId) {
      result = await connection.execute(
        `SELECT customer_id, name, address, phone, owner_user_id
         FROM CUSTOMERS
         WHERE customer_id = :1 AND owner_user_id = :2`,
        [customerId, userId]
      );
    } else {
      result = await connection.execute(
        `SELECT customer_id, name, address, phone, owner_user_id
         FROM CUSTOMERS
         WHERE customer_id = :1 AND owner_user_id IS NULL`,
        [customerId]
      );
    }

    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
};

exports.createCustomer = async ({ name, address, phone, owner_user_id = null }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    const result = await connection.execute(
      `INSERT INTO CUSTOMERS (customer_id, name, address, phone, owner_user_id)
       VALUES (customers_seq.NEXTVAL, :name, :address, :phone, :owner)
       RETURNING customer_id INTO :id`,
      {
        name,
        address,
        phone,
        owner: owner_user_id,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );

    return {
      customer_id: result.outBinds.id[0],
      name,
      address,
      phone,
      owner_user_id
    };
  } finally {
    await connection.close();
  }
};

exports.updateCustomer = async (customerId, { name, address, phone }, userId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    const result = await connection.execute(
      `UPDATE CUSTOMERS
       SET name = :1, address = :2, phone = :3, updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = :4 AND owner_user_id = :5`,
      [name, address, phone, customerId, userId],
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      throw new Error("Customer not found or not authorized");
    }

    return { customer_id: customerId, name, address, phone };
  } finally {
    await connection.close();
  }
};

exports.deleteCustomer = async (customerId, userId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    const result = await connection.execute(
      `DELETE FROM CUSTOMERS WHERE customer_id = :1 AND owner_user_id = :2`,
      [customerId, userId],
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      throw new Error("Customer not found or not authorized");
    }
  } finally {
    await connection.close();
  }
};

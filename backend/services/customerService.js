const database = require("../config/database");
const oracledb = require("oracledb");

exports.getAllCustomers = async (userId, role) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    // If caller is admin, return all customers
    let result;
    if (role && role.toLowerCase() === 'admin') {
      result = await connection.execute(
        `SELECT customer_id, name, address, phone
         FROM CUSTOMERS
         ORDER BY customer_id`
      );
    } else if (userId) {
      // for a customer, return only their own record
      result = await connection.execute(
        `SELECT customer_id, name, address, phone
         FROM CUSTOMERS
         WHERE customer_id = :1`,
        [userId]
      );
    } else {
      result = await connection.execute(
        `SELECT customer_id, name, address, phone
         FROM CUSTOMERS
         ORDER BY customer_id`
      );
    }

    return result.rows;
  } finally {
    await connection.close();
  }
};

exports.getCustomerById = async (customerId, userId, role) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    let result;
    if (role && role.toLowerCase() === 'admin') {
      result = await connection.execute(
        `SELECT customer_id, name, address, phone FROM CUSTOMERS WHERE customer_id = :1`,
        [customerId]
      );
    } else if (userId && Number(userId) === Number(customerId)) {
      result = await connection.execute(
        `SELECT customer_id, name, address, phone FROM CUSTOMERS WHERE customer_id = :1`,
        [customerId]
      );
    } else {
      return null;
    }

    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
};

exports.createCustomer = async ({ name, address, phone, email = null, password_hash = null }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    const result = await connection.execute(
      `INSERT INTO CUSTOMERS (customer_id, name, address, phone, email, password_hash)
       VALUES (customers_seq.NEXTVAL, :name, :address, :phone, :email, :password_hash)
       RETURNING customer_id INTO :id`,
      {
        name,
        address,
        phone,
        email,
        password_hash,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );

    return {
      customer_id: result.outBinds.id[0],
      name,
      address,
      phone
    };
  } finally {
    await connection.close();
  }
};

exports.updateCustomer = async (customerId, { name, address, phone }, userId, role) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    // Allow admin to update any customer; customers can only update themselves
    let result;
    if (role && role.toLowerCase() === 'admin') {
      result = await connection.execute(
        `UPDATE CUSTOMERS SET name = :1, address = :2, phone = :3, updated_at = CURRENT_TIMESTAMP WHERE customer_id = :4`,
        [name, address, phone, customerId],
        { autoCommit: true }
      );
    } else {
      result = await connection.execute(
        `UPDATE CUSTOMERS SET name = :1, address = :2, phone = :3, updated_at = CURRENT_TIMESTAMP WHERE customer_id = :4 AND customer_id = :5`,
        [name, address, phone, customerId, userId],
        { autoCommit: true }
      );
    }

    if (result.rowsAffected === 0) {
      throw new Error("Customer not found or not authorized");
    }

    return { customer_id: customerId, name, address, phone };
  } finally {
    await connection.close();
  }
};

exports.deleteCustomer = async (customerId, userId, role) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    let result;
    if (role && role.toLowerCase() === 'admin') {
      result = await connection.execute(`DELETE FROM CUSTOMERS WHERE customer_id = :1`, [customerId], { autoCommit: true });
    } else {
      result = await connection.execute(`DELETE FROM CUSTOMERS WHERE customer_id = :1 AND customer_id = :2`, [customerId, userId], { autoCommit: true });
    }

    if (result.rowsAffected === 0) {
      throw new Error("Customer not found or not authorized");
    }
  } finally {
    await connection.close();
  }
};

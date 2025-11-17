const database = require("../config/database");
const oracledb = require("oracledb");

exports.getAllCustomers = async () => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT customer_id, name, address, phone 
       FROM CUSTOMERS 
       ORDER BY customer_id`
    );
    return result.rows;
  } finally {
    await connection.close();
  }
};

exports.getCustomerById = async (customerId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT customer_id, name, address, phone 
       FROM CUSTOMERS 
       WHERE customer_id = :id`,
      [customerId]
    );
    
    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
};

exports.createCustomer = async ({ name, address, phone }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `INSERT INTO CUSTOMERS (customer_id, name, address, phone) 
       VALUES (customers_seq.NEXTVAL, :name, :address, :phone)
       RETURNING customer_id INTO :id`,
      {
        name,
        address,
        phone,
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

exports.updateCustomer = async (customerId, { name, address, phone }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `UPDATE CUSTOMERS 
       SET name = :name, address = :address, phone = :phone
       WHERE customer_id = :id`,
      { id: customerId, name, address, phone },
      { autoCommit: true }
    );
    
    if (result.rowsAffected === 0) {
      throw new Error("Customer not found");
    }
    
    return { customer_id: customerId, name, address, phone };
  } finally {
    await connection.close();
  }
};

exports.deleteCustomer = async (customerId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `DELETE FROM CUSTOMERS WHERE customer_id = :id`,
      [customerId],
      { autoCommit: true }
    );
    
    if (result.rowsAffected === 0) {
      throw new Error("Customer not found");
    }
  } finally {
    await connection.close();
  }
};

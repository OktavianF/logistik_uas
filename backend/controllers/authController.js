const database = require("../config/database");
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "change_this_secret";
const TOKEN_EXPIRY = process.env.AUTH_TOKEN_EXPIRY || "7d";

async function signup(req, res) {
  const { email, password, full_name, customer_name, address, phone, lat, lng } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required" });
  }

  const pool = database.getPool();
  const conn = await pool.getConnection();

  try {
    // Check if customer with this email exists
    const existing = await conn.execute(`SELECT customer_id FROM CUSTOMERS WHERE email = :1`, [email]);
    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: "Customer already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Normalize latitude/longitude to match DB NUMBER(9,6) precision
    const normalizeCoord = (v) => {
      if (v === undefined || v === null || v === '') return null;
      const num = Number(v);
      if (Number.isNaN(num)) return null;
      // Round to 6 decimal places to fit NUMBER(9,6)
      return Number(num.toFixed(6));
    };

    const latVal = normalizeCoord(lat);
    const lngVal = normalizeCoord(lng);

    // If client supplied coords but they are invalid (couldn't normalize), return 400
    if ((lat !== undefined && lat !== null && lat !== '') && latVal === null) {
      console.warn('Invalid latitude supplied during signup', { lat });
      return res.status(400).json({ success: false, error: 'Invalid latitude value' });
    }
    if ((lng !== undefined && lng !== null && lng !== '') && lngVal === null) {
      console.warn('Invalid longitude supplied during signup', { lng });
      return res.status(400).json({ success: false, error: 'Invalid longitude value' });
    }

    // Insert into CUSTOMERS directly
    const insertBind = {
      name: customer_name || full_name || email,
      address: address || null,
      phone: phone || null,
      email,
      password_hash,
      lat: latVal,
      lng: lngVal,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const custSql = `INSERT INTO CUSTOMERS (customer_id, name, address, phone, email, password_hash, lat, lng) VALUES (customers_seq.NEXTVAL, :name, :address, :phone, :email, :password_hash, :lat, :lng) RETURNING customer_id INTO :id`;
    // Debug: log bound values (avoid printing password hash contents)
    try {
      console.debug('signup insert bind summary', {
        name: insertBind.name && insertBind.name.length,
        email: insertBind.email,
        phone: insertBind.phone && insertBind.phone.length,
        lat: insertBind.lat,
        lng: insertBind.lng
      });
    } catch (e) { /* ignore logging errors */ }

    const custRes = await conn.execute(custSql, insertBind, { autoCommit: true });
    const newCustomerId = custRes.outBinds.id[0];

    // Create token payload: set user_id to customer_id for backward compatibility
    const token = jwt.sign({ user_id: newCustomerId, customer_id: newCustomerId, email, role: 'customer' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return res.json({ success: true, token, user: { user_id: newCustomerId, email, full_name: insertBind.name, role: 'customer' }, customer: { customer_id: newCustomerId, name: insertBind.name, address: insertBind.address, phone: insertBind.phone, lat: insertBind.lat, lng: insertBind.lng } });
  } catch (err) {
    console.error("signup error:", err);
    try { await conn.rollback(); } catch (e) {}
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    try { await conn.close(); } catch (e) {}
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required" });
  }

  const pool = database.getPool();
  const conn = await pool.getConnection();

  try {
    console.debug('login attempt for identifier:', email);
    // Try admin login first
    // Use a named bind so the same value can be referenced multiple times without duplicating bind values
    let q = await conn.execute(`SELECT admin_id, password_hash, username, email FROM ADMINS WHERE email = :id OR username = :id`, { id: email });
    let row = q.rows && q.rows[0];
    if (row) {
      console.debug('admin row found for identifier', email);
      let admin_id, password_hash, usernameVal, emailVal;
      if (Array.isArray(row)) {
        [admin_id, password_hash, usernameVal, emailVal] = row;
      } else {
        admin_id = row.ADMIN_ID ?? row.admin_id;
        password_hash = row.PASSWORD_HASH ?? row.password_hash;
        usernameVal = row.USERNAME ?? row.username;
        emailVal = row.EMAIL ?? row.email;
      }
      let matchAdmin = false;
      if (password_hash) {
        try {
          matchAdmin = await bcrypt.compare(password, password_hash);
        } catch (err) {
          console.error('bcrypt compare error for admin:', err);
          matchAdmin = false;
        }
      } else {
        console.warn('Admin record has no password_hash set', { admin_id, username: usernameVal, email: emailVal });
      }
      if (matchAdmin) {
        const token = jwt.sign({ user_id: admin_id, admin_id, email: emailVal, role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        return res.json({ success: true, token, user: { user_id: admin_id, email: emailVal, username: usernameVal, role: 'admin' } });
      }
    }

    // Next, try courier login (allow identifier: phone, email, or username)
    q = await conn.execute(`SELECT courier_id, password_hash, name FROM COURIERS WHERE phone = :id OR email = :id OR username = :id`, { id: email });
    row = q.rows && q.rows[0];
    if (row) console.debug('courier row found for identifier', email);
    if (row) {
      let courier_id, password_hash, nameVal;
      if (Array.isArray(row)) {
        [courier_id, password_hash, nameVal] = row;
      } else {
        courier_id = row.COURIER_ID ?? row.courier_id;
        password_hash = row.PASSWORD_HASH ?? row.password_hash;
        nameVal = row.NAME ?? row.name;
      }
      if (password_hash) {
        console.debug('courier password_hash present length:', (password_hash || '').length);
        try {
          const matchCourier = await bcrypt.compare(password, password_hash);
          console.debug('bcrypt.compare result for courier', courier_id, matchCourier ? 'MATCH' : 'NO_MATCH');
          if (matchCourier) {
            const token = jwt.sign({ user_id: courier_id, courier_id, role: 'courier' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
            return res.json({ success: true, token, user: { user_id: courier_id, role: 'courier', name: nameVal } });
          }
        } catch (err) {
          console.error('bcrypt compare error for courier:', err);
        }
      } else {
        console.warn('Courier record has no password_hash set', { courier_id, name: nameVal });
      }
    }

    // Finally, try customer login
    const result = await conn.execute(`SELECT customer_id, password_hash, name, email FROM CUSTOMERS WHERE email = :1`, [email]);
    const crow = result.rows && result.rows[0];
    if (!crow) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    let customer_id, customer_password_hash, nameVal, emailVal;
    if (Array.isArray(crow)) {
      [customer_id, customer_password_hash, nameVal, emailVal] = crow;
    } else {
      customer_id = crow.CUSTOMER_ID ?? crow.customer_id;
      customer_password_hash = crow.PASSWORD_HASH ?? crow.password_hash;
      nameVal = crow.NAME ?? crow.name;
      emailVal = crow.EMAIL ?? crow.email;
    }

    if (!customer_password_hash) {
      console.warn('Customer record has no password_hash set', { customer_id });
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, customer_password_hash);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ user_id: customer_id, customer_id, email: emailVal, role: 'customer' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    return res.json({ success: true, token, user: { user_id: customer_id, email: emailVal, full_name: nameVal, role: 'customer' }, customer: { customer_id, name: nameVal } });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    try { await conn.close(); } catch (e) {}
  }
}

async function me(req, res) {
  // authMiddleware attaches decoded payload to req.user
  const payload = req.user || {};
  const pool = database.getPool();
  const conn = await pool.getConnection();
  try {
    const role = payload.role || 'customer';
    if (role === 'admin') {
      const adminId = payload.admin_id || payload.user_id;
      const result = await conn.execute(`SELECT admin_id, username, display_name, email, contact, created_at FROM ADMINS WHERE admin_id = :1`, [adminId]);
      const row = result.rows && result.rows[0];
      if (!row) return res.status(404).json({ success: false, error: 'Admin not found' });
      let admin = null;
      if (Array.isArray(row)) {
        admin = { admin_id: row[0], username: row[1], display_name: row[2], email: row[3], contact: row[4] };
      } else {
        admin = { admin_id: row.ADMIN_ID, username: row.USERNAME, display_name: row.DISPLAY_NAME, email: row.EMAIL, contact: row.CONTACT };
      }
      return res.json({ success: true, user: { user_id: admin.admin_id, role: 'admin', username: admin.username }, admin });
    } else if (role === 'courier') {
      const courierId = payload.courier_id || payload.user_id;
      const result = await conn.execute(`SELECT courier_id, name, phone, region, created_at FROM COURIERS WHERE courier_id = :1`, [courierId]);
      const row = result.rows && result.rows[0];
      if (!row) return res.status(404).json({ success: false, error: 'Courier not found' });
      let courier = null;
      if (Array.isArray(row)) {
        courier = { courier_id: row[0], name: row[1], phone: row[2], region: row[3] };
      } else {
        courier = { courier_id: row.COURIER_ID, name: row.NAME, phone: row.PHONE, region: row.REGION };
      }
      return res.json({ success: true, user: { user_id: courier.courier_id, role: 'courier', name: courier.name }, courier });
    } else {
      const customerId = payload.customer_id || payload.user_id;
      if (!customerId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const result = await conn.execute(`SELECT customer_id, name, email, address, phone, lat, lng FROM CUSTOMERS WHERE customer_id = :1`, [customerId]);
      const row = result.rows && result.rows[0];
      if (!row) return res.status(404).json({ success: false, error: 'Customer not found' });
      let customer = null;
      if (Array.isArray(row)) {
        customer = { customer_id: row[0], name: row[1], email: row[2], address: row[3], phone: row[4], lat: row[5] || null, lng: row[6] || null };
      } else {
        customer = { customer_id: row.CUSTOMER_ID, name: row.NAME, email: row.EMAIL, address: row.ADDRESS, phone: row.PHONE, lat: row.LAT || null, lng: row.LNG || null };
      }
      return res.json({ success: true, user: { user_id: customer.customer_id, email: customer.email, full_name: customer.name, role: 'customer' }, customer });
    }
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    try { await conn.close(); } catch (e) {}
  }

}

module.exports = {
  signup,
  login,
  me
};

const database = require('../config/database');
const bcrypt = require('bcrypt');

// Protected internal endpoint to create an admin account
// Require header: x-internal-secret === process.env.INTERNAL_ADMIN_SECRET

exports.createAdmin = async (req, res) => {
  const secret = req.headers['x-internal-secret'] || req.headers['X-Internal-Secret'];
  if (!process.env.INTERNAL_ADMIN_SECRET || secret !== process.env.INTERNAL_ADMIN_SECRET) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const { username, display_name, email, password, contact } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'username, email and password are required' });
  }

  const pool = database.getPool();
  const conn = await pool.getConnection();
  try {
    // check existing
    const exists = await conn.execute(`SELECT admin_id FROM ADMINS WHERE username = :1 OR email = :2`, [username, email]);
    if (exists.rows && exists.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Admin with given username or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const bind = {
      username,
      display_name: display_name || null,
      email,
      password_hash,
      contact: contact || null,
      id: { dir: 3001, type: 2 } // will be replaced by execute bind below for RETURNING
    };

    // Use explicit bind for returning admin_id
    const result = await conn.execute(
      `INSERT INTO ADMINS (admin_id, username, display_name, email, password_hash, contact)
       VALUES (admins_seq.NEXTVAL, :username, :display_name, :email, :password_hash, :contact)
       RETURNING admin_id INTO :id`,
      {
        username: bind.username,
        display_name: bind.display_name,
        email: bind.email,
        password_hash: bind.password_hash,
        contact: bind.contact,
        id: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
      },
      { autoCommit: true }
    );

    const adminId = result.outBinds.id[0];
    return res.status(201).json({ success: true, admin_id: adminId, username, email });
  } catch (err) {
    console.error('createAdmin error:', err);
    try { await conn.rollback(); } catch (e) {}
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    try { await conn.close(); } catch (e) {}
  }
};

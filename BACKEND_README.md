# Backend - Sistem Manajemen Logistik & Pengiriman

## 📋 Deskripsi
Backend API untuk Sistem Manajemen Logistik menggunakan **Node.js + Express.js + Oracle Database**.

## 🛠️ Teknologi Stack
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: Oracle Database 19c/21c
- **ORM/Driver**: oracledb (node-oracledb)
- **Arsitektur**: MVC Pattern
- **Documentation**: Swagger/OpenAPI

## 📦 Instalasi

### 1. Prerequisites
```bash
# Install Node.js (v18 atau lebih tinggi)
node --version

# Install Oracle Instant Client
# Download dari: https://www.oracle.com/database/technologies/instant-client/downloads.html
```

### 2. Clone & Install Dependencies
```bash
# Buat folder backend
cd backend

# Initialize npm
npm init -y

# Install dependencies
npm install express oracledb dotenv cors body-parser
npm install --save-dev nodemon @types/express @types/node
```

### 3. Konfigurasi Environment
Buat file `.env`:
```env
# Database Configuration
DB_USER=logistik
DB_PASSWORD=logistik123
DB_CONNECT_STRING=192.168.1.7:1521/ORCLPDB1

# Server Configuration
PORT=3000
NODE_ENV=development

# Connection Pool Settings
POOL_MIN=2
POOL_MAX=10
POOL_INCREMENT=1
```

Buat file `.env.example` (template):
```env
# Database Configuration
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECT_STRING=host:port/service_name

# Server Configuration
PORT=3000
NODE_ENV=development

# Connection Pool Settings
POOL_MIN=2
POOL_MAX=10
POOL_INCREMENT=1
```

## 🏗️ Struktur Folder

```
backend/
├── config/
│   └── database.js          # Konfigurasi koneksi Oracle
├── controllers/
│   ├── customerController.js
│   ├── courierController.js
│   ├── shipmentController.js
│   └── reportController.js
├── routes/
│   ├── customerRoutes.js
│   ├── courierRoutes.js
│   ├── shipmentRoutes.js
│   └── reportRoutes.js
├── services/
│   ├── customerService.js
│   ├── courierService.js
│   ├── shipmentService.js
│   └── reportService.js
├── models/
│   └── schema.sql            # SQL Schema DDL
├── middleware/
│   ├── errorHandler.js
│   └── validator.js
├── utils/
│   └── logger.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js                 # Entry point
```

## 📝 File Konfigurasi Utama

### config/database.js
```javascript
const oracledb = require("oracledb");
require("dotenv").config();

// Set output format to object
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Oracle Instant Client path (sesuaikan dengan instalasi Anda)
// oracledb.initOracleClient({ libDir: '/path/to/instantclient' });

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
    process.exit(1);
  }
}

async function close() {
  try {
    await pool.close(10);
    console.log("🔌 Connection pool closed");
  } catch (err) {
    console.error("Error closing connection pool:", err);
  }
}

function getPool() {
  return pool;
}

module.exports = {
  initialize,
  close,
  getPool
};
```

### server.js
```javascript
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const database = require("./config/database");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Import routes
const customerRoutes = require("./routes/customerRoutes");
const courierRoutes = require("./routes/courierRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Use routes
app.use("/api/customers", customerRoutes);
app.use("/api/couriers", courierRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/reports", reportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await database.initialize();
    app.listen(PORT, () => {
      console.log(\`🚀 Server running on port \${PORT}\`);
      console.log(\`📊 Environment: \${process.env.NODE_ENV}\`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on("SIGINT", async () => {
  console.log("\\n⏹️  Shutting down gracefully...");
  await database.close();
  process.exit(0);
});

startServer();
```

## 🔌 Contoh Controller

### controllers/customerController.js
```javascript
const customerService = require("../services/customerService");

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    
    // Validasi input
    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        error: "All fields are required"
      });
    }

    const result = await customerService.createCustomer({ name, address, phone });
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### services/customerService.js
```javascript
const database = require("../config/database");

exports.getAllCustomers = async () => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      \`SELECT customer_id, name, address, phone 
       FROM CUSTOMERS 
       ORDER BY customer_id\`
    );
    return result.rows;
  } finally {
    await connection.close();
  }
};

exports.createCustomer = async ({ name, address, phone }) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      \`INSERT INTO CUSTOMERS (customer_id, name, address, phone) 
       VALUES (customers_seq.NEXTVAL, :name, :address, :phone)
       RETURNING customer_id INTO :id\`,
      {
        name,
        address,
        phone,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );
    
    return { customer_id: result.outBinds.id[0], name, address, phone };
  } finally {
    await connection.close();
  }
};

exports.getCustomerById = async (customerId) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      \`SELECT customer_id, name, address, phone 
       FROM CUSTOMERS 
       WHERE customer_id = :id\`,
      [customerId]
    );
    
    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
};
```

### routes/customerRoutes.js
```javascript
const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

router.get("/", customerController.getAllCustomers);
router.post("/", customerController.createCustomer);
router.get("/:id", customerController.getCustomerById);

module.exports = router;
```

## 📊 API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Couriers
- `GET /api/couriers` - Get all couriers
- `POST /api/couriers` - Create new courier
- `GET /api/couriers/:id` - Get courier by ID

### Shipments
- `GET /api/shipments` - Get all shipments
- `POST /api/shipments` - Create new shipment
- `GET /api/shipments/:tracking_number` - Track shipment
- `PUT /api/shipments/:id/assign-courier` - Assign courier (trigger akan update status)

### Reports
- `GET /api/reports/per-courier` - Laporan pengiriman per kurir (Stored Procedure)
- `GET /api/reports/per-region` - Laporan pengiriman per wilayah (Stored Procedure)
- `GET /api/reports/performance` - Execution plan & performance analysis

## 🚀 Menjalankan Server

```bash
# Development mode dengan auto-reload
npm run dev

# Production mode
npm start
```

## 🧪 Testing API

Gunakan Postman atau curl:

```bash
# Health check
curl http://localhost:3000/health

# Get all customers
curl http://localhost:3000/api/customers

# Create customer
curl -X POST http://localhost:3000/api/customers \\
  -H "Content-Type: application/json" \\
  -d '{"name":"PT Test","address":"Jl. Test","phone":"08123456789"}'
```

## 🐛 Debugging Koneksi Oracle

### Common Issues:

1. **Error: DPI-1047: Cannot locate a 64-bit Oracle Client library**
   ```bash
   # Install Oracle Instant Client
   # Set environment variable:
   export LD_LIBRARY_PATH=/path/to/instantclient:$LD_LIBRARY_PATH
   ```

2. **Error: ORA-12170: TNS:Connect timeout occurred**
   ```bash
   # Check network connectivity
   ping 192.168.1.7
   
   # Check if port 1521 is open
   telnet 192.168.1.7 1521
   ```

3. **Error: ORA-01017: invalid username/password**
   ```bash
   # Verify credentials in .env file
   # Test connection with SQL*Plus:
   sqlplus logistik/logistik123@192.168.1.7:1521/ORCLPDB1
   ```

4. **Error: Connection pool not initialized**
   ```javascript
   // Make sure database.initialize() is called before starting server
   // Check server.js startServer() function
   ```

## 📚 Package.json

```json
{
  "name": "logistik-backend",
  "version": "1.0.0",
  "description": "Backend API for Logistics Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "oracledb": "^6.0.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 🔐 Security Best Practices

1. Jangan commit file `.env` ke git
2. Gunakan environment variables untuk credentials
3. Implementasikan rate limiting
4. Validasi semua input dari user
5. Gunakan prepared statements (sudah otomatis di oracledb)
6. Implementasikan authentication & authorization
7. Log semua database errors

## 📖 Additional Resources

- [node-oracledb Documentation](https://oracle.github.io/node-oracledb/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Oracle Database Documentation](https://docs.oracle.com/en/database/)

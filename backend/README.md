# Backend - Sistem Manajemen Logistik

Backend API untuk Sistem Manajemen Logistik menggunakan **Node.js + Express.js + Oracle Database**.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env dengan kredensial Oracle Anda
nano .env
```

### 3. Setup Database
Jalankan SQL script di Oracle Database:
```bash
# File SQL_SCRIPTS.sql berisi semua DDL dan seed data
sqlplus logistik/logistik123@192.168.1.7:1521/ORCLPDB1 @../SQL_SCRIPTS.sql
```

### 4. Run Server
```bash
# Development mode dengan auto-reload
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📁 Struktur Folder

```
backend/
├── config/
│   └── database.js          # Konfigurasi koneksi Oracle
├── controllers/             # Request handlers
│   ├── customerController.js
│   ├── courierController.js
│   ├── shipmentController.js
│   └── reportController.js
├── services/                # Business logic
│   ├── customerService.js
│   ├── courierService.js
│   ├── shipmentService.js
│   └── reportService.js
├── routes/                  # API routes
│   ├── customerRoutes.js
│   ├── courierRoutes.js
│   ├── shipmentRoutes.js
│   └── reportRoutes.js
├── .env                     # Environment variables (tidak di-commit)
├── .env.example             # Template environment
├── package.json
└── server.js                # Entry point
```

## 📊 API Endpoints

### Health Check
- `GET /health` - Server status

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Couriers
- `GET /api/couriers` - Get all couriers
- `GET /api/couriers/:id` - Get courier by ID
- `POST /api/couriers` - Create courier
- `PUT /api/couriers/:id` - Update courier
- `DELETE /api/couriers/:id` - Delete courier

### Shipments
- `GET /api/shipments` - Get all shipments
- `GET /api/shipments/dashboard` - Dashboard view (uses direct queries across shipments, customers and couriers)
- `GET /api/shipments/:tracking_number` - Track shipment
- `POST /api/shipments` - Create shipment
- `PUT /api/shipments/:id/assign-courier` - Assign courier (trigger akan update status)

### Reports
- `GET /api/reports/per-courier` - Laporan per kurir (Stored Procedure)
- `GET /api/reports/per-region` - Laporan per wilayah (Stored Procedure)
- `GET /api/reports/performance` - Performance analysis dengan execution plans

## 🧪 Testing API

```bash
# Health check
curl http://localhost:3000/health

# Get all customers
curl http://localhost:3000/api/customers

# Create customer
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"PT Test","address":"Jl. Test","phone":"08123456789"}'

# Track shipment
curl http://localhost:3000/api/shipments/TRK001
```

## 🐛 Troubleshooting

### Error: DPI-1047 (Oracle Client not found)
```bash
# Install Oracle Instant Client
# Download dari: https://www.oracle.com/database/technologies/instant-client/downloads.html

# Linux/Mac: Set environment variable
export LD_LIBRARY_PATH=/path/to/instantclient:$LD_LIBRARY_PATH

# Windows: Add to PATH
set PATH=C:\oracle\instantclient_19_9;%PATH%
```

### Error: ORA-12170 (Connection timeout)
```bash
# Check network connectivity
ping 192.168.1.7

# Check if Oracle listener is running
lsnrctl status
```

### Error: Connection pool not initialized
Pastikan `database.initialize()` dipanggil di `server.js` sebelum menjalankan server.

## 📚 Dependencies

- **express**: Web framework
- **oracledb**: Oracle database driver
- **dotenv**: Environment variables
- **cors**: Cross-origin resource sharing
- **body-parser**: Request body parsing
- **nodemon**: Development auto-reload (dev only)

## 🔐 Security

1. Jangan commit file `.env`
2. Gunakan environment variables untuk credentials
3. Validasi semua input
4. Gunakan prepared statements (built-in di oracledb)
5. Implementasikan rate limiting untuk production

## 📖 Resources

- [node-oracledb Documentation](https://oracle.github.io/node-oracledb/)
- [Express.js Guide](https://expressjs.com/)
- [Oracle Database Docs](https://docs.oracle.com/en/database/)

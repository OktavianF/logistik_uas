# 📦 Sistem Manajemen Logistik & Pengiriman Barang

Sistem lengkap untuk mengelola logistik dan pengiriman barang dengan **Frontend React** dan **Backend Node.js + Oracle Database**.

## 🎯 Fitur Utama

### ✅ Implementasi Lengkap
- ✔️ **Trigger Oracle**: Auto-update status saat kurir ditugaskan
- ✔️ **Stored Procedure**: Laporan per kurir dan per wilayah
- ✔️ **Function Oracle**: Perhitungan estimasi waktu tiba otomatis
- ✔️ **No Materialized View**: Dashboard uses direct queries (joins) to fetch latest data
- ✔️ **Index Optimization**: Index pada tracking_number, courier_id, shipping_date
- ✔️ **MVC Architecture**: Backend terstruktur dengan controllers, services, routes
- ✔️ **Modern UI**: React + Tailwind dengan komponen profesional

### 📊 Modul Sistem
1. **Dashboard**: Statistik dan pengiriman terbaru
2. **Pelanggan**: CRUD data pelanggan
3. **Kurir**: Manajemen kurir dan wilayah
4. **Pengiriman**: Tracking dan manajemen paket

## 🏗️ Struktur Proyek

```
logistik-system/
├── frontend/                    # React Frontend (ini repo)
│   ├── src/
│   │   ├── components/         # Komponen reusable
│   │   │   ├── Layout.tsx      # Layout dengan sidebar
│   │   │   └── ui/             # Shadcn UI components
│   │   ├── pages/              # Halaman aplikasi
│   │   │   ├── Dashboard.tsx   # Dashboard utama
│   │   │   ├── Customers.tsx   # Manajemen pelanggan
│   │   │   ├── Couriers.tsx    # Manajemen kurir
│   │   │   └── Shipments.tsx   # Manajemen pengiriman
│   │   ├── index.css           # Design system
│   │   └── App.tsx             # Router
│   └── package.json
│
├── backend/                     # Node.js Backend (lihat BACKEND_README.md)
│   ├── config/
│   │   └── database.js         # Konfigurasi Oracle connection pool
│   ├── controllers/            # Business logic
│   ├── services/               # Database operations
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Validasi & error handling
│   ├── .env                    # Environment variables
│   └── server.js               # Entry point
│
└── database/
    └── SQL_SCRIPTS.sql         # DDL, triggers, procedures, functions, views

```

## 🚀 Quick Start

### 1️⃣ Setup Database Oracle

```sql
-- Jalankan SQL_SCRIPTS.sql di Oracle SQL Developer atau SQL*Plus
sqlplus logistik/logistik123@192.168.1.7:1521/ORCLPDB1
@SQL_SCRIPTS.sql
```

**Script akan membuat:**
- ✅ 4 Tables: CUSTOMERS, COURIERS, SHIPMENTS, STATUS_LOG
- ✅ 4 Sequences untuk auto-increment
- ✅ 5 Indexes untuk optimasi query
- ✅ 1 Function: fn_estimasi_tiba
- ✅ 2 Stored Procedures: sp_report_per_courier, sp_report_per_region
- ✅ Materialized View: none (removed) — dashboard uses direct queries
- ✅ 1 Trigger: trg_update_shipment_status
- ✅ Sample data (5 customers, 5 couriers, 5 shipments)

### 2️⃣ Setup Backend

```bash
# Buat folder backend
mkdir backend
cd backend

# Install dependencies
npm init -y
npm install express oracledb dotenv cors body-parser
npm install --save-dev nodemon

# Buat file .env
cat > .env << EOL
DB_USER=logistik
DB_PASSWORD=logistik123
DB_CONNECT_STRING=192.168.1.7:1521/ORCLPDB1
PORT=3000
NODE_ENV=development
POOL_MIN=2
POOL_MAX=10
POOL_INCREMENT=1
EOL

# Copy semua file backend dari BACKEND_README.md
# Struktur file:
# - config/database.js
# - controllers/*.js
# - services/*.js
# - routes/*.js
# - server.js

# Jalankan server
npm run dev
```

**Backend akan berjalan di:** `http://localhost:3000`

### 3️⃣ Setup Frontend (Repo Ini)

```bash
# Install dependencies (sudah ada)
npm install

# Jalankan development server
npm run dev
```

**Frontend akan berjalan di:** `http://localhost:8080`

## 📡 API Endpoints

### Customers
```
GET    /api/customers           # Get all customers
POST   /api/customers           # Create customer
GET    /api/customers/:id       # Get customer by ID
PUT    /api/customers/:id       # Update customer
DELETE /api/customers/:id       # Delete customer
```

### Couriers
```
GET    /api/couriers            # Get all couriers
POST   /api/couriers            # Create courier
GET    /api/couriers/:id        # Get courier by ID
```

### Shipments
```
GET    /api/shipments           # Get all shipments
POST   /api/shipments           # Create shipment
GET    /api/shipments/:tracking # Track by tracking number
PUT    /api/shipments/:id/assign-courier  # Assign courier (trigger auto-update status)
```

### Reports
```
GET    /api/reports/per-courier    # Laporan per kurir (Stored Procedure)
GET    /api/reports/per-region     # Laporan per wilayah (Stored Procedure)
GET    /api/reports/performance    # Execution plan analysis
```

## 🎨 Design System

### Color Palette
- **Primary**: Biru `hsl(217, 91%, 45%)` - Kepercayaan & profesionalisme
- **Accent**: Hijau `hsl(142, 76%, 36%)` - Sukses & pengiriman
- **Warning**: Kuning `hsl(38, 92%, 50%)` - Status diproses
- **Info**: Biru muda `hsl(199, 89%, 48%)` - Informasi
- **Background**: Abu terang `hsl(210, 40%, 98%)`

### Status Colors
- 🟢 **Terkirim**: Success (hijau)
- 🔵 **Dikirim**: Info (biru)
- 🟡 **Diproses**: Warning (kuning)
- 🔴 **Dibatalkan**: Destructive (merah)

## 🛠️ Teknologi Stack

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **React Router** - Routing
- **TanStack Query** - Data fetching (ready for API integration)
- **Lucide Icons** - Icons

### Backend
- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **oracledb** - Oracle database driver
- **dotenv** - Environment variables
- **CORS** - Cross-origin support

### Database
- **Oracle Database 19c/21c**
- **PL/SQL** - Triggers, Procedures, Functions

## 📚 Dokumentasi Oracle Database

### ERD (Entity Relationship Diagram)

```
CUSTOMERS (1) ----< (N) SHIPMENTS (N) >---- (1) COURIERS
    │                        │
    │                        │
customer_id              courier_id
                             │
                             ↓
                        STATUS_LOG (history)
```

### Trigger Behavior

**Trigger: trg_update_shipment_status**

```sql
-- Scenario: Assign courier to shipment
UPDATE SHIPMENTS SET courier_id = 1 WHERE shipment_id = 5;

-- Auto execution:
-- 1. Update delivery_status: 'Diproses' → 'Dikirim'
-- 2. Insert log to STATUS_LOG with old_status and new_status
-- 3. Record updated_by = current user
```

### Function Usage

**Function: fn_estimasi_tiba**

```sql
-- Reguler service: 40 km/hour, 8 hours/day
SELECT fn_estimasi_tiba(200, 'Reguler') FROM DUAL;  -- Result: 1 hari

-- Express service: 60 km/hour, 8 hours/day
SELECT fn_estimasi_tiba(200, 'Express') FROM DUAL;  -- Result: 1 hari

-- Used automatically on INSERT:
INSERT INTO SHIPMENTS (..., delivery_estimate) 
VALUES (..., fn_estimasi_tiba(:distance, :service_type));
```

### Stored Procedure Output

**Procedure: sp_report_per_courier**

```sql
DECLARE
  v_cursor SYS_REFCURSOR;
BEGIN
  sp_report_per_courier(v_cursor);
  -- Output: courier_id, courier_name, region, total_pengiriman, terkirim, dalam_pengiriman, diproses, avg_distance_km
END;
```

**Backend endpoint akan return JSON:**
```json
[
  {
    "courier_id": 1,
    "courier_name": "Ahmad Rizki",
    "region": "Jakarta Selatan",
    "total_pengiriman": 15,
    "terkirim": 12,
    "dalam_pengiriman": 2,
    "diproses": 1,
    "avg_distance_km": 45.5
  }
]
```

<!-- Materialized view removed; dashboard queries base tables directly -->

## 🔍 Query Performance

### Index Usage Examples

```sql
-- Query 1: Track by tracking number (use IDX_TRACKING_NUMBER)
EXPLAIN PLAN FOR
SELECT * FROM SHIPMENTS WHERE tracking_number = 'TRK20250110000001';
-- Expected: INDEX RANGE SCAN on IDX_TRACKING_NUMBER

-- Query 2: Get shipments by courier (use IDX_COURIER_ID)
EXPLAIN PLAN FOR
SELECT * FROM SHIPMENTS WHERE courier_id = 1;
-- Expected: INDEX RANGE SCAN on IDX_COURIER_ID

-- Query 3: Get shipments by date range (use IDX_SHIPPING_DATE)
EXPLAIN PLAN FOR
SELECT * FROM SHIPMENTS 
WHERE shipping_date BETWEEN TO_DATE('2025-01-01', 'YYYY-MM-DD') 
AND TO_DATE('2025-01-31', 'YYYY-MM-DD');
-- Expected: INDEX RANGE SCAN on IDX_SHIPPING_DATE
```

### Execution Plan Analysis

```sql
-- View execution plan
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Expected output showing index usage:
-- Plan hash value: xxxxxxxxxx
-- | Id | Operation                   | Name                 |
-- |  0 | SELECT STATEMENT            |                      |
-- |  1 |  TABLE ACCESS BY INDEX ROWID| SHIPMENTS            |
-- |  2 |   INDEX RANGE SCAN          | IDX_TRACKING_NUMBER  |
```

## 🐛 Troubleshooting

### Issue 1: Cannot connect to Oracle
```bash
# Check network
ping 192.168.1.7

# Check port
telnet 192.168.1.7 1521

# Test with SQL*Plus
sqlplus logistik/logistik123@192.168.1.7:1521/ORCLPDB1
```

### Issue 2: DPI-1047 Error (Oracle Client library)
```bash
# Install Oracle Instant Client
# Download: https://www.oracle.com/database/technologies/instant-client/downloads.html

# Set environment variable (Linux/Mac)
export LD_LIBRARY_PATH=/path/to/instantclient:$LD_LIBRARY_PATH

# Set environment variable (Windows)
set PATH=C:\instantclient_19_x;%PATH%
```

### Issue 3: Connection pool errors
```javascript
// Check config/database.js
// Ensure pool is initialized before use
await database.initialize();
const pool = database.getPool();
```

### Issue 4: Trigger not firing
```sql
-- Check trigger status
SELECT trigger_name, status FROM user_triggers WHERE trigger_name = 'TRG_UPDATE_SHIPMENT_STATUS';

-- Enable trigger if disabled
ALTER TRIGGER trg_update_shipment_status ENABLE;

-- Test trigger manually
UPDATE SHIPMENTS SET courier_id = 1 WHERE shipment_id = 4;
SELECT * FROM STATUS_LOG ORDER BY updated_at DESC;
```

## 📖 Panduan Penggunaan

### 1. Menambah Pelanggan Baru
1. Klik menu "Pelanggan" di sidebar
2. Klik tombol "Tambah Pelanggan"
3. Isi formulir (nama, alamat, telepon)
4. Klik "Simpan"

### 2. Membuat Pengiriman Baru
1. Klik menu "Pengiriman"
2. Klik "Buat Pengiriman"
3. Pilih pelanggan dan kurir (opsional)
4. Isi origin, destination, jarak
5. Pilih jenis layanan (Reguler/Express)
6. System akan otomatis hitung estimasi dengan function Oracle
7. Klik "Buat Pengiriman"

### 3. Menugaskan Kurir
1. Buka detail pengiriman
2. Pilih kurir dari dropdown
3. Saat assign courier, **trigger otomatis update status** dari "Diproses" → "Dikirim"
4. Log perubahan tersimpan di STATUS_LOG

### 4. Tracking Pengiriman
1. Masukkan nomor resi di search box
2. Lihat detail status real-time
3. Data diambil dari direct queries (joins) untuk hasil yang up-to-date

## 🚢 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
# Build production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod
```

### Backend Deployment (VPS/Cloud)
```bash
# Set production environment
export NODE_ENV=production

# Run with PM2
npm install -g pm2
pm2 start server.js --name logistik-api
pm2 save
pm2 startup
```

### Database Backup
```bash
# Export schema and data
expdp logistik/logistik123@192.168.1.7:1521/ORCLPDB1 \\
  directory=DATA_PUMP_DIR \\
  dumpfile=logistik_backup.dmp \\
  logfile=logistik_backup.log \\
  schemas=logistik
```

## 📊 Monitoring & Performance

### Database Statistics
```sql
-- Check table statistics
SELECT table_name, num_rows, last_analyzed 
FROM user_tables 
WHERE table_name IN ('CUSTOMERS', 'COURIERS', 'SHIPMENTS', 'STATUS_LOG');

-- Gather statistics
EXEC DBMS_STATS.GATHER_SCHEMA_STATS('LOGISTIK');
```

### Query Performance
```sql
-- Top 10 slowest queries
SELECT sql_text, elapsed_time, executions
FROM v$sql
ORDER BY elapsed_time DESC
FETCH FIRST 10 ROWS ONLY;
```

## 🔐 Security Checklist

- ✅ Environment variables untuk credentials
- ✅ Input validation di backend
- ✅ Prepared statements (auto di oracledb)
- ✅ CORS configuration
- ⚠️ TODO: Add authentication (JWT)
- ⚠️ TODO: Add rate limiting
- ⚠️ TODO: Add audit logging

## 👥 Tim Pengembang

Sistem ini dikembangkan mengikuti best practices:
- **Clean Architecture**: MVC pattern
- **Separation of Concerns**: Controllers, Services, Routes terpisah
-- **Database Optimization**: Indexes (materialized view removed)
- **Modern UI/UX**: Responsive, accessible, user-friendly

## 📄 License

MIT License - Free to use for educational and commercial purposes.

## 📞 Support

Untuk pertanyaan atau issues:
1. Baca dokumentasi lengkap di BACKEND_README.md
2. Check SQL_SCRIPTS.sql untuk database schema
3. Review execution plans untuk optimization
4. Check console logs untuk debugging

---

**🎉 Sistem siap digunakan! Selamat mengoptimalkan logistik Anda!**

# 🚀 Panduan Instalasi Lengkap

Panduan step-by-step untuk setup Sistem Manajemen Logistik & Pengiriman Barang.

---

## 📋 Prerequisites

### 1. Software yang Harus Terinstall

#### Database
- ✅ **Oracle Database 19c/21c** (atau Oracle XE)
- ✅ **Oracle SQL Developer** atau SQL*Plus
- ✅ **Oracle Instant Client** (untuk backend Node.js)

#### Backend
- ✅ **Node.js v18+** dan npm
- ✅ **Git** (optional, untuk version control)

#### Frontend
- ✅ **Node.js v18+** dan npm
- ✅ **Modern web browser** (Chrome, Firefox, Edge)

### 2. Cek Versi Software

```bash
# Check Node.js version
node --version
# Expected: v18.0.0 or higher

# Check npm version
npm --version
# Expected: 9.0.0 or higher

# Check Oracle Database (dari SQL*Plus)
sqlplus / as sysdba
SELECT * FROM v$version;
```

---

## 🗄️ Step 1: Setup Oracle Database

### A. Koneksi ke Oracle Database

```bash
# Gunakan user system atau sysdba
sqlplus system/password@192.168.1.7:1521/ORCLPDB1
```

### B. Buat User & Schema

```sql
-- Create user
CREATE USER logistik IDENTIFIED BY logistik123;

-- Grant privileges
GRANT CONNECT, RESOURCE, CREATE VIEW TO logistik;
GRANT UNLIMITED TABLESPACE TO logistik;
GRANT CREATE TRIGGER TO logistik;
GRANT CREATE PROCEDURE TO logistik;
GRANT CREATE SEQUENCE TO logistik;

-- Grant execute privileges
-- DBMS_MVIEW privileges not required (materialized view has been removed)
GRANT EXECUTE ON DBMS_STATS TO logistik;

-- Commit changes
COMMIT;

-- Exit
EXIT;
```

### C. Login sebagai User Logistik

```bash
sqlplus logistik/logistik123@192.168.1.7:1521/ORCLPDB1
```

### D. Jalankan SQL Scripts

```sql
-- Copy paste semua content dari SQL_SCRIPTS.sql
-- Atau jalankan dari file:
@/path/to/SQL_SCRIPTS.sql

-- Verifikasi objects berhasil dibuat
SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_name IN (
  'CUSTOMERS', 'COURIERS', 'SHIPMENTS', 'STATUS_LOG',
  'FN_ESTIMASI_TIBA', 'SP_REPORT_PER_COURIER', 'SP_REPORT_PER_REGION',
  -- 'VW_SHIPMENT_STATUS', (removed)
  'IDX_TRACKING_NUMBER', 'IDX_COURIER_ID', 'IDX_SHIPPING_DATE'
)
ORDER BY object_type, object_name;
```

**Expected Output:**
```
OBJECT_NAME              OBJECT_TYPE       STATUS
------------------------ ----------------- ------
CUSTOMERS                TABLE             VALID
COURIERS                 TABLE             VALID
SHIPMENTS                TABLE             VALID
STATUS_LOG               TABLE             VALID
IDX_COURIER_ID           INDEX             VALID
IDX_SHIPPING_DATE        INDEX             VALID
IDX_TRACKING_NUMBER      INDEX             VALID
FN_ESTIMASI_TIBA         FUNCTION          VALID
SP_REPORT_PER_COURIER    PROCEDURE         VALID
SP_REPORT_PER_REGION     PROCEDURE         VALID
TRG_UPDATE_SHIPMENT_STATUS TRIGGER         ENABLED
-- VW_SHIPMENT_STATUS (removed)

11 rows selected.
```

### E. Test Sample Data

```sql
-- Check data
SELECT COUNT(*) FROM CUSTOMERS;  -- Expected: 5
SELECT COUNT(*) FROM COURIERS;   -- Expected: 5
SELECT COUNT(*) FROM SHIPMENTS;  -- Expected: 5

-- Test function
SELECT fn_estimasi_tiba(200, 'Express') AS estimasi_hari FROM DUAL;
-- Expected: 1

-- NOTE: Materialized view was removed. Use direct queries instead, e.g.:
-- SELECT s.tracking_number, c.name AS customer_name, co.name AS courier_name, s.delivery_status, s.updated_at
-- FROM SHIPMENTS s
-- LEFT JOIN CUSTOMERS c ON s.customer_id = c.customer_id
-- LEFT JOIN COURIERS co ON s.courier_id = co.courier_id
-- ORDER BY s.updated_at DESC;
-- Expected: 5 rows with customer and courier names

-- Exit
EXIT;
```

✅ **Database Setup Complete!**

---

## 🔧 Step 2: Setup Backend (Node.js + Express + Oracle)

### A. Install Oracle Instant Client

#### Windows:
1. Download dari: https://www.oracle.com/database/technologies/instant-client/downloads.html
2. Extract ke `C:\oracle\instantclient_19_x`
3. Tambahkan ke PATH:
   ```cmd
   set PATH=C:\oracle\instantclient_19_x;%PATH%
   ```

#### Linux/Mac:
```bash
# Download dan extract
wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basic-linux.x64-19.x.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.x.0.0.0dbru.zip

# Set environment variable
export LD_LIBRARY_PATH=/path/to/instantclient_19_x:$LD_LIBRARY_PATH

# Add to ~/.bashrc for permanent
echo 'export LD_LIBRARY_PATH=/path/to/instantclient_19_x:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

### B. Create Backend Project

```bash
# Buat folder backend (di luar folder frontend)
cd ..
mkdir backend
cd backend

# Initialize npm project
npm init -y

# Install dependencies
npm install express oracledb dotenv cors body-parser

# Install dev dependencies
npm install --save-dev nodemon
```

### C. Create Environment File

```bash
# Buat file .env
cat > .env << EOL
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
EOL
```

### D. Create Backend Structure

```bash
# Buat folder structure
mkdir config controllers services routes middleware utils

# Struktur akhir:
# backend/
# ├── config/
# │   └── database.js
# ├── controllers/
# │   ├── customerController.js
# │   ├── courierController.js
# │   ├── shipmentController.js
# │   └── reportController.js
# ├── services/
# │   ├── customerService.js
# │   ├── courierService.js
# │   ├── shipmentService.js
# │   └── reportService.js
# ├── routes/
# │   ├── customerRoutes.js
# │   ├── courierRoutes.js
# │   ├── shipmentRoutes.js
# │   └── reportRoutes.js
# ├── middleware/
# │   └── errorHandler.js
# ├── .env
# ├── package.json
# └── server.js
```

### E. Copy Backend Code

**Refer to BACKEND_README.md** for complete code of:
- `config/database.js`
- `server.js`
- All controllers, services, and routes

Atau download template lengkap dari documentation.

### F. Update package.json Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### G. Test Backend Connection

```bash
# Run development server
npm run dev
```

**Expected Output:**
```
✅ Oracle Connection Pool created successfully
🚀 Server running on port 3000
📊 Environment: development
```

### H. Test API Endpoints

```bash
# Test health check
curl http://localhost:3000/health
# Expected: {"status":"OK","message":"Server is running"}

# Test get customers
curl http://localhost:3000/api/customers
# Expected: JSON array of customers

# Test create customer
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "address": "Test Address",
    "phone": "08123456789"
  }'
# Expected: Success response with new customer ID
```

✅ **Backend Setup Complete!**

---

## 🎨 Step 3: Setup Frontend (React + Tailwind)

### A. Navigate to Frontend Folder

```bash
# Kembali ke folder frontend (repo ini)
cd ../frontend  # atau cd ke folder repo ini
```

### B. Install Dependencies

```bash
# Install semua dependencies
npm install
```

Dependencies yang akan terinstall:
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI components
- React Router
- TanStack Query
- Lucide Icons

### C. Configure API Base URL (Optional)

Jika backend tidak di localhost:3000, update base URL:

```typescript
// src/lib/api.ts (create this file)
export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

// Usage in components:
import { API_BASE_URL } from '@/lib/api';

fetch(`${API_BASE_URL}/customers`)
  .then(res => res.json())
  .then(data => console.log(data));
```

### D. Run Development Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### E. Open Browser

Navigate to: `http://localhost:8080`

You should see:
- 🏠 **Dashboard** with statistics cards and recent shipments
- 👥 **Pelanggan** page with customer list
- 🚚 **Kurir** page with courier list
- 📦 **Pengiriman** page with shipment management

✅ **Frontend Setup Complete!**

---

## 🔗 Step 4: Connect Frontend to Backend

### A. Install Axios (Recommended for API calls)

```bash
npm install axios
```

### B. Create API Service

```typescript
// src/services/api.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Customers API
export const customerAPI = {
  getAll: () => API.get('/customers'),
  getById: (id: number) => API.get(`/customers/${id}`),
  create: (data: any) => API.post('/customers', data),
  update: (id: number, data: any) => API.put(`/customers/${id}`, data),
  delete: (id: number) => API.delete(`/customers/${id}`)
};

// Couriers API
export const courierAPI = {
  getAll: () => API.get('/couriers'),
  create: (data: any) => API.post('/couriers', data)
};

// Shipments API
export const shipmentAPI = {
  getAll: () => API.get('/shipments'),
  getByTracking: (tracking: string) => API.get(`/shipments/${tracking}`),
  create: (data: any) => API.post('/shipments', data),
  assignCourier: (id: number, courierId: number) => 
    API.put(`/shipments/${id}/assign-courier`, { courier_id: courierId })
};

// Reports API
export const reportAPI = {
  perCourier: () => API.get('/reports/per-courier'),
  perRegion: () => API.get('/reports/per-region'),
  performance: () => API.get('/reports/performance')
};

export default API;
```

### C. Update Components to Use Real API

Example for Customers page:

```typescript
// src/pages/Customers.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerAPI } from '@/services/api';

const Customers = () => {
  const queryClient = useQueryClient();
  
  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await customerAPI.getAll();
      return response.data.data;
    }
  });
  
  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: customerAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Berhasil", description: "Pelanggan berhasil ditambahkan" });
    }
  });
  
  // ... rest of component
};
```

✅ **Frontend-Backend Integration Complete!**

---

## 🧪 Step 5: Testing Complete System

### A. Test Database

```sql
-- Connect to Oracle
sqlplus logistik/logistik123@192.168.1.7:1521/ORCLPDB1

-- Test queries
SELECT COUNT(*) FROM CUSTOMERS;
-- SELECT * FROM vw_shipment_status; -- removed (materialized view no longer used)

-- Test trigger
UPDATE SHIPMENTS SET courier_id = 1 WHERE shipment_id = 4;
SELECT * FROM STATUS_LOG ORDER BY updated_at DESC;

-- Test function
SELECT fn_estimasi_tiba(300, 'Express') FROM DUAL;

-- Test procedure
DECLARE
  v_cursor SYS_REFCURSOR;
BEGIN
  sp_report_per_courier(v_cursor);
END;
/
```

### B. Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# Get all customers
curl http://localhost:3000/api/customers

# Track shipment
curl http://localhost:3000/api/shipments/TRK20250110000001

# Get report
curl http://localhost:3000/api/reports/per-courier
```

### C. Test Frontend

1. Open `http://localhost:8080`
2. Navigate to **Pelanggan** → Click "Tambah Pelanggan"
3. Fill form and save
4. Check if data appears in table
5. Navigate to **Pengiriman** → Click "Buat Pengiriman"
6. Create shipment and verify in database

### D. Test Complete Flow

1. **Create Customer** via frontend
2. **Create Courier** via frontend
3. **Create Shipment** without courier (status: "Diproses")
4. **Assign Courier** → Trigger should auto-update status to "Dalam Pengiriman"
5. **Check STATUS_LOG** table for log entry
6. **View Dashboard** to see updated statistics

---

## 🐛 Troubleshooting Common Issues

### Issue 1: Cannot connect to Oracle

**Error:** `ORA-12170: TNS:Connect timeout occurred`

**Solution:**
```bash
# Check if Oracle is running
lsnrctl status

# Check network
ping 192.168.1.7

# Check port
telnet 192.168.1.7 1521

# Verify connection string
tnsping 192.168.1.7:1521/ORCLPDB1
```

### Issue 2: DPI-1047 Oracle Client library error

**Error:** `DPI-1047: Cannot locate a 64-bit Oracle Client library`

**Solution:**
```bash
# Install Oracle Instant Client
# Set LD_LIBRARY_PATH (Linux/Mac)
export LD_LIBRARY_PATH=/path/to/instantclient:$LD_LIBRARY_PATH

# Or set PATH (Windows)
set PATH=C:\oracle\instantclient_19_x;%PATH%

# Verify
node -e "console.log(require('oracledb').versionString)"
```

### Issue 3: CORS errors in browser

**Error:** `Access-Control-Allow-Origin header is missing`

**Solution:**
```javascript
// In server.js, add:
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
```

### Issue 4: Trigger not firing

**Error:** Trigger doesn't update status

**Solution:**
```sql
-- Check trigger status
SELECT trigger_name, status FROM user_triggers 
WHERE trigger_name = 'TRG_UPDATE_SHIPMENT_STATUS';

-- Enable trigger
ALTER TRIGGER trg_update_shipment_status ENABLE;

-- Compile trigger
ALTER TRIGGER trg_update_shipment_status COMPILE;
```

### Issue 5: Port already in use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port in .env
PORT=3001
```

---

## ✅ Verification Checklist

Before going to production, verify:

- [ ] Database objects created successfully (12 objects)
- [ ] Sample data inserted (5 customers, 5 couriers, 5 shipments)
- [ ] Backend server runs without errors
- [ ] Health endpoint returns OK
- [ ] All API endpoints return valid JSON
- [ ] Frontend loads without errors
- [ ] Can create/read/update/delete customers
- [ ] Can create couriers
- [ ] Can create shipments
- [ ] Trigger fires when assigning courier
  - [ ] (Materialized view removed — not applicable)
- [ ] Reports show aggregated data
- [ ] No console errors in browser
- [ ] Responsive design works on mobile

---

## 🎉 Congratulations!

Your **Sistem Manajemen Logistik & Pengiriman Barang** is now fully operational!

### Next Steps:
1. Add authentication (JWT)
2. Add authorization (role-based access)
3. (Optional) If you later add a materialized view, schedule refresh jobs as needed
4. Add data validation
5. Implement real-time notifications
6. Add export to Excel/PDF
7. Deploy to production

### Resources:
- **BACKEND_README.md** - Backend documentation
- **API_DOCUMENTATION.md** - API reference
- **README_PROJECT.md** - Project overview
- **SQL_SCRIPTS.sql** - Database schema

---

**Need help?** Review the troubleshooting section or check the complete documentation files.

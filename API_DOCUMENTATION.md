# 📡 API Documentation - Logistik System

Base URL: `http://localhost:3000/api`

## 🔐 Authentication

Currently no authentication required. In production, add JWT tokens:
```javascript
headers: {
  'Authorization': 'Bearer <your_token>',
  'Content-Type': 'application/json'
}
```

---

## 👥 Customers API

### GET /api/customers
Get all customers

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "CUSTOMER_ID": 1,
      "NAME": "PT. Maju Jaya",
      "ADDRESS": "Jl. Sudirman No. 123, Jakarta Pusat",
      "PHONE": "021-12345678",
      "CREATED_AT": "2025-01-10T10:30:00.000Z",
      "UPDATED_AT": "2025-01-10T10:30:00.000Z"
    }
  ]
}
```

### POST /api/customers
Create new customer

**Request Body:**
```json
{
  "name": "PT. Sejahtera Bersama",
  "address": "Jl. Thamrin No. 45, Jakarta",
  "phone": "021-99887766"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "customer_id": 6,
    "name": "PT. Sejahtera Bersama",
    "address": "Jl. Thamrin No. 45, Jakarta",
    "phone": "021-99887766"
  }
}
```

**Error 400 Bad Request:**
```json
{
  "success": false,
  "error": "All fields are required"
}
```

### GET /api/customers/:id
Get customer by ID

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "CUSTOMER_ID": 1,
    "NAME": "PT. Maju Jaya",
    "ADDRESS": "Jl. Sudirman No. 123, Jakarta Pusat",
    "PHONE": "021-12345678",
    "CREATED_AT": "2025-01-10T10:30:00.000Z",
    "UPDATED_AT": "2025-01-10T10:30:00.000Z"
  }
}
```

**Error 404 Not Found:**
```json
{
  "success": false,
  "error": "Customer not found"
}
```

### PUT /api/customers/:id
Update customer

**Request Body:**
```json
{
  "name": "PT. Maju Jaya Updated",
  "address": "Jl. Sudirman No. 123A, Jakarta Pusat",
  "phone": "021-12345679"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Customer updated successfully"
}
```

### DELETE /api/customers/:id
Delete customer

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

## 🚚 Couriers API

### GET /api/couriers
Get all couriers

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "COURIER_ID": 1,
      "NAME": "Ahmad Rizki",
      "PHONE": "0812-3456-7890",
      "REGION": "Jakarta Selatan",
      "CREATED_AT": "2025-01-10T10:30:00.000Z",
      "UPDATED_AT": "2025-01-10T10:30:00.000Z"
    }
  ]
}
```

### POST /api/couriers
Create new courier

**Request Body:**
```json
{
  "name": "Fajar Nugroho",
  "phone": "0817-1122-3344",
  "region": "Bekasi"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "courier_id": 6,
    "name": "Fajar Nugroho",
    "phone": "0817-1122-3344",
    "region": "Bekasi"
  }
}
```

### GET /api/couriers/:id
Get courier by ID

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "COURIER_ID": 1,
    "NAME": "Ahmad Rizki",
    "PHONE": "0812-3456-7890",
    "REGION": "Jakarta Selatan"
  }
}
```

---

## 📦 Shipments API

### GET /api/shipments
Get all shipments

**Query Parameters:**
- `status` (optional): Filter by status (Diproses, Dalam Pengiriman, Terkirim)
- `customer_id` (optional): Filter by customer
- `courier_id` (optional): Filter by courier
- `limit` (optional): Limit results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:** `/api/shipments?status=Dalam Pengiriman&limit=10`

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "SHIPMENT_ID": 1,
      "TRACKING_NUMBER": "TRK20250110000001",
      "CUSTOMER_ID": 1,
      "COURIER_ID": 1,
      "ORIGIN": "Jakarta Pusat",
      "DESTINATION": "Jakarta Selatan",
      "DISTANCE_KM": 25,
      "SERVICE_TYPE": "Express",
      "SHIPPING_DATE": "2025-01-10T00:00:00.000Z",
      "DELIVERY_ESTIMATE": 1,
      "DELIVERY_STATUS": "Dalam Pengiriman",
      "CREATED_AT": "2025-01-10T10:30:00.000Z",
      "UPDATED_AT": "2025-01-10T11:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

### POST /api/shipments
Create new shipment

**Request Body:**
```json
{
  "customer_id": 1,
  "courier_id": null,
  "origin": "Jakarta",
  "destination": "Surabaya",
  "distance_km": 800,
  "service_type": "Express"
}
```

**Note:** 
- `tracking_number` auto-generated format: `TRK{YYYYMMDD}{seq}`
- `delivery_estimate` auto-calculated using Oracle function `fn_estimasi_tiba`
- `delivery_status` default: "Diproses"
- `courier_id` can be NULL initially

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "shipment_id": 6,
    "tracking_number": "TRK20250110000006",
    "customer_id": 1,
    "courier_id": null,
    "origin": "Jakarta",
    "destination": "Surabaya",
    "distance_km": 800,
    "service_type": "Express",
    "delivery_estimate": 2,
    "delivery_status": "Diproses"
  }
}
```

### GET /api/shipments/:tracking_number
Track shipment by tracking number

**Example:** `/api/shipments/TRK20250110000001`

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "shipment": {
      "SHIPMENT_ID": 1,
      "TRACKING_NUMBER": "TRK20250110000001",
      "CUSTOMER_NAME": "PT. Maju Jaya",
      "COURIER_NAME": "Ahmad Rizki",
      "ORIGIN": "Jakarta Pusat",
      "DESTINATION": "Jakarta Selatan",
      "DISTANCE_KM": 25,
      "SERVICE_TYPE": "Express",
      "SHIPPING_DATE": "2025-01-10T00:00:00.000Z",
      "DELIVERY_ESTIMATE": 1,
      "DELIVERY_STATUS": "Dalam Pengiriman",
      "LAST_UPDATE": "2025-01-10T11:15:00.000Z"
    },
    "history": [
      {
        "LOG_ID": 1,
        "OLD_STATUS": "Diproses",
        "NEW_STATUS": "Dalam Pengiriman",
        "UPDATED_AT": "2025-01-10T11:15:00.000Z",
        "UPDATED_BY": "LOGISTIK",
        "NOTES": "Status auto-updated by trigger: Courier assigned"
      }
    ]
  }
}
```

**Error 404 Not Found:**
```json
{
  "success": false,
  "error": "Shipment not found"
}
```

### PUT /api/shipments/:id/assign-courier
Assign courier to shipment (trigger auto-update status)

**Request Body:**
```json
{
  "courier_id": 1
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Courier assigned successfully",
  "data": {
    "shipment_id": 4,
    "tracking_number": "TRK20250110000004",
    "old_status": "Diproses",
    "new_status": "Dalam Pengiriman",
    "courier_id": 1
  }
}
```

**Trigger Behavior:**
- Automatically updates `delivery_status` from "Diproses" to "Dalam Pengiriman"
- Creates log entry in `STATUS_LOG` table
- Records `updated_by` and `updated_at`

### PUT /api/shipments/:id/update-status
Manually update shipment status

**Request Body:**
```json
{
  "status": "Terkirim",
  "notes": "Package delivered successfully"
}
```

**Valid statuses:** Diproses, Dalam Pengiriman, Terkirim, Dibatalkan

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Status updated successfully"
}
```

---

## 📊 Reports API

### GET /api/reports/per-courier
Get shipment report per courier (uses Stored Procedure)

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "COURIER_ID": 1,
      "COURIER_NAME": "Ahmad Rizki",
      "REGION": "Jakarta Selatan",
      "TOTAL_PENGIRIMAN": 15,
      "TERKIRIM": 12,
      "DALAM_PENGIRIMAN": 2,
      "DIPROSES": 1,
      "AVG_DISTANCE_KM": 45.5
    },
    {
      "COURIER_ID": 2,
      "COURIER_NAME": "Budi Santoso",
      "REGION": "Bandung",
      "TOTAL_PENGIRIMAN": 20,
      "TERKIRIM": 18,
      "DALAM_PENGIRIMAN": 1,
      "DIPROSES": 1,
      "AVG_DISTANCE_KM": 120.75
    }
  ]
}
```

**SQL Behind the scenes:**
```sql
CALL sp_report_per_courier();
```

### GET /api/reports/per-region
Get shipment report per region (uses Stored Procedure)

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "REGION": "Jakarta Selatan",
      "TOTAL_COURIER": 3,
      "TOTAL_PENGIRIMAN": 35,
      "TERKIRIM": 30,
      "DALAM_PENGIRIMAN": 3,
      "DIPROSES": 2,
      "AVG_DISTANCE_KM": 38.5,
      "AVG_DELIVERY_DAYS": 1.2
    },
    {
      "REGION": "Bandung",
      "TOTAL_COURIER": 2,
      "TOTAL_PENGIRIMAN": 28,
      "TERKIRIM": 25,
      "DALAM_PENGIRIMAN": 2,
      "DIPROSES": 1,
      "AVG_DISTANCE_KM": 115.8,
      "AVG_DELIVERY_DAYS": 2.1
    }
  ]
}
```

**SQL Behind the scenes:**
```sql
CALL sp_report_per_region();
```

### GET /api/reports/performance
Get query performance analysis with execution plans

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "query_stats": [
      {
        "query_name": "Track by tracking number",
        "sql": "SELECT * FROM SHIPMENTS WHERE tracking_number = :1",
        "index_used": "IDX_TRACKING_NUMBER",
        "operation": "INDEX RANGE SCAN",
        "cost": 2,
        "rows": 1
      },
      {
        "query_name": "Get by courier",
        "sql": "SELECT * FROM SHIPMENTS WHERE courier_id = :1",
        "index_used": "IDX_COURIER_ID",
        "operation": "INDEX RANGE SCAN",
        "cost": 3,
        "rows": 15
      }
    ],
    "index_usage": [
      {
        "index_name": "IDX_TRACKING_NUMBER",
        "table_name": "SHIPMENTS",
        "column_name": "TRACKING_NUMBER",
        "uniqueness": "NONUNIQUE",
        "status": "VALID"
      },
      {
        "index_name": "IDX_COURIER_ID",
        "table_name": "SHIPMENTS",
        "column_name": "COURIER_ID",
        "uniqueness": "NONUNIQUE",
        "status": "VALID"
      }
    ]
  }
}
```

### GET /api/reports/dashboard-stats
Get dashboard statistics (uses direct queries against SHIPMENTS, CUSTOMERS and COURIERS)

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "total_shipments": 45,
    "total_customers": 12,
    "total_couriers": 8,
    "status_breakdown": {
      "Diproses": 5,
      "Dalam Pengiriman": 12,
      "Terkirim": 28
    },
    "recent_shipments": [
      {
        "TRACKING_NUMBER": "TRK20250110000005",
        "CUSTOMER_NAME": "PT. Maju Jaya",
        "COURIER_NAME": "Ahmad Rizki",
        "DELIVERY_STATUS": "Dalam Pengiriman",
        "LAST_UPDATE": "2025-01-10T14:30:00.000Z"
      }
    ]
  }
}
```

**Note:** This API uses direct queries against the base tables (no materialized view)

---

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid input data",
  "details": {
    "field": "phone",
    "message": "Phone number must be valid"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "ORA-00001: unique constraint violated"
}
```

---

## 🧪 Testing Examples

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Get all customers
curl http://localhost:3000/api/customers

# Create customer
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PT. Test Company",
    "address": "Jl. Test No. 123",
    "phone": "021-11112222"
  }'

# Track shipment
curl http://localhost:3000/api/shipments/TRK20250110000001

# Assign courier (trigger will fire)
curl -X PUT http://localhost:3000/api/shipments/4/assign-courier \
  -H "Content-Type: application/json" \
  -d '{"courier_id": 1}'

# Get report per courier
curl http://localhost:3000/api/reports/per-courier
```

### Using JavaScript (Fetch)

```javascript
// Get all shipments
fetch('http://localhost:3000/api/shipments')
  .then(res => res.json())
  .then(data => console.log(data));

// Create shipment
fetch('http://localhost:3000/api/shipments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_id: 1,
    origin: 'Jakarta',
    destination: 'Bandung',
    distance_km: 150,
    service_type: 'Express'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));

// Assign courier (trigger auto-update)
fetch('http://localhost:3000/api/shipments/4/assign-courier', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ courier_id: 1 })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 📝 Notes

1. **Trigger Behavior**: Assigning a courier automatically updates status from "Diproses" to "Dalam Pengiriman" and logs the change.

2. **Function Usage**: `fn_estimasi_tiba` is called automatically during shipment creation to calculate delivery estimate.

3. **Materialized View**: removed — dashboard uses direct queries against the base tables for up-to-date data.

4. **Indexes**: All queries use proper indexes for optimal performance. Check execution plans via `/api/reports/performance`.

5. **Data Format**: All dates returned in ISO 8601 format (UTC).

6. **Pagination**: Use `limit` and `offset` for large datasets.

---

**🎉 Ready to integrate! Happy coding!**

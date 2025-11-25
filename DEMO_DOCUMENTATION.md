# Dokumentasi Demo Proyek Logistik UAS

1. **Tabel yang Dibuat**:
   - CUSTOMERS
   - COURIERS
   - ADMINS
   - SHIPMENTS
   - STATUS_LOG
   - SHIPMENT_REQUESTS
2. **Fungsi dan Trigger**:
   - Fungsi `fn_estimasi_tiba` untuk menghitung estimasi hari pengiriman.
   - Trigger `trg_update_shipment_status` untuk memperbarui status pengiriman secara otomatis.
   

## **Fitur Utama yang Ditunjukkan**

### **1. Struktur Database**
- **Tabel CUSTOMERS**:
  - Menyimpan data pelanggan, termasuk koordinat untuk pengiriman.
- **Tabel SHIPMENTS**:
  - Menyimpan data pengiriman, termasuk asal, tujuan, dan status pengiriman.
- **Tabel STATUS_LOG**:
  - Menyimpan log perubahan status pengiriman.
- **Fungsi `fn_estimasi_tiba`**:
  - Menghitung estimasi hari pengiriman berdasarkan jarak dan jenis layanan.
- **Trigger `trg_update_shipment_status`**:
  - Memperbarui status pengiriman secara otomatis saat kurir ditugaskan.

### **2. Backend**
- **Autentikasi**:
  - Login untuk pelanggan, kurir, dan admin.
- **Manajemen Pengiriman**:
  - Membuat, memperbarui, dan melacak pengiriman.

### **3. Frontend**
- **Dashboard**:
  - Dashboard untuk admin, pelanggan, dan kurir.
- **Pelacakan Pengiriman**:
  - Halaman untuk melacak status pengiriman secara publik.
- **Permintaan Pengiriman**:
  - Formulir untuk pelanggan membuat permintaan pengiriman baru.

---

## **Penjelasan Konseptual**

### **1. Penggunaan Indeks**
Indeks digunakan untuk meningkatkan performa query pada tabel yang memiliki data besar. Dalam kasus ini:
- **Indeks pada `SHIPMENTS`**:
  - `IDX_SHIPMENT_TRACKING_NUMBER` dan `IDX_TRACKING_NUMBER` digunakan untuk mempercepat pencarian pengiriman berdasarkan nomor pelacakan.
  - `IDX_DELIVERY_STATUS` digunakan untuk mempercepat query yang memfilter pengiriman berdasarkan status pengiriman.
- **Indeks pada `SHIPMENT_REQUESTS`**:
  - `IDX_SHIPMENT_REQ_CUSTOMER` mempercepat pencarian permintaan pengiriman berdasarkan pelanggan.
- **Indeks pada `ADMINS` dan `COURIERS`**:
  - Indeks pada email dan username digunakan untuk memastikan keunikan dan mempercepat autentikasi.

### **2. Penggunaan Fungsi**
Fungsi `fn_estimasi_tiba` digunakan untuk menghitung estimasi waktu pengiriman berdasarkan jarak dan jenis layanan. Konsep ini penting karena:
- **Efisiensi**: Fungsi ini memungkinkan perhitungan dilakukan langsung di database tanpa perlu logika tambahan di backend.
- **Reusabilitas**: Fungsi dapat digunakan di berbagai query atau prosedur tanpa perlu menduplikasi logika.

### **3. Penggunaan Trigger**
Trigger `trg_update_shipment_status` digunakan untuk memperbarui status pengiriman secara otomatis saat kurir ditugaskan. Konsep ini penting karena:
- **Otomatisasi**: Mengurangi kebutuhan untuk memperbarui status secara manual.
- **Integritas Data**: Memastikan bahwa setiap perubahan pada kurir langsung tercatat dalam log status.

---

### **4. Peran dalam Sistem**

#### **a. Pelanggan (CUSTOMERS)**
- **Hak Akses**:
  - Membuat permintaan pengiriman.
  - Melacak status pengiriman.
- **Hubungan**:
  - Terhubung dengan tabel `SHIPMENTS` melalui `customer_id`.
  - Terhubung dengan tabel `SHIPMENT_REQUESTS` untuk permintaan pengiriman.

#### **b. Kurir (COURIERS)**
- **Hak Akses**:
  - Melihat daftar pengiriman yang ditugaskan.
  - Memperbarui status pengiriman.
- **Hubungan**:
  - Terhubung dengan tabel `SHIPMENTS` melalui `courier_id`.

#### **c. Admin (ADMINS)**
- **Hak Akses**:
  - Admin membuat pengiriman
  - Mengelola data pelanggan, kurir, dan pengiriman.
  - Memproses permintaan pengiriman.
  - Menghasilkan laporan.

---

### **5. Hubungan Antar Peran**
- **Pelanggan dan Kurir**:
  - Pelanggan membuat permintaan pengiriman, yang kemudian diproses oleh admin dan ditugaskan ke kurir.
- **Admin dan Kurir**:
  - Admin bertanggung jawab untuk menugaskan pengiriman ke kurir.
- **Admin dan Pelanggan**:
  - Admin memproses permintaan pengiriman yang diajukan oleh pelanggan.

---

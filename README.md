# **Warung Kepo – Dream Higher**

*Aplikasi pencatatan transaksi dan inventori paling kepo se-Indonesia Raya.*

Warung Kepo membantu warung & UMKM mencatat transaksi dengan cepat lewat **barcode scanner**, **AI object detection**, dan **kasir manual**. Lengkap banget dengan komentar AI ala ibu-ibu fesbuk yang hobi kepo.

---

# 🎬 Short Demo (GIF)

> *Keren mantap nih*
> `[COMING SOON: LINK GIF]`

---

# ⚡ Quickstart

Cara tercepat mencobanya:

### **1. Clone Repository**

```bash
git clone https://github.com/yourusername/dream-higher.git
cd dream-higher
```

### **2. Setup Environment**

Linux/Mac:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Windows:

```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Edit `backend/.env` → isi:

* `KOLOSAL_API_KEY` (wajib)
* `OPENAI_API_KEY` (opsional, buat TTS)

### **3. Install Dependencies & Setup DB**

```bash
cd backend
npm install
npx prisma db push
npm run seed
```

Frontend:

```bash
cd frontend
npm install
```

### **4. Run**

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Aplikasi terbuka di: **[http://localhost:5173](http://localhost:5173)**

---

# ✨ Feature List (Singkat aje nih)

### **📦 1. Multi-Mode Scan**

* **Barcode Scanner:** Pake kamera HP/Laptop, auto detect.
* **AI Object Detection:** Kamera gerak → AI nebak produknya (pakai Kolosal).
* **Kasir Manual:** Tinggal klik dari katalog.

### **💸 2. Dua Jenis Transaksi**

* **OUT / Penjualan (ke pelanggan)**
* **IN / Pembelian (ke supplier)**

### **📊 3. Dashboard & Statistik**

* Grafik revenue 30 hari
* Barang paling laris
* Breakdown kategori
* Low stock alert

### **🧾 4. Sistem Struk**

* Preview → Print
* Format Rupiah
* Detail qty × harga

### **🗣️ 5. Warung Kepo (AI)**

* Komentar AI ala ibu-ibu fesbuk
* Bisa auto suara (TTS)
* Muncul setiap transaksi selesai

### **🛒 6. Manajemen Produk**

* Scan buat cek produk
* Kalau belum ada → tambah produk
* Beda jelas: harga modal vs harga jual

---

# 🚀 Impact

Salah satu tantangan besar untuk usaha kecil di Indonesia adalah pencatatan inventori dan transaksi yang masih manual. Banyak warung masih mengandalkan buku catatan, ingatan, dan doa—yang sayangnya sering berakhir dengan salah hitung, stok hilang entah ke mana, atau baru sadar barang habis saat pelanggan sudah datang.

**Warung Kepo hadir sebagai solusi yang praktis dan mudah dipakai.**
Cukup scan barang, transaksi langsung tercatat rapi. Pemilik usaha tidak perlu ribet menulis satu-satu.

Dengan fitur **AI object detection** dan **analitik otomatis**, UMKM bisa:
* tahu barang mana yang paling laris,
* kapan harus restock,
* dan mencegah kerugian diam-diam yang sering terjadi.

Hasilnya?
Usaha lebih efisien, keputusan lebih tepat, dan pemilik warung bisa fokus jualan — bukan sibuk mengecek catatan yang hilang dibawa angin.

---

# 🤝 Contribution Guide

Mau kontribusi? Boleh banget!
Cukup kontak [Dyas](https://linkedin.com/in/drestanto) langsung.
(Sering online, fast response, kadang sambil sambil ngeteh.)

---

# 🪪 License

MIT License: silakan dipakai, dimodifikasi, di-fork, dicustom jadi *Warung Auto Kaya* pun boleh.

---

# 🙌 Attribution

Proyek ini tidak akan jalan tanpa dukungan dari:

* **Imphnen** – organizer hackathon tercinta
* **Kolosal AI** – penyedia AI detection & chat
* **OpenAI** – text-to-speech buat bikin suara AI ibu-ibu kepo

---

# 📚 Docs

Semua dokumentasi ada di sini: **README ini** \
(Ga usah buka Notion, Google Docs, atau kitab kuning.) \
Kecuali lu mau lebih detil, bisa buka [dokumen teknis](./TECHNICAL_README.md)
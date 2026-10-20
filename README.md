# Qentral

**Qentral** adalah layanan terpusat (*Centralized Job Processing Engine*) untuk penerimaan, penjadwalan, dan pemrosesan tugas latar belakang (*background tasks*) berbasis **Bun**, **Hono**, **BullMQ**, dan **Redis**.

Dirancang dengan pola **Modular Monolith (Single Codebase, Multi-Process Runtime)** untuk memisahkan proses HTTP Web API dan Worker Engine tanpa kerumitan arsitektur banyak repositori.

---

## 📚 Dokumentasi Lengkap

* **[PRD.md](PRD.md)**: Product Requirement Document — latar belakang, sasaran, kebutuhan fungsional & non-fungsional, serta roadmap.
* **[ARCHITECTURE.md](ARCHITECTURE.md)**: Desain arsitektur teknis, struktur folder modular, kontrak API, dan konfigurasi deployment bare-metal (PM2).
* **[TDD_RULES.md](TDD_RULES.md)**: Protokol ketat pengembangan TDD (*Red-Green-Refactor*) untuk AI Coding Agent.
* **[TEST_PLAN.md](TEST_PLAN.md)**: Matriks skenario uji unit & integrasi yang harus dipenuhi oleh implementasi.

---

## ✨ Fitur Utama

* **HTTP REST API Ingestion**: Endpoint universal bagi layanan apa pun (PHP, Python, Go, Frontend) untuk mem-publish job ke antrean via HTTP.
* **Bull-Board Dashboard**: Antarmuka web visual di `/ui` untuk memantau status antrean (*waiting*, *active*, *completed*, *failed*), melihat log, serta melakukan aksi manual (*retry/pause/delete*).
* **Dedicated Worker Cluster**: Pemroses job berjalan di proses terisolasi sehingga tugas komputasi berat tidak menghambat respons server web.
* **Bun & TypeScript Native**: Eksekusi instan tanpa perlu build step atau konfigurasi TypeScript yang rumit.
* **Keamanan Bawaan**: Proteksi API Key untuk endpoint publik dan Basic Auth untuk Dashboard UI.

---

## 📋 Prasyarat Sistem

1. **[Bun](https://bun.sh/)** v1.0.0 atau lebih baru (Sistem Anda: `v1.4.3`).
2. **Redis Server** v6.x atau lebih baru (berjalan di port `6379`).

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Salin Konfigurasi Environment
```bash
cp .env.example .env
```
*Sesuaikan nilai di dalam `.env` jika kredensial Redis atau API Key Anda berbeda.*

### 2. Pasang Dependensi
```bash
bun install
```

### 3. Menjalankan di Mode Development
Aplikasi menggunakan pemisahan dua proses:

* **Terminal 1 (Menjalankan Web API & Bull-Board Dashboard)**:
  ```bash
  bun run dev:web
  ```
  * Akses API di: `http://localhost:3000`
  * Akses Dashboard di: `http://localhost:3000/ui`

* **Terminal 2 (Menjalankan Background Worker Engine)**:
  ```bash
  bun run dev:worker
  ```

---

## 📡 Contoh Mem-publish Job via HTTP

```bash
curl -X POST http://localhost:3000/api/v1/jobs/email-queue \
  -H "Content-Type: application/json" \
  -H "x-api-key: ganti-dengan-kunci-rahasia-anda" \
  -d '{
    "jobName": "send-welcome-email",
    "data": {
      "to": "user@example.com",
      "subject": "Selamat Datang!"
    },
    "options": {
      "delay": 0,
      "attempts": 3
    }
  }'
```

---

## 🛠️ Deployment Produksi (Tanpa Docker)

Untuk lingkungan produksi di server VPS atau Bare Metal Linux, gunakan **PM2**:

```bash
# Menjalankan seluruh proses web dan worker
pm2 start ecosystem.config.js

# Memeriksa status dan log
pm2 status
pm2 logs
```
*(Lihat rincian konfigurasi lengkap di [ARCHITECTURE.md](ARCHITECTURE.md)).*

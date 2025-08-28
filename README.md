# 📸 Sistem Rebutan Spot Foto

Sistem real-time untuk rebutan spot foto dengan antrian otomatis, pembatasan satu pilihan per kelas, dan panel admin untuk mengatur waktu booking.

## 🚀 Fitur Utama

- ✅ **Real-time Updates** - Menggunakan Supabase Realtime
- ✅ **Satu Kelas Satu Pilihan** - Setiap kelas hanya bisa memilih satu spot
- ✅ **Kapasitas Spot** - Setiap spot memiliki batas kapasitas
- ✅ **Sistem Antrian** - Otomatis mengatur antrian saat traffic tinggi
- ✅ **Admin Panel** - Atur waktu booking dan kelola data
- ✅ **Responsive Design** - Optimized untuk desktop dan mobile
- ✅ **Deploy Gratis** - Bisa di-host di Vercel secara gratis

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL + Realtime)
- **UI Icons**: Lucide React
- **Hosting**: Vercel (Gratis)

## 📋 Prerequisites

- Node.js 18+ 
- NPM atau Yarn
- Akun Supabase (gratis)
- Akun Vercel (gratis, untuk deployment)

## ⚡ Quick Start

### 1. Setup Supabase

1. Buat akun di [Supabase.com](https://supabase.com)
2. Buat project baru
3. Di SQL Editor, jalankan script dari `database/setup.sql`
4. Di Settings > API, copy URL dan anon key

### 2. Setup Project

```bash
# Clone atau extract project
cd spot-foto-rebutan

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
```

### 3. Configure Environment

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ADMIN_PASSWORD=admin123
MAX_CONCURRENT_USERS=100
QUEUE_UPDATE_INTERVAL=5000
```

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📚 Panduan Penggunaan

### Untuk User (Kelas)

1. **Akses Website** - Buka URL sistem
2. **Lihat Status** - Cek apakah booking sudah dibuka
3. **Pilih Spot** - Pilih kelas dari dropdown, lalu klik "Pilih Spot Ini"
4. **Konfirmasi** - Sistem akan konfirmasi booking berhasil
5. **Real-time** - Lihat update real-time saat kelas lain memilih

### Untuk Admin

1. **Login Admin** - Akses `/admin` dengan password `admin123`
2. **Atur Waktu** - Set waktu mulai booking di panel admin
3. **Monitor Status** - Lihat statistik real-time
4. **Kelola Data** - Tambah spot/kelas baru
5. **Reset System** - Reset semua booking jika diperlukan

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Supabase DB    │    │   Vercel Host   │
│                 │    │                  │    │                 │
│ • Frontend      │◄──►│ • PostgreSQL     │    │ • Serverless    │
│ • API Routes    │    │ • Realtime       │    │ • Edge Network  │
│ • Admin Panel   │    │ • Row Level Sec  │    │ • Auto Scale    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📊 Database Schema

### Tabel `spots`
- `id` - Primary key
- `name` - Nama spot foto
- `capacity` - Kapasitas maksimal kelas
- `chosen_by` - Array nama kelas yang sudah memilih

### Tabel `kelas`
- `id` - Primary key
- `name` - Nama kelas (unique)
- `spot_id` - Foreign key ke spots (nullable)

### Tabel `settings`
- `key` - Setting key (primary)
- `value` - Setting value
- Contoh: `booking_start_time`, `max_concurrent_users`

## 🔧 Konfigurasi Lanjutan

### Mengubah Kapasitas Spot

Ubah di admin panel atau langsung di database:

```sql
UPDATE spots SET capacity = 5 WHERE name = 'Pohon Cinta';
```

### Menambah Kelas Baru

Via admin panel atau insert manual:

```sql
INSERT INTO kelas (name) VALUES ('X-D');
```

### Mengatur Waktu Booking

Via admin panel atau update setting:

```sql
UPDATE settings SET value = '2025-08-27T14:00:00.000Z' 
WHERE key = 'booking_start_time';
```

## 🚀 Deployment ke Vercel

### Cara Otomatis

1. Push code ke GitHub
2. Login ke [Vercel.com](https://vercel.com)
3. Import project dari GitHub
4. Set environment variables di Vercel dashboard
5. Deploy!

### Environment Variables di Vercel

Tambahkan di Project Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
```

## 🔒 Keamanan

### Row Level Security (RLS)

Supabase RLS sudah diaktifkan dengan policy yang membolehkan semua operasi untuk demo. Untuk production:

1. Implementasi authentication yang proper
2. Buat RLS policies yang lebih ketat
3. Gunakan service role key hanya di server-side

### Admin Authentication

Password admin disimpan di environment variable. Untuk production:

1. Gunakan hash password
2. Implementasi session management
3. Tambahkan rate limiting

## 🎯 Optimasi Performance

### Database

- Index pada foreign keys sudah ada
- Realtime subscription optimal
- Atomic transactions untuk booking

### Frontend

- SSR untuk initial load
- Client-side caching
- Optimistic updates

### Queue System

- Simulasi antrian untuk traffic tinggi
- Configurable max concurrent users
- Auto-scaling di Vercel

## 🐛 Troubleshooting

### Connection Error

```
Error: Failed to connect to Supabase
```

**Solusi**: Cek environment variables dan koneksi internet

### Booking Failed

```
Error: Kelas sudah memilih spot
```

**Solusi**: Refresh halaman, sistem sudah real-time

### Admin Cannot Login

```
Error: Password salah
```

**Solusi**: Cek `ADMIN_PASSWORD` di environment variables

## 📈 Monitoring & Analytics

### Supabase Dashboard

- Monitor database performance
- Lihat real-time connections
- Check API usage

### Vercel Analytics

- Page load times
- User engagement
- Error tracking

## 🔮 Future Enhancements

- [ ] User authentication dengan email/SMS
- [ ] Notifikasi push/email
- [ ] Export data ke Excel/PDF
- [ ] Multi-event support
- [ ] Advanced queue management
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - bebas digunakan untuk keperluan apapun.

## 👨‍💻 Support

Jika ada pertanyaan atau butuh bantuan:

1. Buat issue di GitHub
2. Check troubleshooting guide
3. Review dokumentasi Supabase & Next.js

---

**Happy Coding! 🎉**

Dibuat dengan ❤️ menggunakan Next.js & Supabase

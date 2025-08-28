# 🚀 Panduan Deployment Lengkap

## 📋 Checklist Sebelum Deploy

- [ ] Akun Supabase sudah dibuat
- [ ] Database sudah di-setup dengan script SQL
- [ ] Environment variables sudah disiapkan
- [ ] Code sudah di-push ke GitHub
- [ ] Akun Vercel sudah dibuat

## 1️⃣ Setup Supabase Database

### Langkah 1: Buat Project Supabase

1. Kunjungi [supabase.com](https://supabase.com)
2. Klik "Start your project"
3. Sign up atau login
4. Klik "New Project"
5. Pilih organization (buat baru jika belum ada)
6. Isi:
   - **Name**: `spot-foto-rebutan`
   - **Database Password**: (generate password yang kuat)
   - **Region**: Singapore (atau terdekat)
7. Klik "Create new project"
8. Tunggu ~2 menit sampai project siap

### Langkah 2: Setup Database Schema

1. Di dashboard Supabase, klik **SQL Editor** di sidebar
2. Klik "New Query"
3. Copy-paste semua isi file `database/setup.sql`
4. Klik "Run" atau tekan Ctrl+Enter
5. Pastikan semua query berhasil (tidak ada error merah)

### Langkah 3: Get API Keys

1. Klik **Settings** di sidebar
2. Klik **API**
3. Copy dan simpan:
   - **Project URL** (misal: `https://abc123.supabase.co`)
   - **anon public** key
   - **service_role** key (klik "Reveal" dulu)

### Langkah 4: Enable Realtime

1. Klik **Database** di sidebar
2. Klik **Replication**
3. Pastikan semua tabel sudah ada di **Source Tables**:
   - `public.spots`
   - `public.kelas`
   - `public.settings`
4. Jika belum ada, klik toggle untuk enable

## 2️⃣ Setup GitHub Repository

### Langkah 1: Push Code ke GitHub

```bash
# Di folder project
git init
git add .
git commit -m "Initial commit - Sistem Rebutan Spot Foto"

# Buat repo di GitHub, lalu:
git remote add origin https://github.com/USERNAME/spot-foto-rebutan.git
git branch -M main
git push -u origin main
```

### Langkah 2: Buat Repository di GitHub

1. Login ke [github.com](https://github.com)
2. Klik "New repository"
3. Isi nama: `spot-foto-rebutan`
4. Set **Public** atau **Private**
5. Jangan centang "Initialize with README" (sudah ada)
6. Klik "Create repository"
7. Follow instruksi push code di atas

## 3️⃣ Deploy ke Vercel

### Langkah 1: Login ke Vercel

1. Kunjungi [vercel.com](https://vercel.com)
2. Klik "Sign up" atau "Login"
3. Login dengan GitHub account yang sama

### Langkah 2: Import Project

1. Di dashboard Vercel, klik "New Project"
2. Pilih repository `spot-foto-rebutan` dari GitHub
3. Klik "Import"

### Langkah 3: Configure Project

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `./` (default)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `npm install` (default)

### Langkah 4: Environment Variables

Klik "Environment Variables" dan tambahkan:

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abc123.supabase.co` | Ganti dengan URL Supabase Anda |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Anon key dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service role key dari Supabase |
| `ADMIN_PASSWORD` | `admin123` | Password admin (ganti yang aman) |

### Langkah 5: Deploy

1. Klik "Deploy"
2. Tunggu ~2-3 menit
3. Jika berhasil, akan dapat URL seperti: `https://spot-foto-rebutan.vercel.app`

## 4️⃣ Testing & Verifikasi

### Test Basic Functionality

1. **Akses Website**: Buka URL Vercel
2. **Test Loading**: Pastikan halaman load tanpa error
3. **Test Admin**: Akses `/admin` dan login
4. **Test Realtime**: Buka 2 tab, coba ubah data di admin, lihat update real-time

### Test Booking Flow

1. **Set Booking Time**: Di admin, set waktu booking ke waktu sekarang
2. **Test Booking**: Di tab user, coba pilih spot dengan kelas
3. **Test Restriction**: Coba booking lagi dengan kelas yang sama (harus gagal)
4. **Test Capacity**: Coba booking sampai kapasitas penuh

### Troubleshooting Common Issues

#### ❌ "Failed to fetch"
- **Penyebab**: Environment variables salah
- **Solusi**: Cek kembali SUPABASE_URL dan ANON_KEY

#### ❌ Build failed
- **Penyebab**: TypeScript errors atau missing dependencies
- **Solusi**: Run `npm run build` local, fix errors, push lagi

#### ❌ Database connection failed
- **Penyebab**: RLS policy atau table tidak ada
- **Solusi**: Jalankan ulang setup.sql, cek RLS policies

#### ❌ Admin login failed
- **Penyebab**: ADMIN_PASSWORD env variable tidak di-set
- **Solusi**: Tambah env variable di Vercel dashboard

## 5️⃣ Custom Domain (Opsional)

### Langkah 1: Beli Domain

1. Beli domain di provider (Namecheap, GoDaddy, dll)
2. Atau gunakan subdomain gratis

### Langkah 2: Setup di Vercel

1. Di project dashboard Vercel, klik **Domains**
2. Masukkan domain Anda
3. Follow instruksi DNS setup
4. Tunggu propagasi DNS (~24 jam max)

## 6️⃣ Production Optimizations

### Security Enhancements

```sql
-- Di Supabase SQL Editor, update RLS policies untuk production:

-- Hapus policy "allow all" dan buat yang lebih ketat
DROP POLICY "Allow all on spots" ON public.spots;
DROP POLICY "Allow all on kelas" ON public.kelas;
DROP POLICY "Allow all on settings" ON public.settings;

-- Policy untuk spots (read-only untuk user, write untuk authenticated)
CREATE POLICY "Allow read spots" ON public.spots FOR SELECT USING (true);
CREATE POLICY "Allow update spots" ON public.spots FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy untuk kelas
CREATE POLICY "Allow read kelas" ON public.kelas FOR SELECT USING (true);
CREATE POLICY "Allow update kelas" ON public.kelas FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy untuk settings (admin only)
CREATE POLICY "Allow read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow admin settings" ON public.settings FOR ALL USING (auth.role() = 'service_role');
```

### Performance Monitoring

1. **Vercel Analytics**: Enable di project settings
2. **Supabase Monitoring**: Monitor di dashboard
3. **Error Tracking**: Setup Sentry (optional)

### Backup Strategy

1. **Database Backup**: Supabase auto-backup (paid plan)
2. **Code Backup**: GitHub repository
3. **Manual Export**: Export data berkala via admin panel

## 7️⃣ Maintenance

### Regular Tasks

- [ ] Monitor Supabase usage (free tier: 500MB, 2GB bandwidth)
- [ ] Check Vercel function invocations (free tier: 100K/month)
- [ ] Backup database data
- [ ] Update dependencies (`npm update`)
- [ ] Monitor error logs

### Scaling Considerations

- **Database**: Upgrade Supabase plan jika data besar
- **Functions**: Upgrade Vercel plan jika traffic tinggi
- **CDN**: Consider Cloudflare untuk optimization

---

## 🎉 Selamat!

Website Anda sudah live dan siap digunakan! 

**URL Demo**: `https://spot-foto-rebutan.vercel.app`
**Admin Panel**: `https://spot-foto-rebutan.vercel.app/admin`

### Next Steps:

1. Share URL ke pengguna
2. Test dengan traffic real
3. Monitor performance
4. Gather feedback
5. Iterate dan improve

**Happy Deployment! 🚀**

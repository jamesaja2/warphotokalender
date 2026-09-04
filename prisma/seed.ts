import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding initial data...')

  // Insert Settings
  await prisma.settings.upsert({
    where: { key: 'booking_start_time' },
    update: {},
    create: {
      key: 'booking_start_time',
      value: '2025-01-01T00:00:00.000Z'
    }
  })

  // Insert Spots
  const spots = [
    { name: 'Pocin', capacity: 3 },
    { name: 'Panggung Pocin', capacity: 3 },
    { name: 'Depan Pos Satpam arah gedung A', capacity: 3 },
    { name: 'Perpustakaan', capacity: 3 },
    { name: 'Lapangan Dekat Dapur Guru', capacity: 3 },
    { name: 'Pohon samping Greenhouse', capacity: 3 },
    { name: 'Visi Misi', capacity: 3 },
    { name: 'Gazebo Rooftop Gedung D', capacity: 3 },
    { name: 'Pintu Gedung A', capacity: 3 },
    { name: 'Tangga gedung A', capacity: 3 },
    { name: 'Bawah Jembatan Ros', capacity: 3 },
    { name: 'Kursi Benedict room', capacity: 3 },
    { name: 'Panggung Benedict room', capacity: 3 }
  ]

  for (const spot of spots) {
    // Check if exists before creating
    const existing = await prisma.spot.findFirst({ where: { name: spot.name } })
    if (!existing) {
      await prisma.spot.create({ data: spot })
    }
  }

  // Insert Kelas
  const kelas = [
    'X-A', 'X-B', 'X-C', 'X-D', 'X-E', 'X-F', 'X-G', 'X-H', 'X-I', 'X-J', 'X-K', 'X-L', 'X-M',
    'XI-A1', 'XI-A2', 'XI-A3', 'XI-B1', 'XI-B2', 'XI-C1', 'XI-C2', 'XI-C3', 'XI-D1', 'XI-E1', 'XI-E2', 'XI-F1',
    'XII-A1', 'XII-A2', 'XII-A3', 'XII-A4', 'XII-A5', 'XII-B1', 'XII-B2', 'XII-C1', 'XII-C2', 'XII-D1', 'XII-D2', 'XII-E1', 'XII-F1'
  ]

  for (const k of kelas) {
    const existing = await prisma.kelas.findFirst({ where: { name: k } })
    if (!existing) {
      await prisma.kelas.create({ data: { name: k } })
    }
  }

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

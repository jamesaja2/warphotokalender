export async function getStudentInfo(email: string, fullName: string) {
  try {
    // 1. Ekstrak NIS dari email (contoh: u30894@s.smakstlouis1sby.sch.id -> 30894)
    const nisMatch = email.match(/^u?(\d+)@/i)
    if (!nisMatch) {
      throw new Error("Format email tidak dikenali. Harus mengandung NIS.")
    }
    const nis = nisMatch[1]

    // 2. Bersihkan nama dari kata "Siswa " (jika ada) dan ambil kata pertama untuk pencarian
    const cleanName = fullName.replace(/^Siswa\s+/i, '').trim()
    const firstName = cleanName.split(' ')[0]

    // 3. Fetch ke API Sekolah
    const response = await fetch(`https://cadangan.stlouislc.net/hadir/buatqr/search.php?name=${encodeURIComponent(firstName)}`, {
      headers: {
        'x-api-key': 'b1290a4f2d8e40f1a6c9e91a7123a5e6'
      }
    })
    
    if (!response.ok) throw new Error('API request failed')
    
    const students = await response.json()
    
    if (!Array.isArray(students) || students.length === 0) {
      throw new Error(`Siswa dengan nama ${firstName} tidak ditemukan.`)
    }

    // 4. Cocokkan berdasarkan NIS (no)
    const matchedStudent = students.find((s: any) => s.no === nis)
    
    if (!matchedStudent) {
      throw new Error(`NIS ${nis} tidak cocok dengan data siswa dari API.`)
    }

    // 5. Ekstrak Kelas dan Absen (contoh API: "XII B 2/ 17" atau "X - K/ 14")
    const [rawKelas, rawAbsen] = matchedStudent.kelas.split('/')
    const kelasPart = (rawKelas || '').trim()
    const absenPart = (rawAbsen || '').trim()

    // 6. Normalisasi Kelas untuk Database (contoh: "XII B 2" -> "XII-B2", "X - K" -> "X-K")
    let normalizedKelas = kelasPart
    const cleanKelas = kelasPart.replace(/[\s-]/g, '') // "XIIB2" atau "XK"
    // Regex must check XII first, then XI, then X to prevent greedy matching on just 'X'
    const match = cleanKelas.match(/^(XII|XI|X)(.*)$/i)
    
    if (match) {
      normalizedKelas = `${match[1].toUpperCase()}-${match[2].toUpperCase()}`
    }

    return {
      success: true,
      data: {
        nis: matchedStudent.no,
        name: matchedStudent.nama, // Nama asli dari API
        kelas_raw: kelasPart,
        kelas_db: normalizedKelas,
        absen: absenPart
      }
    }
  } catch (error: any) {
    console.error('Error in getStudentInfo:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

# 🔥 Sparkora Fire Challenge (Google Sheets)

| File | Fungsi |
|---|---|
| `index.html` | Game (dibuka customer dari QR di HP) |
| `tv/index.html` | Layar besar resto: QR + leaderboard live → buka `/tv` |
| `display.html` | Sama dengan layar TV (cadangan, `/display`) |
| `config.js` | **Satu-satunya file yang perlu diedit**: URL Google Sheet API, URL game, reward |
| `Code.gs` | Script untuk Google Sheet (dipaste di Apps Script) |
| `vercel.json` | Routing `/admin` |

Kalau `SHEET_API_URL` masih kosong, semuanya tetap jalan: leaderboard tersimpan di masing-masing HP, dan layar TV menampilkan DATA DEMO.

---

## 1. Siapkan Google Sheet (±10 menit)

1. Buat Google Sheet baru, misalnya **"Sparkora Fire Challenge – Data"**.
2. **Extensions → Apps Script** → hapus isi `Code.gs` bawaan → paste seluruh isi `Code.gs` dari folder ini → **Save**.
3. Di toolbar pilih fungsi **setup** → **Run** → izinkan akses (Advanced → Go to project → Allow).
   Sheet **Scores** dan **Rewards** akan muncul otomatis.
4. **Deploy → New deployment** → ⚙️ pilih **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   → **Deploy** → copy **Web app URL** (berakhiran `/exec`).
5. Tes: buka URL itu + `?action=ping` di browser. Harus muncul `{"ok":true,...}`.
6. Paste URL ke `config.js`:
   ```js
   SHEET_API_URL: 'https://script.google.com/macros/s/AKfy..../exec',
   ```

⚠️ Kalau nanti `Code.gs` diubah: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. URL tetap sama.

## 2. Deploy ke Vercel (project sparkoraminigame)

```bash
cd sparkora-fire-challenge
vercel --prod
```
Pilih **Link to existing project → sparkoraminigame**. Kalau lewat GitHub, ganti semua file di repo lalu push.

Cek:
- https://sparkoraminigame.vercel.app/ → game
- https://sparkoraminigame.vercel.app/tv → layar besar
- https://sparkoraminigame.vercel.app/admin (PIN 2580) → tulisan harus **ONLINE (Google Sheets)**

## 3. Layar besar resto

1. Chrome → `https://sparkoraminigame.vercel.app/tv` → klik sekali (fullscreen + layar tidak sleep).
2. Update otomatis tiap ±8 detik (ditambah waktu Google Sheets ±1–3 detik). Ada skor baru → banner "🔥 NAMA scored ...".
3. Menampilkan juara **hari ini** (zona waktu Jakarta), reset otomatis tengah malam.
4. Internet putus → muncul **RECONNECTING**, lalu lanjut sendiri.
5. Windows kiosk: `chrome.exe --kiosk https://sparkoraminigame.vercel.app/tv`

## Mengelola data di Google Sheet

- **Scores**: 1 baris = 1 skor. Nama tidak pantas → ketik **X** di kolom **Hide**; langsung hilang dari HP & TV (±5–10 detik). Reset → hapus barisnya.
- **Rewards**: semua kode reward yang keluar (kode, hadiah, nama, skor, jam). Staff bisa cocokkan kode di HP customer, lalu centang **Redeemed**.
- Ganti reward/threshold → edit `config.js`, deploy ulang.

## Beberapa outlet (opsional)

`/tv?outlet=pik` → QR di TV otomatis jadi `...vercel.app/?outlet=pik`; skor tercatat dengan kolom Outlet = pik dan hanya tampil di TV outlet itu.

## Catatan

- Submit nama di HP langsung tampil (<1 detik): leaderboard sudah diambil diam-diam selama pemain mengetik nama, lalu skor dikirim ke Google Sheets di belakang layar. Kalau sinyal jelek, skor disimpan dulu di HP dan dikirim ulang otomatis.
- TV update ±8–12 detik setelah submit (batasan kecepatan Google Sheets).
- Script menolak skor tidak wajar (> 8.000, waktu < 3 detik, dll.) dan membersihkan nama dari formula (`=`, `+`, `-`, `@`). Orang yang paham teknis tetap bisa mengirim skor palsu yang masih "wajar" — untuk Special Merchandise, cocokkan kode di HP dengan sheet **Rewards**.
- Batas 1 reward/HP/hari masih dicek di HP (bisa dilewati dengan clear browser data).

## Menjalankan di laptop

```bash
cd sparkora-fire-challenge
python3 -m http.server 8080
```
Game: http://localhost:8080 · TV: http://localhost:8080/display.html

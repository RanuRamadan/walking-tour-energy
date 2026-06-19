# TODO - Pemisahan tiap Event di Firestore

## Assumption (sementara)
**Event aktif untuk build ini:** `Kelana Energi` (eventId di-hardcode)

## Rencana (Opsi A: nested per event)
Struktur target:
- `events/{eventId}/sessions/{sessionId}/observations/{observationId}`

## Langkah
1. Tentukan `eventId` untuk `Kelana Energi` (sementara hardcode).
2. Update `src/app/page.tsx`
   - saat `saveGroup()`: simpan session ke `events/{eventId}/sessions/...`
   - saat `addMarker()`: tulis observasi ke `events/{eventId}/sessions/{sessionId}/observations/...`
   - simpan `sessionId` ke `localStorage` agar halaman lain bisa baca
3. Update `src/app/admin/page.tsx`
   - ganti query realtime: ambil observations dari `events/{eventId}/sessions/.../observations`.
4. Update `src/app/hasil/page.tsx`
   - ganti `getDocs` agar ambil observations dari nested path sesuai `eventId`.
5. Pastikan UI tetap jalan dan typecheck/build sukses.
6. (Opsional) Migration data lama `observations` -> path baru.


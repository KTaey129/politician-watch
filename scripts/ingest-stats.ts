// Ingests bill counts per politician from the National Assembly bill proposal API.
// Per-member vote/attendance APIs are not available via open.assembly.go.kr,
// so vote_participation_rate and attendance_rate remain null.
import { assemblyFetchAll, supabaseAdmin } from './_lib.ts'

type BillRow = {
  RST_MONA_CD: string   // primary proposer's MONA code (= assembly_id)
  BILL_NAME: string
  PROPOSE_DT: string
}

async function main() {
  console.log('Fetching all 22nd Assembly bills...')
  const bills = await assemblyFetchAll<BillRow>('nzmimeepazxkubdpn', { AGE: '22' })
  console.log(`\nTotal bills fetched: ${bills.length}`)

  // Count bills per RST_MONA_CD (primary proposer)
  const billCountByMona: Record<string, number> = {}
  for (const b of bills) {
    if (b.RST_MONA_CD) {
      billCountByMona[b.RST_MONA_CD] = (billCountByMona[b.RST_MONA_CD] ?? 0) + 1
    }
  }

  // Load all politicians from DB
  const { data: politicians, error: fetchErr } = await supabaseAdmin
    .from('politician')
    .select('id, assembly_id, name_ko')

  if (fetchErr || !politicians?.length) {
    console.error('Failed to load politicians. Run ingest-politicians first.')
    process.exit(1)
  }

  console.log(`\nUpserting stats for ${politicians.length} politicians...`)

  const stats = politicians.map(pol => ({
    politician_id: pol.id,
    bill_count: billCountByMona[pol.assembly_id] ?? 0,
    vote_participation_rate: null,  // no per-member vote API available
    attendance_rate: null,          // no attendance API available
    speech_count: 0,
  }))

  const { error } = await supabaseAdmin
    .from('stats')
    .upsert(stats, { onConflict: 'politician_id' })

  if (error) {
    console.error('Upsert failed:', error.message)
    process.exit(1)
  }

  // Print a quick summary
  const withBills = stats.filter(s => s.bill_count > 0)
  const top5 = [...stats].sort((a, b) => b.bill_count - a.bill_count).slice(0, 5)
  console.log(`\nDone. ${withBills.length}/${politicians.length} politicians have at least 1 bill.`)
  console.log('Top 5 by bill count:')
  for (const s of top5) {
    const pol = politicians.find(p => p.id === s.politician_id)
    console.log(`  ${pol?.name_ko}: ${s.bill_count} bills`)
  }
}

main()

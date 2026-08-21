import { assemblyFetchAll, supabaseAdmin } from './_lib.ts'

type MemberRow = {
  NAAS_CD: string
  NAAS_NM: string
  PLPT_NM: string
  ELECD_NM: string | null
  BLNG_CMIT_NM: string | null
  GTELT_ERACO: string
  NAAS_PIC: string | null
  RLCT_DIV_NM: string | null
  DTY_NM: string | null  // 직위명 — null means no longer serving
}

// PLPT_NM stores full party history as slash-separated values e.g. "미래통합당/국민의힘"
// Take the last segment to get the current party.
// Satellite parties from the 22nd election are normalized to their parent party.
const PARTY_ALIASES: Record<string, string> = {
  '더불어민주연합': '더불어민주당',
  '국민의미래': '국민의힘',
}

function parseParty(plpt: string): string {
  const current = (plpt ?? '').split('/').at(-1)?.trim() ?? ''
  return PARTY_ALIASES[current] ?? current
}

function parseTermCount(gtelt: string): number {
  return (gtelt.match(/제\d+대/g) ?? []).length || 1
}

async function main() {
  console.log('Fetching all members from ALLNAMEMBER (all assemblies)...')
  const all = await assemblyFetchAll<MemberRow>('ALLNAMEMBER')

  // Filter to currently serving 22nd Assembly members only
  // DTY_NM is null for former members (resigned, convicted, replaced by by-election)
  const members22 = all.filter(r => r.GTELT_ERACO?.includes('제22대') && r.DTY_NM !== null)
  console.log(`\n22nd Assembly members found: ${members22.length}`)

  if (members22.length === 0) {
    console.error('No 22nd assembly members found — check API response.')
    process.exit(1)
  }

  const politicians = members22.map(r => ({
    assembly_id: r.NAAS_CD,
    name_ko: r.NAAS_NM,
    party: parseParty(r.PLPT_NM),
    district: (r.ELECD_NM ?? '비례대표').split('/').at(-1)?.trim() ?? '비례대표',
    term_count: parseTermCount(r.GTELT_ERACO ?? ''),
    committee: r.BLNG_CMIT_NM
      ? r.BLNG_CMIT_NM.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    photo_url: r.NAAS_PIC || null,
  }))

  console.log('\nUpserting into politician table...')
  const { error } = await supabaseAdmin
    .from('politician')
    .upsert(politicians, { onConflict: 'assembly_id' })

  if (error) {
    console.error('Upsert failed:', error.message)
    process.exit(1)
  }

  // Remove stale rows (former members replaced by by-elections or otherwise departed)
  const currentIds = politicians.map(p => p.assembly_id)
  const { data: stale } = await supabaseAdmin
    .from('politician')
    .select('id')
    .not('assembly_id', 'in', `(${currentIds.join(',')})`)

  if (stale?.length) {
    const staleIds = stale.map(r => r.id)
    await supabaseAdmin.from('stats').delete().in('politician_id', staleIds)
    await supabaseAdmin.from('vote_record').delete().in('politician_id', staleIds)
    await supabaseAdmin.from('promise').delete().in('politician_id', staleIds)
    await supabaseAdmin.from('criminal_record').delete().in('politician_id', staleIds)
    await supabaseAdmin.from('pro_japanese_ancestor').delete().in('politician_id', staleIds)
    await supabaseAdmin.from('politician').delete().in('id', staleIds)
    console.log(`Removed ${staleIds.length} stale former-member rows.`)
  }

  console.log(`Done — ${politicians.length} current politicians in DB.`)
}

main()

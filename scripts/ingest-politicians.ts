import { assemblyFetchAll, supabaseAdmin } from './_lib.ts'

type MemberRow = {
  NAAS_CD: string        // 의원 고유코드 → assembly_id
  NAAS_NM: string        // 이름 (한글)
  PLPT_NM: string        // 정당명
  ELECD_NM: string | null  // 지역구명 (비례대표는 "비례대표")
  BLNG_CMIT_NM: string | null  // 소속 위원회 (쉼표 구분)
  GTELT_ERACO: string    // 당선된 대수 e.g. "제22대" or "제20대, 제22대"
  NAAS_PIC: string | null // 사진 URL
  RLCT_DIV_NM: string | null  // 초선/재선/3선 ...
}

function parseTermCount(gtelt: string): number {
  // Count occurrences of "대" as a proxy for number of terms served
  return (gtelt.match(/제\d+대/g) ?? []).length || 1
}

async function main() {
  console.log('Fetching all members from ALLNAMEMBER (all assemblies)...')
  const all = await assemblyFetchAll<MemberRow>('ALLNAMEMBER')

  // Filter to 22nd assembly only
  const members22 = all.filter(r => r.GTELT_ERACO?.includes('제22대'))
  console.log(`\n22nd Assembly members found: ${members22.length}`)

  if (members22.length === 0) {
    console.error('No 22nd assembly members found — check API response.')
    process.exit(1)
  }

  const politicians = members22.map(r => ({
    assembly_id: r.NAAS_CD,
    name_ko: r.NAAS_NM,
    party: r.PLPT_NM ?? '',
    district: r.ELECD_NM ?? '비례대표',
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

  console.log(`Done — ${politicians.length} politicians upserted.`)
}

main()

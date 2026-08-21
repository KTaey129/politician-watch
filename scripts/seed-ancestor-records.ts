import { readFileSync } from 'fs'
import { supabaseAdmin } from './_lib.ts'

// Manually-curated entries only — see scripts/data/pro-japanese-ancestors.example.json
// for the expected shape. Every entry must cite a source; this script does not
// attempt to infer or match ancestry automatically.
type AncestorEntry = {
  politician_name: string
  ancestor_name: string
  relation: string
  activity_summary: string
  designated_by?: string
  source?: string
  source_url?: string
}

async function main() {
  const path = 'scripts/data/pro-japanese-ancestors.json'
  const entries: AncestorEntry[] = JSON.parse(readFileSync(path, 'utf-8'))

  if (entries.length === 0) {
    console.log('No entries in pro-japanese-ancestors.json — nothing to seed.')
    return
  }

  const names = [...new Set(entries.map(e => e.politician_name))]
  const { data: politicians, error: fetchError } = await supabaseAdmin
    .from('politician')
    .select('id, name_ko')
    .in('name_ko', names)

  if (fetchError) {
    console.error('Failed to look up politicians:', fetchError.message)
    process.exit(1)
  }

  const idByName = new Map(politicians!.map(p => [p.name_ko, p.id]))
  const missing = names.filter(n => !idByName.has(n))
  if (missing.length) {
    console.error(`No matching politician found for: ${missing.join(', ')}`)
    process.exit(1)
  }

  const rows = entries.map(e => ({
    politician_id: idByName.get(e.politician_name)!,
    ancestor_name: e.ancestor_name,
    relation: e.relation,
    activity_summary: e.activity_summary,
    designated_by: e.designated_by ?? '친일반민족행위진상규명위원회',
    source: e.source ?? null,
    source_url: e.source_url ?? null,
  }))

  const { error } = await supabaseAdmin
    .from('pro_japanese_ancestor')
    .upsert(rows, { onConflict: 'politician_id,ancestor_name' })

  if (error) {
    console.error('Upsert failed:', error.message)
    process.exit(1)
  }

  console.log(`Done — ${rows.length} ancestor record(s) seeded.`)
}

main()

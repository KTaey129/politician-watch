import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!ASSEMBLY_API_KEY) throw new Error('ASSEMBLY_API_KEY missing in .env.local')
if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing in .env.local')
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing in .env.local')

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const BASE = 'https://open.assembly.go.kr/portal/openapi'

type Params = Record<string, string | number>

export async function assemblyFetch<T>(endpoint: string, params: Params = {}): Promise<{ rows: T[]; total: number }> {
  const url = new URL(`${BASE}/${endpoint}`)
  url.searchParams.set('KEY', ASSEMBLY_API_KEY!)
  url.searchParams.set('Type', 'json')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)

  const json = await res.json()

  // Response: { [endpoint]: [ {head:[{list_total_count:N},{RESULT:{...}}]}, {row:[...]} ] }
  const wrapper = json[endpoint]
  if (!Array.isArray(wrapper)) return { rows: [], total: 0 }

  const headSection = wrapper.find((s: Record<string, unknown>) => 'head' in s)
  const total = (headSection?.head?.[0] as Record<string, number> | undefined)?.list_total_count ?? 0

  const rowSection = wrapper.find((s: Record<string, unknown>) => 'row' in s)
  const rows: T[] = rowSection?.row
    ? Array.isArray(rowSection.row) ? rowSection.row : [rowSection.row]
    : []

  return { rows, total }
}

export async function assemblyFetchAll<T>(endpoint: string, params: Params = {}): Promise<T[]> {
  const PAGE_SIZE = 100
  const results: T[] = []
  let page = 1

  while (true) {
    const { rows, total } = await assemblyFetch<T>(endpoint, { ...params, pIndex: page, pSize: PAGE_SIZE })
    results.push(...rows)
    if (page === 1) process.stdout.write(`  total: ${total}\n`)
    process.stdout.write(`  page ${page}: ${rows.length} rows (fetched: ${results.length})\n`)
    if (rows.length < PAGE_SIZE) break
    page++
    await sleep(300)
  }

  return results
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Politician = {
  id: string
  assembly_id: string
  name_ko: string
  party: string
  district: string
  term_count: number
  committee: string[]
  photo_url: string | null
}

export type VoteRecord = {
  id: string
  politician_id: string
  bill_name: string
  bill_id: string | null
  result: '찬성' | '반대' | '기권' | '불참'
  session_date: string
  session_no: string | null
}

export type Promise = {
  id: string
  politician_id: string
  content: string
  category: string
  election_year: number
  source_url: string | null
}

export type CriminalRecord = {
  id: string
  politician_id: string
  charge: string
  verdict: string
  verdict_date: string | null
  source: string | null
  source_url: string | null
}

export type Stats = {
  id: string
  politician_id: string
  attendance_rate: number | null
  bill_count: number
  vote_participation_rate: number | null
  speech_count: number
}

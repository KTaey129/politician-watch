import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import PoliticianTabs from '@/components/politician-tabs'

const partyColors: Record<string, string> = {
  '더불어민주당': 'bg-blue-100 text-blue-800',
  '국민의힘': 'bg-red-100 text-red-800',
  '조국혁신당': 'bg-teal-100 text-teal-800',
}

async function getPolitician(id: string) {
  const { data } = await supabase
    .from('politician')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

async function getStats(politicianId: string) {
  const { data } = await supabase
    .from('stats')
    .select('*')
    .eq('politician_id', politicianId)
    .single()
  return data
}

async function getVotes(politicianId: string) {
  const { data } = await supabase
    .from('vote_record')
    .select('*')
    .eq('politician_id', politicianId)
    .order('session_date', { ascending: false })
  return data ?? []
}

async function getPromises(politicianId: string) {
  const { data } = await supabase
    .from('promise')
    .select('*')
    .eq('politician_id', politicianId)
    .order('election_year', { ascending: false })
  return data ?? []
}

async function getCriminalRecords(politicianId: string) {
  const { data } = await supabase
    .from('criminal_record')
    .select('*')
    .eq('politician_id', politicianId)
    .order('verdict_date', { ascending: false })
  return data ?? []
}

async function getAncestorRecords(politicianId: string) {
  const { data } = await supabase
    .from('pro_japanese_ancestor')
    .select('*')
    .eq('politician_id', politicianId)
  return data ?? []
}

export default async function PoliticianPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [politician, stats, votes, promises, criminalRecords, ancestorRecords] = await Promise.all([
    getPolitician(id),
    getStats(id),
    getVotes(id),
    getPromises(id),
    getCriminalRecords(id),
    getAncestorRecords(id),
  ])

  if (!politician) notFound()

  const badgeClass = partyColors[politician.party] ?? 'bg-gray-100 text-gray-700'

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← 목록으로
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {/* Profile header */}
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-start gap-4">
            {politician.photo_url ? (
              <Image
                src={politician.photo_url}
                alt={politician.name_ko}
                width={72}
                height={72}
                className="shrink-0 rounded-full object-cover object-top"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-400">
                {politician.name_ko[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{politician.name_ko}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                  {politician.party}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500">{politician.district} · {politician.term_count}선</div>
              {politician.committee.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {politician.committee.map((c: string) => (
                    <span key={c} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: '출석률', value: stats.attendance_rate != null ? `${stats.attendance_rate}%` : '-' },
              { label: '발의 법안', value: `${stats.bill_count}건` },
              { label: '표결 참여율', value: stats.vote_participation_rate != null ? `${stats.vote_participation_rate}%` : '-' },
              { label: '발언 횟수', value: `${stats.speech_count}회` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border bg-white p-4 text-center">
                <div className="text-xl font-bold">{value}</div>
                <div className="mt-0.5 text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <PoliticianTabs
            votes={votes}
            promises={promises}
            criminalRecords={criminalRecords}
            ancestorRecords={ancestorRecords}
          />
        </div>
      </div>
    </main>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Politician, Stats } from '@/lib/supabase'

export type PoliticianWithStats = Politician & { stats: Stats | Stats[] | null }

const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': 'bg-blue-100 text-blue-800',
  '국민의힘': 'bg-red-100 text-red-800',
  '조국혁신당': 'bg-teal-100 text-teal-800',
  '개혁신당': 'bg-orange-100 text-orange-800',
  '진보당': 'bg-purple-100 text-purple-800',
}

function partyBadge(party: string) {
  return PARTY_COLORS[party] ?? 'bg-gray-100 text-gray-700'
}

type SortKey = 'name' | 'bills_desc' | 'bills_asc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: '이름순' },
  { value: 'bills_desc', label: '발의안 많은순' },
  { value: 'bills_asc', label: '발의안 적은순' },
]

// Major parties shown as fixed filter chips; others collapsed under "기타"
const MAJOR_PARTIES = ['더불어민주당', '국민의힘', '조국혁신당', '개혁신당', '진보당']

export default function PoliticianGrid({ politicians }: { politicians: PoliticianWithStats[] }) {
  const [search, setSearch] = useState('')
  const [party, setParty] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('name')

  const parties = useMemo(() => {
    const seen = new Set<string>()
    for (const p of politicians) if (p.party) seen.add(p.party)
    // Major parties first (if present), then others
    const major = MAJOR_PARTIES.filter(p => seen.has(p))
    const others = [...seen].filter(p => !MAJOR_PARTIES.includes(p)).sort()
    return [...major, ...others]
  }, [politicians])

  const filtered = useMemo(() => {
    let list = politicians

    if (search.trim()) {
      const q = search.trim()
      list = list.filter(
        p => p.name_ko.includes(q) || p.district.includes(q)
      )
    }

    if (party) {
      list = list.filter(p => p.party === party)
    }

    list = [...list].sort((a, b) => {
      const sa = Array.isArray(a.stats) ? a.stats[0] : a.stats
      const sb = Array.isArray(b.stats) ? b.stats[0] : b.stats
      if (sort === 'bills_desc') return (sb?.bill_count ?? 0) - (sa?.bill_count ?? 0)
      if (sort === 'bills_asc') return (sa?.bill_count ?? 0) - (sb?.bill_count ?? 0)
      return a.name_ko.localeCompare(b.name_ko, 'ko')
    })

    return list
  }, [politicians, search, party, sort])

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="이름 또는 지역구 검색..."
          className="w-full rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Party filter + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setParty(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              party === null
                ? 'bg-gray-900 text-white'
                : 'bg-white border text-gray-600 hover:border-gray-400'
            }`}
          >
            전체
          </button>
          {parties.map(p => (
            <button
              key={p}
              onClick={() => setParty(prev => (prev === p ? null : p))}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                party === p
                  ? 'bg-gray-900 text-white'
                  : `${partyBadge(p)} hover:opacity-80`
              }`}
            >
              {p}
            </button>
          ))}

          <div className="ml-auto">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="rounded-lg border bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="mb-4 text-sm text-gray-400">
        {filtered.length === politicians.length
          ? `총 ${politicians.length}명`
          : `${filtered.length}명 / 전체 ${politicians.length}명`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => {
            const stat = Array.isArray(p.stats) ? p.stats[0] : p.stats
            return (
              <Link
                key={p.id}
                href={`/${p.id}`}
                className="group flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg font-semibold transition-colors group-hover:text-blue-600">
                    {p.name_ko}
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${partyBadge(p.party)}`}>
                    {p.party}
                  </span>
                </div>

                <div className="text-sm text-gray-500">{p.district}</div>

                {stat && (
                  <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
                    <div>
                      <div className="text-base font-bold text-gray-900">
                        {stat.attendance_rate != null ? `${stat.attendance_rate}%` : '-'}
                      </div>
                      <div className="text-xs text-gray-400">출석률</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900">{stat.bill_count}</div>
                      <div className="text-xs text-gray-400">발의안</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900">
                        {stat.vote_participation_rate != null ? `${stat.vote_participation_rate}%` : '-'}
                      </div>
                      <div className="text-xs text-gray-400">표결참여</div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-400">{p.term_count}선</div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

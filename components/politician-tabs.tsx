'use client'

import { useState } from 'react'
import type { VoteRecord, Promise as PoliticianPromise, CriminalRecord } from '@/lib/supabase'

const voteColors: Record<string, string> = {
  '찬성': 'bg-blue-100 text-blue-700',
  '반대': 'bg-red-100 text-red-700',
  '기권': 'bg-yellow-100 text-yellow-700',
  '불참': 'bg-gray-100 text-gray-500',
}

const tabs = ['표결기록', '공약목록', '전과기록'] as const
type Tab = typeof tabs[number]

export default function PoliticianTabs({
  votes,
  promises,
  criminalRecords,
}: {
  votes: VoteRecord[]
  promises: PoliticianPromise[]
  criminalRecords: CriminalRecord[]
}) {
  const [active, setActive] = useState<Tab>('표결기록')

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              active === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab}
            {tab === '전과기록' && criminalRecords.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600">
                {criminalRecords.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="py-6">
        {active === '표결기록' && (
          <div className="space-y-2">
            {votes.length === 0 && <p className="text-sm text-gray-400">표결 기록이 없습니다.</p>}
            {votes.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{v.bill_name}</div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {v.session_date} {v.session_no && `· 제${v.session_no}회`}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${voteColors[v.result] ?? 'bg-gray-100 text-gray-500'}`}>
                  {v.result}
                </span>
              </div>
            ))}
          </div>
        )}

        {active === '공약목록' && (
          <div className="space-y-3">
            {promises.length === 0 && <p className="text-sm text-gray-400">공약 정보가 없습니다.</p>}
            {promises.map((p) => (
              <div key={p.id} className="rounded-lg border bg-white px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {p.category}
                  </span>
                  <div>
                    <p className="text-sm">{p.content}</p>
                    <p className="mt-1 text-xs text-gray-400">{p.election_year}년 공약</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {active === '전과기록' && (
          <div className="space-y-3">
            {criminalRecords.length === 0 && (
              <p className="text-sm text-gray-400">전과 기록이 없습니다.</p>
            )}
            {criminalRecords.map((c) => (
              <div key={c.id} className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-red-900">{c.charge}</div>
                    <div className="mt-1 text-sm text-red-700">{c.verdict}</div>
                    {c.source && (
                      <div className="mt-1 text-xs text-red-400">{c.source} · {c.verdict_date}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

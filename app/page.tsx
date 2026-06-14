import { supabase } from '@/lib/supabase'
import PoliticianGrid from '@/components/politician-grid'
import type { PoliticianWithStats } from '@/components/politician-grid'

async function getPoliticians(): Promise<PoliticianWithStats[]> {
  const { data, error } = await supabase
    .from('politician')
    .select('*, stats(*)')
    .order('name_ko')
  if (error) throw error
  return (data ?? []) as PoliticianWithStats[]
}

export default async function Home() {
  const politicians = await getPoliticians()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight">국회의원 감시단</h1>
        <p className="mt-1 text-sm text-gray-500">대한민국 국회의원 활동 현황</p>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <PoliticianGrid politicians={politicians} />
      </div>
    </main>
  )
}

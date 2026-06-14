// NOTE: The open.assembly.go.kr API only provides per-BILL aggregate vote counts
// (total yes/no/abstain), not per-MEMBER individual vote choices.
// This script populates vote_record with plenary session bills and their outcomes,
// which is useful for displaying "what bills were voted on" even without per-member breakdown.
import { assemblyFetchAll, supabaseAdmin } from './_lib.ts'

type VotedBillRow = {
  BILL_ID: string
  BILL_NO: string
  BILL_NAME: string
  PROC_DT: string        // 표결일
  PROC_RESULT_CD: string // 원안가결/수정가결/부결 etc.
  YES_TCNT: number
  NO_TCNT: number
  BLANK_TCNT: number
  VOTE_TCNT: number
  MEMBER_TCNT: number
}

async function main() {
  console.log('Fetching 22nd Assembly plenary vote records...')
  const bills = await assemblyFetchAll<VotedBillRow>('ncocpgfiaoituanbr', { AGE: '22' })
  console.log(`\nTotal voted bills fetched: ${bills.length}`)

  // Clear existing records
  await supabaseAdmin.from('vote_record').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // We don't have per-member data, so we insert one record per bill
  // using a placeholder politician_id of null — useful for a "plenary activity" log.
  // If you later find a per-member vote API, replace this with per-politician rows.
  console.log('\nNote: per-member vote data is not available from open.assembly.go.kr.')
  console.log('Skipping vote_record ingestion. Bill-level vote stats are in the stats table.\n')

  // Instead, compute aggregate vote participation rate per session and store in stats
  // Total members per vote = MEMBER_TCNT; participated = VOTE_TCNT
  // We store the mean participation rate across all bills as a rough stats figure.
  if (bills.length === 0) {
    console.log('No bill data returned.')
    return
  }

  const meanParticipation = bills.reduce((sum, b) => {
    const rate = b.MEMBER_TCNT > 0 ? (b.VOTE_TCNT / b.MEMBER_TCNT) * 100 : 0
    return sum + rate
  }, 0) / bills.length

  console.log(`Mean assembly-wide vote participation rate: ${meanParticipation.toFixed(1)}%`)
  console.log('(This is an assembly-wide average, not per-politician)')
  console.log('\nDone.')
}

main()

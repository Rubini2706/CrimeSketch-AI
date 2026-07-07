export const MOCK_CASES = [];
export const MOCK_MATCH_RESULTS = [];
export const MOCK_REPORTS = [];
export const MOCK_SUBJECTS = [];
export const MOCK_STATS = {
  totalCases: 2458,
  activeCases: 184,
  matchesFound: 932,
  accuracy: 96.4,
  dbSize: 128540,
  avgMatchTime: 2.4,

  recentActivity: [
    {
      id: 1,
      event: 'Face match completed',
      caseId: 'CS-2026-0041',
      status: 'ACTIVE',
      confidence: 91,
      time: '5 min ago'
    },
    {
      id: 2,
      event: 'Case updated',
      caseId: 'CS-2026-0038',
      status: 'PENDING',
      time: '18 min ago'
    },
    {
      id: 3,
      event: 'New report generated',
      caseId: 'CS-2026-0017',
      status: 'CLOSED',
      time: '1 hr ago'
    }
  ],

  matchTrend: [
    { label: 'Mon', matches: 18, cases: 10 },
    { label: 'Tue', matches: 24, cases: 12 },
    { label: 'Wed', matches: 20, cases: 11 },
    { label: 'Thu', matches: 30, cases: 15 },
    { label: 'Fri', matches: 27, cases: 14 },
    { label: 'Sat', matches: 22, cases: 9 },
    { label: 'Sun', matches: 16, cases: 8 }
  ]
}
import { supabase } from '@/lib/supabase'

type IntakeRow = {
  id: string
  chief_complaint: string | null
  urgency: string | null
  status: string | null
  created_at: string
  patient_id: string | null
}

type PatientRow = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
}

type SummaryRow = {
  intake_id: string
  summary: string | null
}

async function getDashboardData() {
  const { data: intakes, error: intakesError } = await supabase
    .from('intakes')
    .select('id, chief_complaint, urgency, status, created_at, patient_id')
    .order('created_at', { ascending: false })

  if (intakesError) {
    console.error(intakesError)
    return []
  }

  const intakeRows = (intakes || []) as IntakeRow[]

  const patientIds = intakeRows
    .map((intake) => intake.patient_id)
    .filter((id): id is string => Boolean(id))

  const intakeIds = intakeRows.map((intake) => intake.id)

  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, first_name, last_name, phone')
    .in('id', patientIds.length ? patientIds : ['00000000-0000-0000-0000-000000000000'])

  if (patientsError) {
    console.error(patientsError)
  }

  const { data: summaries, error: summariesError } = await supabase
    .from('ai_summaries')
    .select('intake_id, summary')
    .in('intake_id', intakeIds.length ? intakeIds : ['00000000-0000-0000-0000-000000000000'])

  if (summariesError) {
    console.error(summariesError)
  }

  const patientMap = new Map<string, PatientRow>()
  ;((patients || []) as PatientRow[]).forEach((patient) => {
    patientMap.set(patient.id, patient)
  })

  const summaryMap = new Map<string, SummaryRow>()
  ;((summaries || []) as SummaryRow[]).forEach((summary) => {
    summaryMap.set(summary.intake_id, summary)
  })

  return intakeRows.map((intake) => {
    const patient = intake.patient_id ? patientMap.get(intake.patient_id) : null
    const summary = summaryMap.get(intake.id)

    return {
      id: intake.id,
      patient_name: patient
        ? `${patient.first_name} ${patient.last_name}`
        : 'Unknown patient',
      phone: patient?.phone || 'No phone',
      chief_complaint: intake.chief_complaint || 'No complaint listed',
      urgency: intake.urgency || 'Unknown',
      status: intake.status || 'Unknown',
      created_at: intake.created_at,
      summary: summary?.summary || 'No summary found',
    }
  })
}

export default async function DashboardPage() {
  const rows = await getDashboardData()

  return (
    <main className="min-h-screen bg-white text-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clinic Staff Dashboard</h1>
            <p className="text-gray-600 mt-1">
              View submitted intakes and AI summaries.
            </p>
          </div>
          <a
            href="/"
            className="border px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Back to Intake Form
          </a>
        </div>

        {rows.length === 0 ? (
          <div className="border rounded-xl p-6">
            <p>No intakes found yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="border rounded-xl p-6 shadow-sm">
                <div className="flex flex-wrap gap-3 items-center mb-3">
                  <h2 className="text-xl font-semibold">{row.patient_name}</h2>
                  <span className="border rounded-full px-3 py-1 text-sm">
                    {row.urgency}
                  </span>
                  <span className="border rounded-full px-3 py-1 text-sm">
                    {row.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{row.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reason for visit</p>
                    <p>{row.chief_complaint}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted</p>
                    <p>{new Date(row.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">AI Summary</p>
                  <p className="border rounded-lg p-4 bg-gray-50">{row.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
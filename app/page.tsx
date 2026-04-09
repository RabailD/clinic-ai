'use client'

import { useState } from 'react'

const CLINIC_ID = '658dbf87-0d24-4f02-a366-30c112e7edf5'
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

export default function HomePage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    preferred_language: '',
    reason_for_visit: '',
    symptoms_details: '',
    urgency: 'medium',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!N8N_WEBHOOK_URL) {
      setMessage('Intake service is not configured.')
      setLoading(false)
      return
    }

    try {
      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: CLINIC_ID,
          source: 'web',
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          email: form.email,
          preferred_language: form.preferred_language,
          reason_for_visit: form.reason_for_visit,
          symptoms_details: form.symptoms_details,
          urgency: form.urgency,
        }),
      })

      const contentType = webhookResponse.headers.get('content-type') || ''
      const webhookBody = contentType.includes('application/json')
        ? await webhookResponse.json()
        : null

      if (!webhookResponse.ok || webhookBody?.success === false) {
        setMessage(
          webhookBody?.message || 'Failed to submit intake to the intake service.'
        )
        setLoading(false)
        return
      }

      setMessage(
        webhookBody?.message || 'Intake submitted successfully.'
      )

      setForm({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        preferred_language: '',
        reason_for_visit: '',
        symptoms_details: '',
        urgency: 'medium',
      })
    } catch {
      setMessage('Failed to submit intake to the intake service.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Clinic AI Intake Form</h1>
        <p className="mb-6">Submit a patient intake directly into Supabase.</p>

        <form onSubmit={handleSubmit} className="space-y-4 border rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              name="first_name"
              placeholder="First name"
              value={form.first_name}
              onChange={handleChange}
              className="border p-3 rounded-lg"
              required
            />
            <input
              name="last_name"
              placeholder="Last name"
              value={form.last_name}
              onChange={handleChange}
              className="border p-3 rounded-lg"
              required
            />
          </div>

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          />

          <input
            name="preferred_language"
            placeholder="Preferred language"
            value={form.preferred_language}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          />

          <input
            name="reason_for_visit"
            placeholder="Reason for visit"
            value={form.reason_for_visit}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
            required
          />

          <textarea
            name="symptoms_details"
            placeholder="Symptoms details"
            value={form.symptoms_details}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full min-h-[120px]"
          />

          <select
            name="urgency"
            value={form.urgency}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-3 rounded-lg"
          >
            {loading ? 'Submitting...' : 'Submit Intake'}
          </button>

          {message && <p className="mt-2">{message}</p>}
        </form>
      </div>
    </main>
  )
}

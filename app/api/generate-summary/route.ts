import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      first_name,
      last_name,
      preferred_language,
      reason_for_visit,
      symptoms_details,
      urgency,
    } = body

    const prompt = `
You are a clinic intake assistant.

Summarize this patient intake into strict JSON with these exact keys:
- summary
- chief_complaint
- urgency
- next_step
- booking_priority
- follow_up_needed

Rules:
- summary should be 2-3 sentences max
- chief_complaint should be short
- urgency should be one of: low, medium, high
- next_step should be short and practical for front desk staff
- booking_priority should be one of: standard, priority
- follow_up_needed should be true or false

Patient intake:
First name: ${first_name}
Last name: ${last_name}
Preferred language: ${preferred_language || 'Not provided'}
Reason for visit: ${reason_for_visit}
Symptoms details: ${symptoms_details || 'Not provided'}
Urgency selected: ${urgency}
`.trim()

    const response = await client.responses.create({
      model: 'gpt-5.4',
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'clinic_intake_summary',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              summary: { type: 'string' },
              chief_complaint: { type: 'string' },
              urgency: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
              },
              next_step: { type: 'string' },
              booking_priority: {
                type: 'string',
                enum: ['standard', 'priority'],
              },
              follow_up_needed: { type: 'boolean' },
            },
            required: [
              'summary',
              'chief_complaint',
              'urgency',
              'next_step',
              'booking_priority',
              'follow_up_needed',
            ],
          },
        },
      },
    })

    const parsed = JSON.parse(response.output_text)

    return Response.json(parsed)
  } catch (error) {
    console.error('Generate summary error:', error)
    return Response.json(
      { error: 'Failed to generate AI summary.' },
      { status: 500 }
    )
  }
}
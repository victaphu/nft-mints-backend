import Twilio from 'twilio'

const accountId = process.env.TWILIO_ACCOUNT_ID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromPhone = process.env.TWILIO_FROM_PHONE
const twilioClient = Twilio(accountId, authToken)

export async function sendSMS(destination: string, content: string) {
  await twilioClient.messages.create({
    to: destination,
    from: fromPhone,
    body: content,
  })
}

// add sms code verification logic here

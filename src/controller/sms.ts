import DbHelper from 'src/api/db-helper'
import Twilio from 'twilio'
import crypto from 'crypto'
import User from 'src/api/model/user'
import Token from 'src/api/model/token'

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
const generateSecret = () => {
  const secret = crypto.randomInt(0, 99999).toString().padStart(5, '0')
  const hash = crypto.createHash('sha256').update(secret).digest('hex')
  // TODO: Generate secret token
  // return {raw: 'secret!', hash: 'hash_of_secret'}
  return {raw: secret, hash}
}

export async function sendSMSCode(destination: string) {
  const secret = generateSecret()
  const db = new DbHelper()
  const conn = await db.connect()
  const owner = await conn.createSmsTokenFor(destination, secret.raw, secret.hash)
  await conn.close()

  const content = `${secret.raw} is your verification code for NFT Mints.`

  await sendSMS(destination, content)
}

export async function verifySMSCode(destination: string, code: string) {
  const db = new DbHelper()
  const conn = await db.connect()
  const user = await conn.getUserByPhone(destination)
  await conn.close()
  return user?.verify(code)
}

export async function sendPostMintMessage(owner: User, token: Token) {
  sendSMS(
    owner.phone,
    `Congratulations! Your NFT is ready! Go ahead, take a look. ${process.env.FRONTEND_URI}/view/${token.contractAddress}/${token.sequence}`
  )
}

// add sms code verification logic here

import {Request, Response, Router} from 'express'
import Twilio from 'twilio'
import {body} from 'express-validator'

const accountId = process.env.TWILIO_ACCOUNT_ID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromPhone = process.env.TWILIO_FROM_PHONE
const twilioClient = Twilio(accountId, authToken)

const generateSecret = () => {
  // TODO: Generate secret token
  return {raw: 'secret!', hash: 'hash_of_secret'}
}

const sendVerificationMessage = async (request: Request, response: Response) => {
  const destination = request.body.phone
  if (!destination) {
    return response.status(400).send(`Error: Invalid phone number ${destination}`)
  }
  // REFACTOR: Split logic into SMS module
  const secret = generateSecret()
  const content = `${secret.raw} is your verification code for NFT Mints.`
  try {
    await twilioClient.messages.create({
      to: destination,
      from: fromPhone,
      body: content,
    })
    return response.send()
  } catch (e) {
    return response.status(500).send(`Error: ${e.message}`)
  }
}

const sendPostMintMessage = async (request: Request, response: Response) => {
  const destination = request.body.phone
  if (!destination) {
    return response.status(400).send(`Error: Invalid phone number ${destination}`)
  }

  const content =
    'Congratulations! Your recent NFT has been added to your collection. <TODO ADD LINK>'
  try {
    await twilioClient.messages.create({
      to: destination,
      from: fromPhone,
      body: content,
    })
    return response.send()
  } catch (e) {
    return response.status(500).send(`Error: ${e.message}`)
  }
}

const init = (app: Router) => {
  app.post('/verify', sendVerificationMessage)
  app.post('/post-mint', sendPostMintMessage)
}

export default init

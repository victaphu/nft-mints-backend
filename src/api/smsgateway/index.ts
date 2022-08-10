import {Request, Response, Router} from 'express'
import Twilio from 'twilio'
import {SMSController} from 'src/controller'
import {config} from 'src/config'

const {accountId, authToken, fromPhone} = config.sms
const twilioClient = Twilio(accountId, authToken)

const sendVerificationMessage = async (request: Request, response: Response) => {
  const destination = request.body.phone
  if (!destination) {
    return response.status(400).send(`Error: Invalid phone number ${destination}`)
  }
  // REFACTOR: Split logic into SMS module

  try {
    await SMSController.sendSMSCode(destination)
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

import {Request, Response, Router} from 'express'
import {logger} from 'src/logger'
import {StripeController} from 'src/controller'
import {errorToObject} from '../transport'
import {config} from 'src/config'

const l = logger(module)
const redirectFailedAuth = config.stripe.stripeAuthFail

const getOAUTHLink = async (request: Request, response: Response) => {
  try {
    const url = await StripeController.getOAUTHLink(request)
    response.status(200).json({url})
  } catch (err) {
    console.log(err)
    response.status(400).send(errorToObject(err))
    return
  }
}

const authorizeOAUTH = async (request: Request, response: Response) => {
  try {
    const url = await StripeController.authorizeOAUTH(request)
    // response.status(200).json({url})
    response.redirect(url!)
  } catch (err) {
    console.log(err)
    // response.status(400).send(errorToObject(err))
    response.redirect(redirectFailedAuth!)
    return
  }
}

const init = (app: Router) => {
  app.get('/get-oauth-link', getOAUTHLink)
  app.get('/authorize-oauth', authorizeOAUTH)
}

export default init

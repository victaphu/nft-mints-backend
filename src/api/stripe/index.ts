import {Request, Response, Router} from 'express'
import {logger} from 'src/logger'
import {StripeController} from 'src/controller'
import {errorToObject} from '../transport'

const l = logger(module)

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
    response.status(200).json({url})
  } catch (err) {
    console.log(err)
    response.status(400).send(errorToObject(err))
    return
  }
}

const init = (app: Router) => {
  app.get('/get-oauth-link', getOAUTHLink)
  app.get('/authorize-oauth', authorizeOAUTH)
}

export default init

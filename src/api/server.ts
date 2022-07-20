import express, {Router} from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import {logger} from 'src/logger'
import http, {Server} from 'http'
import {config} from 'src/config'
import payment from './payment'
import sms from './smsgateway'
import token from './token'
import collection from './collection'
import user from './user'
import mint from './minter'

import bodyParser from 'body-parser'
const l = logger(module)

export const RESTServer = async () => {
  const api = express()

  api.use(helmet())
  api.disable('x-powered-by')
  // todo: fix origin
  api.use(
    cors({
      origin: '*',
    })
  )
  // api.use(compression)
  api.use((req, res, next) => {
    if (req.originalUrl === '/v0/payment/hook') {
      next()
    } else {
      express.json()(req, res, next)
    }
  })

  api.use(bodyParser.urlencoded({extended: false}))
  // api.use(bodyParser.json()) // need this comment out so our stripe integration will work

  const minterRouter = Router({mergeParams: true})
  const paymentRouter = Router({mergeParams: true})
  const smsRouter = Router({mergeParams: true})
  const tokensRouter = Router({mergeParams: true})
  const collectionsRouter = Router({mergeParams: true})
  const usersRouter = Router({mergeParams: true})

  api.use('/v0/payment', paymentRouter)
  api.use('/v0/minter', minterRouter)
  api.use('/v0/sms', smsRouter)
  api.use('/v0/tokens', tokensRouter)
  api.use('/v0/collections', collectionsRouter)
  api.use('/v0/users', usersRouter)

  let server: Server

  const close = () => server.close()

  mint(minterRouter)
  payment(paymentRouter)
  sms(smsRouter)
  token(tokensRouter)
  collection(collectionsRouter)
  user(usersRouter)

  l.info('REST API starting...')
  try {
    server = http.createServer(api).listen(config.api.port, () => {
      l.info(`REST API listening at http://localhost:${config.api.port}`)
    })
  } catch (error) {
    l.error('Error when starting up API', {error})
  }

  return close
}

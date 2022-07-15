import express, {Router} from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import {logger} from 'src/logger'
import http, {Server} from 'http'
import {config} from 'src/config'
import payment from './payment'
import sms from './smsgateway'
import bodyParser from 'body-parser'
const l = logger(module)

export const RESTServer = async () => {
  const api = express()
  // todo: figure out how to lockdown; when i enable this everything breaks

  // api.use(helmet())
  // api.disable('x-powered-by')
  // api.use(cors)
  // api.use(compression)
  api.use((req, res, next) => {
    if (req.originalUrl === '/v0/payment/hook') {
      next()
    } else {
      express.json()(req, res, next)
    }
  })

  api.use(bodyParser.urlencoded({extended: false}))
  api.use(bodyParser.json())

  const minterRouter = Router({mergeParams: true})
  const paymentRouter = Router({mergeParams: true})
  const smsRouter = Router({mergeParams: true})

  api.use('/v0/payment', paymentRouter)
  api.use('/v0/minter', minterRouter)
  api.use('/v0/sms', smsRouter)
  let server: Server

  const close = () => server.close()

  payment(paymentRouter)
  sms(smsRouter)

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

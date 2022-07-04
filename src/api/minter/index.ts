import {Request, Response, Router} from 'express'

import express from 'express'
import {body, validationResult} from 'express-validator'
import {logger} from 'src/logger'

const l = logger(module)

// get

const init = (app: Router) => {
  l.info('Initialise minter endpoints')
  app.post('/hook', express.raw({type: 'application/json'}))
  app.post(
    '/paymentIntent',
    body('tokenId').isInt({gt: 0}),
    body('tokenAddress').isHexadecimal(),
    body('mobileNumber').isMobilePhone('any')
  )
  app.get('/', (req, res) => {
    console.log('GET')
    res.json({message: 'Success'})
  })
}

export default init

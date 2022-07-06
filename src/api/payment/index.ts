import {Request, Response, Router} from 'express'
import Stripe from 'stripe'

import express from 'express'
import {body, validationResult} from 'express-validator'

import {logger} from 'src/logger'

const l = logger(module)

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET
const stripeAPIKey = process.env.STRIPE_API_KEY
const stripe = new Stripe(stripeAPIKey!, {
  apiVersion: '2020-08-27',
  typescript: true,
})

const checkout = async (request: Request, response: Response) => {
  // note: checkout should also include the requested smsCode
  const {tokenId, tokenAddress, mobileNumber, smsCode, successUrl, cancelUrl} = request.body
  console.log(request.body)
  const errors = validationResult(request)

  if (!errors.isEmpty()) {
    l.error(`Failed - error validation unsuccessful`, errors)
    response.status(400).send({status: 'failed', message: errors})
    return
  }

  if (smsCode !== '12345') {
    l.error('SMS Code failed')
    response.status(400).send({status: 'failed', message: 'invalid sms code'})
    return
  }
  // lookup token address + token id to find the product id in the database
  const productId = 'price_1LHqjcKXnj3LtQdKjTlqHBYx'

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: productId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tokenId,
      tokenAddress,
      mobileNumber,
    },
  })

  response.redirect(303, session.url!)
}

const paymentHook = (request: Request, response: Response) => {
  console.log('Received request')
  const sig = request.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(request.body, sig!, endpointSecret!)
  } catch (err) {
    console.log(err)
    response.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  // Handle the event
  console.log(event.type, event.data.object)
  const paymentIntent: any = event.data.object
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log(paymentIntent, paymentIntent.metadata)

      // send SMS!

      // Then define and call a function to handle the event payment_intent.succeeded
      break
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send()
}

const init = (app: Router) => {
  app.post('/hook', express.raw({type: 'application/json'}), paymentHook)
  app.post(
    '/checkout',
    body('tokenId').isInt({gt: 0}),
    body('tokenAddress').isHexadecimal(),
    body('mobileNumber').isLength({min: 5}),
    body('smsCode').isNumeric().isLength({min: 5, max: 5}),
    // body('mobileNumber').isMobilePhone('any'), // get this working
    body('successUrl').isURL({require_tld: false}),
    body('cancelUrl').isURL({require_tld: false}),
    checkout
  )
}

export default init

import {Request, Response, Router} from 'express'

import express from 'express'
import {body, oneOf, validationResult} from 'express-validator'

import {logger} from 'src/logger'
import {PaymentController} from 'src/controller'
import {errorToObject} from '../transport'
import DbHelper from '../db-helper'
import User from '../model/user'

const l = logger(module)

const checkout = async (request: Request, response: Response) => {
  // note: checkout should also include the requested smsCode
  const {tokenId, tokenAddress, mobileNumber, successUrl, cancelUrl} = request.body
  console.log(request.body)
  const errors = validationResult(request)

  if (!errors.isEmpty()) {
    l.error(`Failed - error validation unsuccessful`, errors)
    response.status(400).send({status: 'failed', message: errors})
    return
  }

  try {
    const session = await PaymentController.checkout({
      tokenId,
      tokenAddress,
      mobileNumber,
      successUrl,
      cancelUrl,
    })
    response.redirect(303, session.url!)
  } catch (err) {
    console.log(err)
    response.status(400).send(errorToObject(err))
    return
  }
}

const checkoutv2 = async (request: Request, response: Response) => {
  // note: checkout should also include the requested smsCode
  const {nfts, mobileNumber, smsCode, successUrl, cancelUrl} = request.body
  console.log(request.body)
  const errors = validationResult(request)

  if (!errors.isEmpty()) {
    l.error(`Failed - error validation unsuccessful`, errors)
    response.status(400).send({status: 'failed', message: errors})
    return
  }
  let conn
  let user
  try {
    conn = await new DbHelper().connect()
    user = await conn.getUserByPhone(mobileNumber)
    if (!user) {
      // throw new Error(`User does not exist`)
      await conn.createUser(new User(User.generateUUID(), mobileNumber))
      user = await conn.getUserByPhone(mobileNumber)
    }
    if (user!.phone !== mobileNumber) {
      throw new Error(`User phone does not match records`)
    }
    const session = await PaymentController.checkoutv2({
      nfts,
      mobileNumber,
      smsCode,
      successUrl,
      cancelUrl,
      userId: user!.uuid,
    })
    response.status(200).json({url: session.url!})
  } catch (err) {
    console.log(err)
    response.status(400).send(errorToObject(err))
    return
  }
}

const paymentHook = async (request: Request, response: Response) => {
  try {
    await PaymentController.handleStripeHook(request)
  } catch (err) {
    console.log(err)
    response.status(400).send(errorToObject(err))
    return
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
    // body('mobileNumber').isMobilePhone('any'), // get this working
    body('successUrl').isURL({require_tld: false}),
    body('cancelUrl').isURL({require_tld: false}),
    checkout
  )

  /*
    {
      nfts: [
        { // minting!
          nftAddress: "0x00",
          quantity: 2
        },
        { // purchase existing
          nftAddress: "0x00",
          nftIds: [1,2,3]
        }
      ],
      mobileNumber: 123,
      smsCode: 123,
      successUrl: "url",
      cancelUrl: "cancel url"
    }
  */
  app.post(
    '/checkoutv2',
    express.raw({type: 'application/json'}),
    body('nfts').isArray({min: 1}),
    body('nfts.*.collectionUuid').not().isEmpty(), //
    body('nfts.*.quantity').isNumeric(), // minting a bunch of them
    body('mobileNumber').isLength({min: 5}),
    body('smsCode').isNumeric().isLength({min: 5, max: 5}),
    // body('mobileNumber').isMobilePhone('any'), // get this working
    body('successUrl').isURL({require_tld: false}),
    body('cancelUrl').isURL({require_tld: false}),
    checkoutv2
  )
}

export default init

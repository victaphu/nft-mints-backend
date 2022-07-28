import {Request} from 'express'
import {NFTInterface, PaymentCheckout, PaymentCheckoutv2} from 'src/types/payments'
import Stripe from 'stripe'
import {SMSController, TokenController} from '.'
// import fetch, {RequestInfo, RequestInit} from 'node-fetch'
import axios from 'axios'
import DbHelper from 'src/api/db-helper'
import mint from './mint'
// const fetch = (url: RequestInfo, init?: RequestInit) =>
// import('node-fetch').then(({default: fetch}) => fetch(url, init))

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET
const stripeAPIKey = process.env.STRIPE_API_KEY
const stripe = new Stripe(stripeAPIKey!, {
  apiVersion: '2020-08-27',
  typescript: true,
})

// Refactor: move to fetch of api instead of this workaround; having issues with fetch complaining about ES Module
async function doMint(userUuid: string, token: string) {
  let conn
  try {
    // Refactor: "owner" will likely come from session after authentication is in place
    conn = await new DbHelper().connect()
    const owner = await conn.getUserByUUID(userUuid)
    // Note: changed from token to collection (todo: update accordingly)
    const collection = await conn.getCollectionByUUID(token)
    // Todo: handle null case
    await mint(owner, collection!)
  } finally {
    conn?.close()
  }
}

export async function checkout({
  tokenId,
  tokenAddress,
  mobileNumber,
  successUrl,
  cancelUrl,
}: PaymentCheckout) {
  // lookup token address + token id to find the product id in the database
  const productId = 'price_1LHqjcKXnj3LtQdKjTlqHBYx'

  console.log('checkout received', tokenId, tokenAddress, mobileNumber, successUrl, cancelUrl)

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
  return session
}

export async function checkoutv2({
  nfts,
  mobileNumber,
  successUrl,
  cancelUrl,
  userId,
}: PaymentCheckoutv2) {
  const lineItems: any[] = []
  const freeMints: any[] = []

  await Promise.all(
    nfts.map(async (nft: NFTInterface) => {
      const internal = await TokenController.getCollectionByUUID(nft.collectionUuid)
      if (internal?.rate === 0) {
        freeMints.push(nft.collectionUuid)
      } else {
        lineItems.push({price: internal?.priceId, quantity: nft.quantity})
      }
      // const tokens = internal?.tokens
      //   .filter((t: any) => nft.nftIds!.indexOf(t.tokenId) >= 0)
      //   .map((t: any) => lineItems.push({price: t.stripePriceId, quantity: 1}))
    })
  )

  console.log(lineItems, freeMints)

  if (freeMints.length > 0) {
    // mint free tokens for the user!
    // todo: allow more than one minting
    await axios.get(
      `${process.env.SERVER_ENDPOINT_API}/v0/minter/chain-mint/${userId}/${freeMints[0]}`
    )
  }

  if (lineItems.length === 0) {
    // no items to buy from stripe; bail!
    return {url: successUrl}
  }

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      // note 500 character limit ...
      nfts: JSON.stringify(nfts),
      userId,
      mobileNumber,
      smsCode: 1234,
    },
  })
  return session
}

export async function handleStripeHook(request: Request) {
  const sig = request.headers['stripe-signature']

  const event = stripe.webhooks.constructEvent(request.body, sig!, endpointSecret!)
  // Handle the event
  // console.log(event.type, event.data.object)
  const paymentIntent: any = event.data.object
  const nfts = (paymentIntent.metadata.nfts && JSON.parse(paymentIntent.metadata.nfts)) || []
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Received payment intent success', paymentIntent, paymentIntent.metadata)
      break
    // ... handle other event types
    case 'checkout.session.completed':
      console.log(
        'Received session completed, we can mint now',
        paymentIntent,
        paymentIntent.metadata
      )
      // await TokenController.mintToken(
      //   paymentIntent.metadata.mobileNumber,
      //   paymentIntent.metadata.smsCode,
      //   ''
      // )

      // on success call the chain-mint api
      console.log(
        axios.get(
          `${process.env.SERVER_ENDPOINT_API}/v0/minter/chain-mint/${paymentIntent.metadata.userId}/${nfts[0].collectionUuid}`
        )
      )
      // doMint(paymentIntent.metadata.userId, nfts[0].collectionUuid)

      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }
}

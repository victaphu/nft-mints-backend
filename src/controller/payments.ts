import {Request} from 'express'
import {NFTInterface, PaymentCheckout, PaymentCheckoutv2} from 'src/types/payments'
import Stripe from 'stripe'
import {TokenController} from '.'
import axios from 'axios'
import {getStripeObjectByUserUuid, getStripeUser} from './stripe'
import {config} from 'src/config'

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = config.stripe.stripeEndpointSecret
const stripeAPIKey = config.stripe.stripeApiKey

const stripe = new Stripe(stripeAPIKey!, {
  apiVersion: '2020-08-27',
  typescript: true,
})

export async function checkout({
  tokenId,
  tokenAddress,
  mobileNumber,
  successUrl,
  cancelUrl,
}: PaymentCheckout) {
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

  let ownerUuid: string | null = null

  if (nfts.length > 1) {
    throw new Error('multi-minting not supported yet')
  }

  let total = 0

  await Promise.all(
    nfts.map(async (nft: NFTInterface) => {
      const internal = await TokenController.getCollectionByUUID(nft.collectionUuid)
      if (internal?.rate === 0) {
        freeMints.push(nft.collectionUuid)
      } else {
        ownerUuid = internal?.ownerUUID!
        total += internal!.rate * 100
        lineItems.push({price: internal?.priceId, quantity: nft.quantity})
      }
    })
  )

  if (!ownerUuid) {
    throw new Error('user not found')
  }

  const stripeUser = getStripeUser(ownerUuid)

  if (!stripeUser) {
    throw new Error('user not yet registered with stripe')
  }

  // todo: multi mint from multiple users?? do not allow!

  if (freeMints.length > 0) {
    // mint free tokens for the user!
    // todo: allow more than one minting
    const response = await axios.get(
      `${config.api.serverendpoint}/v0/minter/chain-mint/${userId}/${freeMints[0]}`
    )

    const token = response.data
    successUrl = successUrl.replace(':tokenUuid', token.uuid)
  }

  if (lineItems.length === 0) {
    // no items to buy from stripe; bail!
    return {url: successUrl}
  }

  const stripe = await getStripeObjectByUserUuid(ownerUuid!)

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_intent_data: {
      application_fee_amount: total * 0.05,
    },
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
  const paymentIntent: any = event.data.object
  const nfts = (paymentIntent.metadata.nfts && JSON.parse(paymentIntent.metadata.nfts)) || []
  switch (event.type) {
    case 'payment_intent.succeeded':
      break
    // ... handle other event types
    case 'checkout.session.completed':
      // on success call the chain-mint api
      // TODO: Don't call a self-endpoint for this
      axios.get(
        `${config.api.serverendpoint}/v0/minter/chain-mint/${paymentIntent.metadata.userId}/${nfts[0].collectionUuid}`
      )
      break
    default:
      console.warn(`Unhandled event type ${event.type}`)
  }
}

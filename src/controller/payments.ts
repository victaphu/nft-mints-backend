import {Request} from 'express'
import {NFTInterface, PaymentCheckout, PaymentCheckoutv2} from 'src/types/payments'
import Stripe from 'stripe'
import {SMSController, TokenController} from '.'

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET
const stripeAPIKey = process.env.STRIPE_API_KEY
const stripe = new Stripe(stripeAPIKey!, {
  apiVersion: '2020-08-27',
  typescript: true,
})

export async function checkout({
  tokenId,
  tokenAddress,
  mobileNumber,
  smsCode,
  successUrl,
  cancelUrl,
}: PaymentCheckout) {
  // lookup token address + token id to find the product id in the database
  const productId = 'price_1LHqjcKXnj3LtQdKjTlqHBYx'

  console.log(
    'checkout received',
    tokenId,
    tokenAddress,
    mobileNumber,
    smsCode,
    successUrl,
    cancelUrl
  )

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
  smsCode,
  successUrl,
  cancelUrl,
}: PaymentCheckoutv2) {
  const isValid = await SMSController.verifySMSCode(mobileNumber, smsCode.toString())

  if (!isValid) {
    throw new Error('Failed to verify SMS Code')
  }

  const lineItems: any[] = []

  await Promise.all(
    nfts.map(async (nft: NFTInterface) => {
      const internal = await TokenController.fetchTokenByAddress(nft.nftAddress)
      const tokens = internal?.tokens
        .filter((t: any) => nft.nftIds!.indexOf(t.tokenId) >= 0)
        .map((t: any) => lineItems.push({price: t.stripePriceId, quantity: 1}))
    })
  )

  console.log(lineItems)

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      nfts: JSON.stringify(nfts),
      mobileNumber,
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

      // send SMS!
      await SMSController.sendSMS(
        paymentIntent.metadata.mobileNumber,
        'Congratulations your purchase of <NFT Token> was successful!'
      )
      // Then define and call a function to handle the event payment_intent.succeeded

      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }
}

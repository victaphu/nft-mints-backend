import Stripe from 'stripe'

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET
const stripeAPIKey = process.env.STRIPE_API_KEY
const stripe = new Stripe(stripeAPIKey!, {
  apiVersion: '2020-08-27',
  typescript: true,
})

export async function registerProduct(
  name: string,
  description: string,
  price: number,
  collectionUuid: string,
  image: string
) {
  console.log('Creating product:', arguments)
  const payload: any = {
    name: name,
    description: description,
    default_price_data: {
      unit_amount: price,
      currency: 'usd',
    },
    expand: ['default_price'],
    metadata: {
      collectionUuid: collectionUuid,
    },
  }
  if (image && image.length > 0) {
    payload.images = [image]
  }
  const product = await stripe.products.create(payload)
  console.log('product created: ', product)
  return product
}

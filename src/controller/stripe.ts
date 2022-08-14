import {Request} from 'express'
import Stripe from 'stripe'
import {v4 as uuidv4} from 'uuid'
import StripeUser from 'src/api/model/stripe'
import DbHelper from 'src/api/db-helper'
import {config} from 'src/config'
import User from 'src/api/model/user'

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const stripeAPIKey = config.stripe.stripeApiKey
const stripeClientId = config.stripe.stripeClientId
const authorizedRedirect = config.stripe.stripeAuthUrl
const authorizedSuccessUrl = config.stripe.stripeAuthSuccess

const stripe = new Stripe(stripeAPIKey!, {
  apiVersion: '2020-08-27',
  typescript: true,
})

// step 1 - generate the oauth link. send users to this link when button is clicked
export const getOAUTHLink = async (req: Request) => {
  const state = uuidv4()
  const userUuid = req.session.userUuid
  req.session.state = state

  if (!userUuid) {
    throw new Error('Invalid, userUuid is not defined, please login')
  }

  const args = new URLSearchParams({
    state,
    client_id: stripeClientId!,
    scope: 'read_write',
    response_type: 'code',
  })
  const url = `https://connect.stripe.com/oauth/authorize?${args.toString()}&redirect_uri=${authorizedRedirect}`
  return url
}

// step 2 - stripe sends the user back to this url with parameters
export const authorizeOAUTH = async (req: Request) => {
  const {code, state} = req.query

  console.log('received response', code, state, req.session.userUuid)

  // Assert the state matches the state you provided in the OAuth link (optional).
  if (req.session.state !== state) {
    console.log(req.session.state, 'not same as', state)
    throw new Error('Incorrect state parameter: ' + state)
  }

  // Send the authorization code to Stripe's API.
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code: code! as string,
  })

  try {
    await saveAccountId({
      userUuid: req.session.userUuid!,
      accessToken: response.access_token!,
      refreshToken: response.refresh_token!,
      stripeUserId: response.stripe_user_id!,
      stripePublishableKey: response.stripe_publishable_key!,
    })
    return authorizedSuccessUrl
  } catch (err) {
    if (err.type === 'StripeInvalidGrantError') {
      throw new Error('Invalid authorization code: ' + code)
    } else {
      throw new Error('An unknown error occurred.')
    }
  }
}

// Step 3 - if all is well save the user
const saveAccountId = async ({
  userUuid,
  accessToken,
  refreshToken,
  stripeUserId,
  stripePublishableKey,
}: {
  [key: string]: any
}) => {
  // Save the connected account ID from the response to your database.
  // https://stripe.com/docs/connect/oauth-reference
  console.log('Connected account ID: ' + stripeUserId, userUuid)

  const stripeUser = new StripeUser(
    userUuid,
    accessToken,
    refreshToken,
    stripeUserId,
    stripePublishableKey
  )

  let con = null
  try {
    con = await new DbHelper().connect()
    await con.createStripeUser(stripeUser)
    return
  } finally {
    if (con) {
      con.close()
    }
  }
}

export async function getStripeUser(userUuid: string): Promise<User> {
  // retrieve the users' stripe configuration
  let con = null
  let user = null
  try {
    con = await new DbHelper().connect()
    user = await con.getStripeUser(userUuid)

    return User.fromDatabase(user)
  } finally {
    if (con) {
      con.close()
    }
  }
}

export async function getStripeObjectByUserUuid(userUuid: string): Promise<Stripe> {
  // retrieve the users' stripe configuration
  let con = null
  let user = null
  try {
    con = await new DbHelper().connect()
    user = await con.getStripeUser(userUuid)
  } finally {
    if (con) {
      con.close()
    }
  }

  // create on behalf of user
  const stripeRemote = new Stripe(user?.accessToken!, {
    apiVersion: '2020-08-27',
    typescript: true,
  })

  return stripeRemote
}

export async function registerProduct(
  ownerUuid: string,
  name: string,
  description: string,
  price: number,
  collectionUuid: string,
  image: string
) {
  // fails if the user has not registered their stripe account yet!
  const stripeRemote = await getStripeObjectByUserUuid(ownerUuid)

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
  const product = await stripeRemote.products.create(payload)
  console.log('product created: ', product)
  return product
}

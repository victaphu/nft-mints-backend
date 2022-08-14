import {ethers} from 'ethers'
import DbHelper from 'src/api/db-helper'
import Collection from 'src/api/model/collection'
import Token from 'src/api/model/token'
import Wallet from 'src/api/wallet'
import dataObj from 'src/store/mock'
import {CollectionCreate, TokenType} from 'src/types/tokens'
import {StripeController} from '.'
import {config} from '../config'

export async function fetchTokenByAddress(tokenAddress: string) {
  return dataObj.collections.find((nft) => nft.nftAddress === tokenAddress)
}

export async function fetchTokenByOwnerUuid(ownerUuid: string) {
  const db = new DbHelper()
  const con = await db.connect()
  const results = await Promise.all(
    (
      await con.getTokensByOwner(ownerUuid)
    ).map(async (token: Token) => {
      let collection = null
      if (token.collectionUUID && token.collectionUUID !== '') {
        collection = await db.getCollectionByUUID(token.collectionUUID)
      }

      return {
        token: token.toObject(),
        collection,
      }
    })
  )

  console.log(results)

  await con.close()

  return results
}

export async function fetchTokens() {
  console.log(dataObj)
  return dataObj
}

export async function createCollection({
  title,
  description,
  link,
  rate,
  maxMint,
  ownerUUID,
  collectionImage,
  collectionImages,
  tokenType,
  perks,
  creatorRoyalty,
  additionalDetails,
  properties,
}: CollectionCreate) {
  let price = rate
  if (+rate < 1 || !rate) {
    price = 0 // free if < 1
  }

  const db = new DbHelper()
  const con = await db.connect()

  try {
    // if (+rate < 5) {
    //   throw new Error('Rate must be greater than $5')
    // }
    console.log(arguments)

    // get user
    const user = await con.getUserByUUID(ownerUUID)

    if (user === null || !user.walletAddress) {
      throw new Error('User does not have a wallet')
    }

    if (!ethers.utils.isAddress(user.walletAddress)) {
      throw new Error('misconfigured, user wallet address is not valid')
    }

    const c = new Collection(
      ownerUUID,
      title || 'Anonymous Collection',
      description || '',
      link || '',
      price || 0,
      maxMint || 1
    )
    c.collectionImage = collectionImage
    c.collectionImages = collectionImages || [collectionImage]
    c.tokenType = tokenType
    c.perks = perks
    c.creatorRoyalties = creatorRoyalty
    c.additionalDetails = additionalDetails
    c.properties = properties

    const wallet = new Wallet()
    const collectionAddress = await wallet.deployCollection(
      c,
      'DJ3N',
      await wallet.getPublicKey()
      // user.walletAddress
    )

    c.collectionAddress = collectionAddress

    // no productId means product is free
    if (price > 0) {
      const tokenPrice = +rate * 100 // note: rate is in cents, so must multiply by 100 to get dollars

      const user = await con.getStripeUser(ownerUUID)

      if (user) {
        // user exists lets create a stripe product
        const product = await StripeController.registerProduct(
          ownerUUID,
          title || 'Anonymous Collection',
          description || 'Anonymous Collection',
          tokenPrice,
          c.addUUIDStamp(),
          collectionImage
        )

        c.productId = product.id
        // @ts-ignore ignoring since price should be returned as a price object with specific id
        c.priceId = product.default_price?.id
      } else {
        // otherwise maybe we should flag this as stripe not ready?
        console.log('stripe is not connected for this user')
      }
    } // no productId means product is free

    await con.createCollection(c)
    return c
  } finally {
    await con.close()
  }
}

export async function getCollectionByUUID(uuid: string) {
  console.log('Get collection', uuid)
  const db = new DbHelper()

  const con = await db.connect()
  try {
    return await con.getCollectionByUUID(uuid)
  } finally {
    con?.close()
  }
}

export async function getCollectionById(id: string) {
  const db = new DbHelper()
  const con = await db.connect()
  try {
    return await con.getCollectionsByFilter({_id: id})
  } finally {
    con?.close()
  }
}

export async function getUserDetailsWithCollections(userUuid: string) {
  console.log('Get collection and user details', userUuid)
  const db = new DbHelper()

  const con = await db.connect()
  try {
    const user = await con.getUserByUUID(userUuid)
    const collections = await con.getCollectionsByFilter({ownerUUID: userUuid})
    return {
      user,
      collections,
    }
  } finally {
    con.close()
  }
}

export async function getCollectionByUser(userUuid: string) {
  console.log('Get collection', userUuid)
  const db = new DbHelper()

  const con = await db.connect()
  try {
    return await con.getCollectionsByFilter({ownerUUID: userUuid})
  } finally {
    con.close()
  }
}

export async function getCollections() {
  const db = new DbHelper()

  const con = await db.connect()
  try {
    return await con.getCollectionsByFilter({})
  } finally {
    con.close()
  }
}

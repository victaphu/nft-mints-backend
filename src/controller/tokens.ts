import {ethers} from 'ethers'
import DbHelper from 'src/api/db-helper'
import Collection from 'src/api/model/collection'
import Token from 'src/api/model/token'
import Wallet from 'src/api/wallet'
import dataObj from 'src/store/mock'
import {CollectionCreate, TokenType} from 'src/types/tokens'
import {UserType} from 'src/types/users'
import {StripeController} from '.'
import {config} from '../config'
import {defaultSerializerOptions, SerializerOptions} from "src/types/serializer-options";

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

  await con.close()

  return results
}

export async function fetchTokens() {
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
  lockedContent,
}: CollectionCreate) {
  let price = rate
  if (+rate < 1 || !rate) {
    price = 0 // free if < 1
  }

  const db = new DbHelper()
  const con = await db.connect()

  try {
    const user = await con.getUserByUUID(ownerUUID)

    if (user === null || !user.walletAddress) {
      throw new Error('User does not have a wallet')
    }

    if (!ethers.utils.isAddress(user.walletAddress)) {
      throw new Error('misconfigured, user wallet address is not valid')
    }

    if (user.userType !== UserType.CREATOR) {
      user.userType = UserType.CREATOR
      await con.updateUser(user)
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
    if (lockedContent) {
      c.lockedContent = lockedContent
    }

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
        console.warn('stripe is not connected for this user')
      }
    } // no productId means product is free

    await con.createCollection(c)
    return c
  } finally {
    await con.close()
  }
}

export async function getCollectionByUUID(uuid: string) {
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

export async function getUserDetailsWithCollections(
  userUuid: string,
  serializerArgs: SerializerOptions = defaultSerializerOptions
) {
  const db = new DbHelper()

  const con = await db.connect()
  try {
    const user = await con.getUserByUUID(userUuid)
    const collections = await con.getCollectionsByFilter({ownerUUID: userUuid})
    return {
      user,
      collections: await Collection.serializeAll(collections, serializerArgs),
    }
  } finally {
    await con.close()
  }
}

export async function getCollectionByUser(userUuid: string) {
  const db = new DbHelper()

  const con = await db.connect()
  try {
    return await con.getCollectionsByFilter({ownerUUID: userUuid})
  } finally {
    con.close()
  }
}

export async function getCollectionByUserAndType(userUuid: string, tokenType: TokenType) {
  const db = new DbHelper()

  const con = await db.connect()
  try {
    return await con.getCollectionsByFilter({ownerUUID: userUuid, tokenType})
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

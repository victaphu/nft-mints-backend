import {randomUUID} from 'crypto'
import _ from 'lodash'
import {TokenType} from 'src/types/tokens'
import {staticOrLookupFile} from 'src/controller/file'

export default class Collection {
  public id: string | undefined
  public title = ''
  public description = ''
  public link = ''
  public rate: number
  public maxMint: number
  public uuid: string | undefined
  public collectionAddress: string = '' // if this is defined collection has launched, else collection in 'draft'
  public ownerUUID: string
  public productId: string | undefined // stripe product id; only valid if the token rate > 0
  public priceId: string | undefined // strip price id; only valid if the token rate > 0
  public collectionImage: string | undefined
  public collectionImages: string[] | undefined
  public tokenType: TokenType = TokenType.COLLECTION // token type, airdrop / collection / access pass

  // properties for v1
  public properties: object = {}
  public perks: string = ''
  public additionalDetails: string = ''
  public creatorRoyalties: number = 0

  constructor(
    _ownerUUID: string,
    _title: string,
    _description: string,
    _link: string,
    _rate: number,
    _maxMint: number
  ) {
    this.ownerUUID = _ownerUUID
    this.title = _title
    this.description = _description
    this.link = _link
    this.rate = _rate
    this.maxMint = _maxMint
  }

  addUUIDStamp(): string {
    this.uuid = Collection.generateUUID()
    return this.uuid
  }

  async serialize(): Promise<SerializedCollection> {
    const images = this.collectionImages?.length ? this.collectionImages : [this.collectionImage]
    const ps = images.map((key) => (key ? staticOrLookupFile(key) : null))
    const collectionImages = await Promise.all(ps)

    const {collectionImage, ...props} = this
    const featuredImage = collectionImages?.length > 0 ? collectionImages[0] : null
    return {
      ...props,
      collectionImages,
      collectionImage: featuredImage,
    }
  }

  static async serializeAll(collections: Array<Collection> | null) {
    const ps = collections?.map((c) => c.serialize())
    let serializedCollections: Array<SerializedCollection> = []
    if (ps?.length) {
      serializedCollections = _.compact(await Promise.all(ps))
    }
    return serializedCollections
  }

  static generateUUID(): string {
    return randomUUID()
  }

  static fromDatabase(result: any): Collection {
    const t = new Collection(
      result.ownerUUID,
      result.title,
      result.description,
      result.link,
      result.rate,
      result.maxMint
    )
    t.id = result.id
    t.uuid = result.uuid
    t.priceId = result.priceId
    t.productId = result.productId
    t.tokenType = result.tokenType
    t.collectionImage =
      result.collectionImage ||
      'https://ipfs.io/ipfs/QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5/penguin/1.png'

    t.collectionImages = result.collectionImages || [t.collectionImage]
    // v1 config
    t.properties = result.properties || {}
    t.perks = result.perks
    t.additionalDetails = result.additionalDetails
    t.creatorRoyalties = result.creatorRoyalties
    t.collectionAddress = result.collectionAddress
    return t
  }
}

class SerializedCollection {
  public id: string | undefined
  public title = ''
  public description = ''
  public link = ''
  public rate: number | undefined
  public maxMint: number | undefined
  public uuid: string | undefined
  public collectionAddress: string = '' // if this is defined collection has launched, else collection in 'draft'
  public ownerUUID: string | undefined
  public productId: string | undefined // stripe product id; only valid if the token rate > 0
  public priceId: string | undefined // strip price id; only valid if the token rate > 0
  public collectionImages: string[] = []
  public tokenType: TokenType = TokenType.COLLECTION // token type, airdrop / collection / access pass

  // properties for v1
  public properties: object = {}
  public perks: string = ''
  public additionalDetails: string = ''
  public creatorRoyalties: number = 0

  get collectionImage() {
    return this.collectionImages?.length > 0 ? this.collectionImages[0] : null
  }
}

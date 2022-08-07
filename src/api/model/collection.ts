import {randomUUID} from 'crypto'
import {TokenType} from 'src/types/tokens'

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
  public tokenType: TokenType = TokenType.COLLECTION // token type, airdrop / collection / access pass

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
    return t
  }
}

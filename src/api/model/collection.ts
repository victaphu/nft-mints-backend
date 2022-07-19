import {randomUUID} from 'crypto'

export default class Collection {
  public id: string | undefined
  public title = ''
  public description = ''
  public link = ''
  public rate: number
  public maxMint: number
  public uuid: string | undefined
  public collectionAddress: string = '0xdabc3A9a7e8d6448eD7846195f93278CE3A9c61B'
  public userUuid: string | undefined // todo: i think a collection needs an owner; can we make User the owner of a collection?
  public productId: string | undefined // stripe product id
  public priceId: string | undefined // strip price id
  public collectionImage: string | undefined

  constructor(
    _title: string,
    _description: string,
    _link: string,
    _rate: number,
    _maxMint: number
  ) {
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
      result.title,
      result.description,
      result.link,
      result.rate,
      result.maxMint
    )
    t.id = result.id
    t.uuid = result.uuid
    t.priceId = result.priceId
    t.userUuid = result.userUuid
    t.productId = result.productId
    t.collectionImage =
      result.collectionImage ||
      'https://ipfs.io/ipfs/QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5/penguin/1.png'
    return t
  }
}

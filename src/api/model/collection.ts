import {randomUUID} from "crypto";

export default class Collection {
  public id: string | undefined
  public title = ''
  public description = ''
  public link = ''
  public rate: number
  public maxMint: number
  public uuid: string | undefined

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
    return t
  }
}

import Token from './token'

export default class StripeToken extends Token {
  // stripe matches products with product id and price id
  // when user defines in stripe payments use this

  public productId: string | undefined
  public priceId: string | undefined

  constructor(
    _contractAddress: string,
    _sequence: bigint,
    _ownerUUID: string,
    _isClaimed: boolean,
    _productId: string,
    _priceId: string
  ) {
    super(_contractAddress, _sequence, _ownerUUID, _isClaimed)
    this.productId = _productId
    this.priceId = _priceId
  }

  static fromDatabase(result: any): StripeToken {
    const t = new StripeToken(
      result.contractAddress,
      result.sequence,
      result.ownerUUID,
      result.isClaimed,
      result.productId,
      result.priceId
    )
    t.id = result.id
    return t
  }
}

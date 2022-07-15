export default class Token {
  public id: string | undefined
  public contractAddress: string
  public sequence: bigint
  public ownerUUID: string
  public isClaimed: boolean

  constructor(
    _contractAddress: string,
    _sequence: bigint,
    _ownerUUID: string,
    _isClaimed: boolean
  ) {
    this.contractAddress = _contractAddress
    this.sequence = _sequence
    this.ownerUUID = _ownerUUID
    this.isClaimed = _isClaimed
  }

  static fromDatabase(result: any): Token {
    const t = new Token(result.contractAddress, result.sequence, result.ownerUUID, result.isClaimed)
    t.id = result.id
    return t
  }
}

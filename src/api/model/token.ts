import web3 from 'web3'

export default class Token {
  public id: string | undefined
  public contractAddress: string = '0xdabc3A9a7e8d6448eD7846195f93278CE3A9c61B' // All tokens use same contract for MVP
  public sequence: bigint
  public ownerUUID: string
  public isClaimed: boolean
  public uniqueMintId: string | undefined

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

  addMintIdStamp(): string {
    const ans = web3.utils.toBN(web3.utils.randomHex(32)).toString(10)
    this.uniqueMintId = ans
    return ans
  }

  static fromDatabase(result: any): Token {
    const t = new Token(result.contractAddress, result.sequence, result.ownerUUID, result.isClaimed)
    t.id = result.id
    return t
  }
}

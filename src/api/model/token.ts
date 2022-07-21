import web3 from 'web3'
import {randomUUID} from 'crypto'

export default class Token {
  public id: string | undefined
  public contractAddress: string = '0x7f273afb22d33432e341de43484f9c7dac28bb5e' // All tokens use same contract for MVP
  public sequence: bigint | null
  public uuid: string
  public ownerUUID: string
  public collectionUUID: string
  public isClaimed: boolean
  public uniqueMintId: string | undefined

  constructor(
    _collectionUUID: string,
    _contractAddress: string,
    _ownerUUID: string,
    _isClaimed: boolean,
    _sequence: bigint | null = null
  ) {
    this.collectionUUID = _collectionUUID
    this.contractAddress = _contractAddress
    this.sequence = _sequence
    this.ownerUUID = _ownerUUID
    this.isClaimed = _isClaimed
    this.uuid = Token.generateUUID()
  }

  addMintIdStamp(): string {
    const ans = web3.utils.toBN(web3.utils.randomHex(32)).toString(10)
    this.uniqueMintId = ans
    return ans
  }

  static generateUUID(): string {
    return randomUUID()
  }

  static fromDatabase(result: any): Token {
    const t = new Token(
      result.collectionUUID,
      result.contractAddress,
      result.ownerUUID,
      result.isClaimed,
      BigInt(result.sequence)
    )
    t.id = result._id
    t.uuid = result.uuid
    return t
  }
}

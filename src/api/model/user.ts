import crypto, {randomUUID} from 'crypto'
import {UserType} from 'src/types/users'

export default class User {
  public id: string | undefined
  public uuid = ''
  public phone = ''
  public pendingCode = ''
  public codeHash = ''
  public lastSentCode: number = 0
  public userType: UserType = UserType.USER
  public stripeConnected: boolean = false
  public walletAddress: string = '' // users' wallet address after integrating sms wallet

  public name: string = ''
  public publicLink: string = ''
  public profileImage: string = ''
  public profileImageBg: string = ''
  public description: string = ''

  constructor(uuid: string, phone: string) {
    this.uuid = uuid || User.generateUUID()
    this.phone = phone
  }

  verify(code: string) {
    // TODO hash code and compare to pendingCode
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    console.log(hash, code, this.pendingCode, this.codeHash)
    return this.pendingCode === code && this.codeHash === hash
  }

  static generateUUID(): string {
    return randomUUID()
  }

  static fromDatabase(result: any, stripeConnected = false) {
    const u = new User(result.uuid, result.phone)
    u.id = result.id
    u.pendingCode = result.pendingCode // should we hide this?
    u.codeHash = result.codeHash // should we hide this?
    u.userType = result.userType || UserType.CREATOR
    u.stripeConnected = stripeConnected
    u.walletAddress = result.walletAddress
    u.name = result.name
    u.publicLink = result.publicLink
    u.profileImage = result.profileImage
    u.profileImageBg = result.profileImageBg
    u.description = result.description
    return u
  }
}

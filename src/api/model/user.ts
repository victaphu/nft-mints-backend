import {randomUUID} from 'crypto'

export default class User {
  public id: string | undefined
  public uuid = ''
  public phone = ''
  public pendingCode = ''

  constructor(id: string, uuid: string, phone: string) {
    this.id = id
    this.uuid = uuid || User.generateUUID()
    this.phone = phone
  }

  verify(code: string) {
    // TODO hash code and compare to pendingCode
    return true
  }

  static generateUUID(): string {
    return randomUUID()
  }

  static fromDatabase(result: any) {
    const u = new User(result.id, result.uuid, result.phone)
    u.pendingCode = result.pendingCode
    return u
  }
}

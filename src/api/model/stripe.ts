/**
 * Private info of user do not publish and should never be exposed beyond internally
 */
export default class StripeUser {
  public id: string | undefined
  public userUuid: string // connected to specific user

  public accessToken: string
  public refreshToken: string
  public stripeUserId: string
  public stripePublishableKey: string

  constructor(
    userUuid: string,
    accessToken: string,
    refreshToken: string,
    stripeUserId: string,
    stripePublishableKey: string
  ) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.stripePublishableKey = stripePublishableKey
    this.stripeUserId = stripeUserId
    this.userUuid = userUuid
  }

  static fromDatabase(result: any) {
    const u = new StripeUser(
      result.userUuid,
      result.accessToken,
      result.refreshToken,
      result.stripeUserId,
      result.stripePublishableKey
    )

    return u
  }
}

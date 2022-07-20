import Wallet from '../api/wallet'
import User from 'src/api/model/user'
import Token from 'src/api/model/token'
import {sendPostMintMessage, sendSMSCode, verifySMSCode} from 'src/controller/sms'
import Collection from 'src/api/model/collection'

export default async function mint(owner: User, collection: Collection) {
  // 1. TODO: Any preliminary stripe stuff?
  // VP: No preliminary stuff for stripe, it was already confirmed when the mint is called

  // 2. Mint on chain
  const wallet = new Wallet()
  // REFACTOR: user, collection likely makes more sense
  // VP: updated to collection; created token inside the mint function
  const token = await wallet.mint(owner, collection)

  // 3. Notify user
  await sendPostMintMessage(owner, token)
}

export async function initializeClaim(owner: User) {
  return sendSMSCode(owner.phone)
}

export async function finalizeClaim(
  owner: User,
  token: Token,
  destinationWallet: string,
  smsCode: string
) {
  const success = await verifySMSCode(owner.phone, smsCode)
  if (false && !success) throw new Error('Invalid SMS code') // TODO: Re-enable SMS verification

  // Note: transfer token does its own verification code check.
  // Should have in only one place or the other. Likely better here in the controller.
  const w = new Wallet()
  return await w.transferToken(token, destinationWallet, smsCode)
}

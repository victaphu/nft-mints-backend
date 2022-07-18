import Wallet from '../api/wallet'
import User from 'src/api/model/user'
import Token from 'src/api/model/token'
import {sendPostMintMessage, sendSMSCode, verifySMSCode} from 'src/controller/sms'

export default async function mint(owner: User, token: Token) {
  // 1. TODO: Any preliminary stripe stuff?

  // 2. Mint on chain
  const wallet = new Wallet()
  // REFACTOR: user, collection likely makes more sense
  await wallet.mint(owner, token)

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
  if (!success) throw new Error('Invalid SMS code')

  // Note: transfer token does its own verification code check.
  // Should have in only one place or the other. Likely better here in the controller.
  const w = new Wallet()
  const tx = await w.transferToken(token, destinationWallet, smsCode)
  return tx.wait()
}

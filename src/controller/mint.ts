import Wallet from '../api/wallet'
import User from 'src/api/model/user'
import Token from 'src/api/model/token'
import {sendPostMintMessage} from 'src/controller/sms'

export default class MintController {
  static async mint(owner: User, token: Token) {
    // 1. TODO: Any preliminary stripe stuff?

    // 2. Mint on chain
    const wallet = new Wallet()
    // REFACTOR: user, collection likely makes more sense
    await wallet.mint(owner, token)

    // 3. Notify user
    sendPostMintMessage(owner, token)
  }
}

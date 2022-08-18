import {UserType} from './users'

export interface PaymentCheckout {
  tokenId: string
  tokenAddress: string
  mobileNumber: string
  successUrl: string
  cancelUrl: string
}

export interface NFTInterface {
  collectionUuid: string
  quantity: number
}

export interface PaymentCheckoutv2 {
  nfts: Array<NFTInterface>
  mobileNumber: string
  smsCode?: number
  successUrl: string
  cancelUrl: string
  userId: string
}

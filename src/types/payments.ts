export interface PaymentCheckout {
  tokenId: string
  tokenAddress: string
  mobileNumber: string
  smsCode: number
  successUrl: string
  cancelUrl: string
}

/*
      nfts: [
        { // minting!
          nftAddress: "0x00",
          quantity: 2
        },
        { // purchase existing
          nftAddress: "0x00",
          nftIds: [1,2,3]
        }
      ],
*/
export interface NFTInterface {
  nftAddress: string
  quantity?: number
  nftIds?: Array<number>
  internal?: object
}

export interface PaymentCheckoutv2 {
  nfts: Array<NFTInterface>
  mobileNumber: string
  smsCode: number
  successUrl: string
  cancelUrl: string
}

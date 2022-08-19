export enum TokenType {
  ACCESS_PASS = 1,
  COLLECTION = 2,
  AIRDROP = 3,
}

export interface CollectionCreate {
  title: string | 'Anonymous Collection'
  description: string | ''
  link: string | ''
  rate: number | 0
  maxMint: number | 1
  ownerUUID: string
  collectionImage: string | ''
  collectionImages: string[] | null
  tokenType: TokenType
  perks: string | ''
  creatorRoyalty: number | 0
  additionalDetails: string | ''
  properties: object | {}
}

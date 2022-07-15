// nft0 prod_LzqIjVSB5nx2Mr
// nft1 prod_LzqQgZaPWQC9tF

const dataObj = {
  nfts: [
    {
      type: 0, // nft pre-minted and selling
      stripeProductId: 'prod_LzqIjVSB5nx2Mr',
      nftAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      nftType: 721,
      mintable: false,
      nftIds: [400, 1004],
      creator: {
        name: 'John Smith',
        id: '0x12345',
        profileImage: 'https://randomuser.me/api/portraits/men/75.jpg',
        social: {
          twitter: 'https://twitter.com',
          instagram: 'https://instagram/com',
          website: 'https://random.john.smith.one',
          email: 'johnsmith@example.com',
          discord: 'https://discord.com',
        },
      },
      metadata: {
        400: {
          image: 'https://ipfs.io/ipfs/QmRgADRke5wfwzRpSveE7HNHnnS2dsDEBJXRSU9GmjD8SE',
          attributes: [
            {trait_type: 'Fur', value: 'Dark Brown'},
            {trait_type: 'Clothes', value: 'Tie Dye'},
            {trait_type: 'Eyes', value: 'Cyborg'},
            {trait_type: 'Hat', value: `Fisherman's Hat`},
            {trait_type: 'Background', value: 'Army Green'},
            {trait_type: 'Mouth', value: 'Phoneme Wah'},
          ],
        },
        1004: {
          image: 'https://ipfs.io/ipfs/QmRjHJG2bhvhmCD3bH9gDUqiuDdXuwCVmBhgMfGFBVh6Ns',
          attributes: [
            {trait_type: 'Earring', value: 'Silver Stud'},
            {trait_type: 'Hat', value: 'Halo'},
            {trait_type: 'Background', value: 'Purple'},
            {trait_type: 'Fur', value: 'Black'},
            {trait_type: 'Clothes', value: 'Sailor Shirt'},
            {trait_type: 'Eyes', value: 'Wide Eyed'},
            {trait_type: 'Mouth', value: 'Small Grin'},
          ],
        },
      },
    },
    {
      type: 1, // nft minting on purchase
      stripeProductId: 'prod_LzqQgZaPWQC9tF',
      nftAddress: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
      nftType: 721,
      mintable: true,
      maxSupply: 100,
      currentSupply: 90,
      maxMint: 1, // max mint per request
      creator: {
        name: 'Janet Smith',
        id: '0x1234567',
        profileImage: 'https://randomuser.me/api/portraits/women/64.jpg',
        social: {
          twitter: 'https://twitter.com',
          instagram: 'https://instagram/com',
          website: 'https://random.john.smith.one',
          email: 'janetsmith@example.com',
          discord: 'https://discord.com',
        },
      },
      metadata: {
        0: {
          attributes: [
            {
              trait_type: 'Background',
              value: 'Beige',
            },
            {
              trait_type: 'Skin',
              value: 'Light Gray',
            },
            {
              trait_type: 'Body',
              value: 'Tribal Necklace',
            },
            {
              trait_type: 'Face',
              value: 'Beard',
            },
            {
              trait_type: 'Head',
              value: 'Bowl Cut',
            },
          ],
          description:
            'A collection 8888 Cute Chubby Pudgy Penquins sliding around on the freezing ETH blockchain.',
          image:
            'https://ipfs.io/ipfs/QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5/penguin/1.png',
          name: 'Pudgy Penguin #1',
        },
      },
    },
  ],
}

export default dataObj

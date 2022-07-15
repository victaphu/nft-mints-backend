import logo from './logo.svg'
import './App.css'
import {useEffect, useState} from 'react'
import axios from 'axios'

function App() {
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState([])
  const [nfts, setNfts] = useState([])
  const [creator, setCreator] = useState(0)
  const [selectedNfts, setSelectedNfts] = useState([])

  const [mobileNumber, setMobileNumber] = useState(12345)
  const [smsCode, setSmsCode] = useState(1235)

  // get list of nfts
  useEffect(() => {
    console.log('Fetching data')
    axios
      .get('https://smsnftgateway.herokuapp.com/v0/tokens')
      .then((response) => {
        console.log(response)
        setNfts(response.data.nfts)
      })
      .catch((e) => console.error(e))
  }, [filters, page])

  // let user select nft to purchase
  async function purchaseNfts() {
    const body = {
      nfts: selectedNfts,
      mobileNumber: mobileNumber,
      smsCode: smsCode,
      successUrl: 'url',
      cancelUrl: 'cancel url',
    }
  }

  function renderNft(nft) {
    return (
      <div>
        {Object.keys(nft.metadata).map((tokenId) => {
          return (
            <div style={{display: 'inline-block', padding: '8px'}}>
              <img height="200px" src={nft.metadata[tokenId].image}></img>
            </div>
          )
        })}
      </div>
    )
  }

  if (nfts.length === 0) {
    return <div>Loading ...</div>
  }

  // select nft to purchase
  return (
    <div className="App">
      Collection:{' '}
      <select onChange={(event) => setCreator(event.target.value)}>
        {nfts.map((nft, index) => {
          return (
            <option value={index} key={index}>
              {nft.creator.name} - {nft.nftAddress}
            </option>
          )
        })}
      </select>
      <h1>NFTs - {nfts[creator].creator.name}</h1>
      <div>{renderNft(nfts[creator])}</div>
    </div>
  )
}

export default App

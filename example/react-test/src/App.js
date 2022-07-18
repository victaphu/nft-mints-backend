import './App.css'
import {useEffect, useState} from 'react'
import axios from 'axios'
import * as FA from 'react-icons/fa'

const GATEWAY = 'https://smsnftgateway.herokuapp.com'
const REDIRECT_URL_SUCCESS = 'http://localhost:3001/'
const REDIRECT_URL_FAILURE = 'http://localhost:3001/'

function App() {
  const [page, ] = useState(0)
  const [filters, ] = useState([])
  const [nfts, setNfts] = useState([])
  const [creator, setCreator] = useState(0)
  const [selectedNfts, setSelectedNfts] = useState([])
  const [smsSent, setSmsSent] = useState(false)
  const [mobileNumber, setMobileNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')

  // get list of nfts
  useEffect(() => {
    console.log('Fetching data')
    axios
      .get(`${GATEWAY}/v0/tokens`)
      .then((response) => {
        console.log(response)
        setNfts(response.data.collections)
      })
      .catch((e) => console.error(e))
  }, [filters, page])

  // let user select nft to purchase
  async function purchaseNfts() {
    if (smsCode.length === 0 || mobileNumber.length === 0 || selectedNfts.length === 0) {
      return
    }

    const nfts = {}

    selectedNfts.map((token) => {
      if (!nfts[token.nftAddress]) {
        nfts[token.nftAddress] = {
          nftAddress: token.nftAddress,
          nftIds: [],
        }
      }
      nfts[token.nftAddress].nftIds.push(token.tokenId)
      return token
    })

    const body = {
      nfts: Object.values(nfts),
      mobileNumber: mobileNumber,
      smsCode: smsCode,
      successUrl: REDIRECT_URL_SUCCESS,
      cancelUrl: REDIRECT_URL_FAILURE,
    }

    const res = await fetch(`${GATEWAY}/v0/payment/checkoutv2`, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    window.location.href = (await res.json()).url
  }

  function selectCollection(collection) {
    setCreator(collection)
  }

  function toggleTokenSelection(token, value) {
    if (selectedNfts.find((t) => t.tokenId === token.tokenId)) {
      setSelectedNfts(selectedNfts.filter((e) => e.tokenId !== token.tokenId))
    } else {
      setSelectedNfts([...selectedNfts, token])
    }
  }

  function renderSelection(nftType, token) {
    if (nftType === 0) {
      // single select tokens
      return (
        <div>
          Purchase:{' '}
          <input
            type="checkbox"
            onChange={(e) => toggleTokenSelection(token)}
            checked={selectedNfts.find((t) => t.tokenId === token.tokenId) ? true : false}
          ></input>
        </div>
      )
    }

    // mintable tokens
    return (
      <div>
        Mint:
        <input type="number" onChange={(e) => toggleTokenSelection(token, e.target.value)}></input>
      </div>
    )
  }

  async function sendSmsCode() {
    if (mobileNumber.length <= 0) {
      return
    }
    // result
    await fetch(`${GATEWAY}/v0/sms/verify`, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: mobileNumber,
      }),
    })
    setSmsSent(true)
  }

  function renderTokenDetails(token) {
    return (
      <div style={{columnCount: 2, margin: '5px'}}>
        <div>Price:</div>
        <div>USD ${token.priceUSD}</div>
        <div>TokenId:</div>
        <div>{token.tokenId}</div>
      </div>
    )
  }

  function renderNftDetails(nft) {
    return (
      <div style={{margin: '5px'}}>
        Creator: {nft.creator.name}
        <div style={{columnCount: 5, paddingTop: '10px'}}>
          <div>
            <FA.FaFacebook></FA.FaFacebook>
          </div>
          <div>
            <FA.FaTwitter></FA.FaTwitter>
          </div>
          <div>
            <FA.FaInstagram></FA.FaInstagram>
          </div>
          <div>
            <FA.FaGlobe></FA.FaGlobe>
          </div>
          <div>
            <FA.FaDiscord></FA.FaDiscord>
          </div>
        </div>
      </div>
    )
  }

  function renderNft(nft) {
    return (
      <div>
        {nft.tokens.map((token, index) => {
          return (
            <div
              key={index}
              style={{display: 'inline-block', margin: '8px', padding: '4px', border: 'solid'}}
            >
              <div>
                <img height='200px' alt='token for nft' src={token.metadata.image}></img>
                <br />
                {renderTokenDetails(token)}
                {renderSelection(nft.type, token)}
                {renderNftDetails(nft)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderPurchaseInformation() {
    let total = 0
    return (
      <div
        style={{
          width: '300px',
          margin: 'auto',
          marginTop: '10px',
          marginBottom: '10px',
          border: 'solid 1px black',
          padding: '10px',
        }}
      >
        Tokens Selected:
        <hr />
        <ul>
          {selectedNfts.map((nft, index) => {
            total += +nft.priceUSD
            return (
              <li key={index}>
                {nft.tokenId} - USD${nft.priceUSD}
              </li>
            )
          })}
        </ul>
        <hr />
        <div>Total: USD${total}</div>
      </div>
    )
  }

  function renderCheckout() {
    return (
      <div style={{width: '300px', margin: 'auto'}}>
        <div>
          Mobile:{' '}
          <input
            type="text"
            onChange={(e) => {
              setSmsSent(false)
              setMobileNumber(e.target.value)
            }}
            value={mobileNumber}
          />
          <button disabled={smsSent} onClick={(e) => sendSmsCode()}>
            Send Code
          </button>
        </div>
        <br />
        <div>
          SMS Code:{' '}
          <input
            type="text"
            disabled={!smsSent}
            onChange={(e) => setSmsCode(e.target.value)}
            value={smsCode}
          />
        </div>
        <button
          disabled={
            selectedNfts.length === 0 ||
            !smsSent ||
            smsCode.length === 0 ||
            mobileNumber.length === 0
          }
          onClick={purchaseNfts}
        >
          Purchase NFTs
        </button>
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
      <select onChange={(event) => selectCollection(event.target.value)}>
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
      <div>{renderPurchaseInformation()}</div>
      <div>{renderCheckout()}</div>
    </div>
  )
}

export default App

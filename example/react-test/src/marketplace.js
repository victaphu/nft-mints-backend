import './App.css'
import {useEffect, useState} from 'react'
import axios from 'axios'
import {useParams} from 'react-router'

// const GATEWAY = 'http://smsnftgateway.herokuapp.com'
const GATEWAY = 'http://localhost:3000'
const REDIRECT_URL_SUCCESS = 'https://d3jn-sms-minter.netlify.app/:userUuid'
const REDIRECT_URL_FAILURE = 'https://d3jn-sms-minter.netlify.app/:userUuid'

function Marketplace() {
  const [page] = useState(0)
  const [filters] = useState([])
  const [nfts, setNfts] = useState([])
  const [selectedNfts, setSelectedNfts] = useState([])
  const [smsSent, setSmsSent] = useState(true)
  const [mobileNumber, setMobileNumber] = useState('+6584901105')
  const [smsCode, setSmsCode] = useState('05270')
  const [buying, setBuying] = useState(false)

  const params = useParams()

  // get list of nfts
  useEffect(() => {
    console.log('Fetching data')
    if (params.collectionUuid) {
      axios
        .get(`${GATEWAY}/v0/collections/${params.collectionUuid}`)
        .then((response) => {
          console.log(response)
          setNfts([response.data])
        })
        .catch((e) => console.error(e))
    } else {
      axios
        .get(`${GATEWAY}/v0/collections/all`)
        .then((response) => {
          console.log(response)
          setNfts(response.data)
        })
        .catch((e) => console.error(e))
    }
  }, [filters, page, params.collectionUuid])

  // let user select nft to purchase
  async function purchaseNfts() {
    if (smsCode.length === 0 || mobileNumber.length === 0 || selectedNfts.length === 0) {
      return
    }

    const body = {
      nfts: selectedNfts.map((collection) => {
        return {collectionUuid: collection.uuid, quantity: 1}
      }),
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

    setBuying(false)

    window.location.href = (await res.json()).url
  }

  function toggleTokenSelection(token, value) {
    if (selectedNfts.find((t) => t.uuid === token.uuid)) {
      setSelectedNfts(selectedNfts.filter((e) => e.uuid !== token.uuid))
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
            checked={selectedNfts.find((t) => t.uuid === token.uuid) ? true : false}
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
      <div style={{columnCount: 1, margin: '5px'}}>
        <div style={{fontSize: '10px'}}>
          <a href={`/purchase/${token.uuid}`}>{token.uuid}</a>
        </div>
        <div>Title: {token.title}</div>
        <div>Price:</div>
        <div>USD ${token.rate}</div>
        <div>Total:</div>
        <div>{token.maxMint}</div>
      </div>
    )
  }

  function renderNft(nfts) {
    return (
      <div>
        {nfts.map((token, index) => {
          return (
            <div
              key={index}
              style={{display: 'inline-block', margin: '8px', padding: '4px', border: 'solid'}}
            >
              <div>
                <img height="200px" alt="nft token" src={token.collectionImage}></img>
                <br />
                {renderTokenDetails(token)}
                {renderSelection(0, token)}
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
            total += +nft.rate
            return (
              <li key={index}>
                {nft.title} - USD${nft.rate}
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
            mobileNumber.length === 0 ||
            buying
          }
          onClick={(e) => {
            purchaseNfts()
            setBuying(true)
          }}
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
    <div>
      Collection: <div>{renderNft(nfts)}</div>
      <div>{renderPurchaseInformation()}</div>
      <div>{renderCheckout()}</div>
    </div>
  )
}

export default Marketplace

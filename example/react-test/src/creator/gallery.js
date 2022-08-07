import {useEffect, useState} from 'react'
import axios from 'axios'
import {useNavigate, useParams} from 'react-router'

const GATEWAY = 'https://smsnftgateway2.herokuapp.com'

// todo: short cut at the moment
// it just grabs all the collections and the front end apply filter on type
// future will be more complex api
const selected = ['Access Pass', 'Air drop', 'Collections']

function Gallery() {
  const navigate = useNavigate()
  const [page] = useState(0)
  const [filters] = useState([])
  const [loading, setLoading] = useState(false)
  const [nfts, setNfts] = useState([])
  const [userDetails, setUserDetails] = useState({})
  const [selectedNfts, setSelectedNfts] = useState([])

  const params = useParams()

  const [view, setView] = useState(3) // 3 = collections, 2 = air drop, 1 = access pass

  // get list of nfts
  useEffect(() => {
    console.log('Fetching data')
    setLoading(true)
    axios
      .get(`${GATEWAY}/v0/collections/mycollections`, {
        withCredentials: true,
      })
      .then((response, error) => {
        console.log(response, error)
        const data = response.data
        setNfts(data.collections)
        setUserDetails(data.user)
        setLoading(false)
      })
      .catch((e) => {
        console.log(e)
        // redirect creator to login
        navigate('/creator/login')
      })
  }, [filters, page, params.collectionUuid, navigate])

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
        {nfts
          .filter((e) => e.tokenType === view)
          .map((token, index) => {
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

  if (loading) {
    return <div>Loading ...</div>
  }

  // select nft to purchase
  return (
    <div>
      {userDetails?.stripeConnected === false && (
        <button onClick={(e) => navigate('/creator/connect')}>Connect Stripe to Sell NFTs</button>
      )}

      {nfts.length === 0 && <div>You don't have any NFTs at the moment, mint some!</div>}
      <button onClick={(e) => setView(3)} disabled={view === 3}>
        Collections
      </button>
      <button onClick={(e) => setView(1)} disabled={view === 1}>
        Access Passes
      </button>
      <button onClick={(e) => setView(2)} disabled={view === 2}>
        Airdrops
      </button>
      <button onClick={(e) => navigate('/creator/create')}>Create</button>

      {nfts.length > 0 && (
        <div>
          {selected[view - 1]}: <div>{renderNft(nfts)}</div>
        </div>
      )}
    </div>
  )
}

export default Gallery

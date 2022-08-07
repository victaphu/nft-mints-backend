import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router'

const GATEWAY = 'https://smsnftgateway2.herokuapp.com'
// const GATEWAY = 'http://localhost:3000'
function CreateCollection() {
  const navigate = useNavigate()
  // Create Collection (once created redirect to the collectibles page)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [rate, setRate] = useState(0)
  const [supply, setSupply] = useState(100)
  const [userId] = useState('') // hard coded user id for now
  const [submitting, setSubmitting] = useState(false)
  const [tokenType, setTokenType] = useState('3')
  const [launch, setLaunch] = useState(false)

  const [checkLogin, setCheckLogin] = useState(false)
  const [userDetails, setUserDetails] = useState({})

  async function submitData() {
    if (url.length === 0 || title === 0 || supply === 0) {
      return
    }
    setSubmitting((e) => {
      return true
    })
    // submit
    const result = await fetch(`${GATEWAY}/v0/collections/create`, {
      method: 'POST',
      redirect: 'follow',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionImage: url,
        title,
        description,
        link,
        rate,
        maxMint: supply,
        userId,
        tokenType,
        launch,
      }),
    })
    console.log(await result.json())

    window.location = '/creator/'

    setSubmitting((e) => {
      return false
    })
  }

  useEffect(() => {
    if (checkLogin) return
    console.log('checking login')
    //
    fetch(`${GATEWAY}/v0/users/whoami`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (result) => {
        console.log(result)
        if (result.status !== 200) {
          navigate('/creator/login')
        } else {
          setCheckLogin(true)
          setUserDetails(await result.json())
        }
      })
      .catch((e) => {
        console.log(e)
        navigate('/creator/login')
      })
  }, [checkLogin, navigate])

  if (!checkLogin) {
    return <div>Loading ...</div>
  }

  return (
    <div style={{textAlign: 'right', margin: 'auto', width: '300px'}}>
      <div>
        <span>Image URL:</span>{' '}
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div>
        <span>Title:</span>{' '}
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <span>Description:</span>{' '}
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <span>Link:</span>{' '}
        <input type="text" value={link} onChange={(e) => setLink(e.target.value)} />
      </div>
      {userDetails?.stripeConnected && (
        <div>
          <span>Price (USD):</span>{' '}
          <input type="number" value={rate} onChange={(e) => setRate(+e.target.value)} />
        </div>
      )}
      <div>
        <span>Max Supply:</span>{' '}
        <input type="number" value={supply} onChange={(e) => setSupply(+e.target.value)} />
      </div>
      <div>
        <span>Token Type:</span>{' '}
        <select value={tokenType} onChange={(e) => setTokenType(e.target.value)}>
          {userDetails.stripeConnected && <option value="1">Access pass</option>}
          <option value="2">Airdrop</option>
          {userDetails.stripeConnected && <option value="3">Collection</option>}
        </select>
      </div>
      <div>
        <span>Launch Collection: </span>{' '}
        <input
          type="checkbox"
          name="launch"
          checked={launch}
          onClick={(e) => setLaunch(e.checked)}
        />
      </div>
      <button disabled={submitting} onClick={submitData}>
        Create!
      </button>{' '}
      <br />
    </div>
  )
}

export default CreateCollection

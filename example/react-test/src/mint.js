import {useState} from 'react'
import './App.css'

const GATEWAY = 'https://smsnftgateway2.herokuapp.com'
// const GATEWAY = 'http://localhost:3000'
function Mint() {
  // Create Collection (once created redirect to the collectibles page)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [rate, setRate] = useState(10)
  const [supply, setSupply] = useState(100)
  const [userId] = useState('') // hard coded user id for now
  const [submitting, setSubmitting] = useState(false)

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
      }),
    })

    console.log(result)

    setSubmitting((e) => {
      return false
    })
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
      <div>
        <span>Price (USD):</span>{' '}
        <input type="number" value={rate} onChange={(e) => setRate(+e.target.value)} />
      </div>
      <div>
        <span>Max Supply:</span>{' '}
        <input type="number" value={supply} onChange={(e) => setSupply(+e.target.value)} />
      </div>
      <button disabled={submitting} onClick={submitData}>
        Create!
      </button>{' '}
      <br />
    </div>
  )
}

export default Mint

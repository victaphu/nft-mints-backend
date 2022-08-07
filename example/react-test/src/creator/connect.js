// capture mobile and forward to sms wallet
import {useState} from 'react'
import Cookies from 'js-cookie'
import {useNavigate} from 'react-router'

// const GATEWAY = 'https://smsnftgateway.herokuapp.com'
const GATEWAY = 'http://localhost:3000'
function Connect() {
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState(false)

  const connect = async () => {
    const res = await fetch(`${GATEWAY}/v0/stripe/get-oauth-link`, {
      method: 'GET',
      credentials: 'include',
    })
    const {url} = await res.json()
    window.location = url
  }

  return (
    <div style={{textAlign: 'left', margin: 'auto', width: '300px'}}>
      <h2>Connect your stripe account</h2>
      <p>
        Connect your stripe account to d3jn to collect payments. Connect now or later. If you are
        not connected you won't be able to receive payments and create d3jn NFTs with price
      </p>

      <button
        disabled={connecting}
        onClick={(e) => {
          setConnecting(true)
          connect()
        }}
      >
        Connect Stripe
      </button>
      <br></br>
      <a
        href="#"
        referrerPolicy="no-referrer"
        onClick={(e) => {
          if (connecting) return
          navigate('/creator')
        }}
      >
        Skip
      </a>
    </div>
  )
}

export default Connect

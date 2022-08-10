// capture mobile and forward to sms wallet
import {useState} from 'react'
import {useNavigate} from 'react-router'
import {
  initLogin as commInitLogin,
  initLogin,
  logout as commLogout,
  whoami as commWhoAmI,
} from './communicator'

const GATEWAY = 'https://smsnftgateway2.herokuapp.com'
// const GATEWAY = 'http://localhost:3000'

function Login() {
  const [mobileNumber, setMobileNumber] = useState('+6584901105')
  const [connecting, setConnecting] = useState(false)
  const navigate = useNavigate()

  const connect = async () => {
    const res = await fetch(`${GATEWAY}/v0/users/phone/${mobileNumber}`, {
      method: 'GET',
      credentials: 'include',
    })

    // now we get the stuff to sign!
    const sign = await initLogin({})

    setConnecting(false)

    const params = `callback=${sign.callback}&message=${sign.message}&caller=${sign.caller}`
    window.location.href = `https://smswallet.xyz/sign?${params}`
  }

  return (
    <div style={{textAlign: 'left', margin: 'auto', width: '300px'}}>
      <h2>Login to your d3jn creator account!</h2>

      <div style={{width: '300px', margin: 'auto'}}>
        <div>
          Mobile:{' '}
          <input
            type="text"
            disabled={connecting}
            onChange={(e) => {
              setMobileNumber(e.target.value)
            }}
            value={mobileNumber}
          />
        </div>

        <button
          disabled={mobileNumber.length === 0 || connecting}
          onClick={async (e) => {
            setConnecting(true)
            connect()
          }}
        >
          Login to SMS Wallet
        </button>
        <p>
          Don't have an account? <a href="/creator/register">Register</a>
        </p>
      </div>
    </div>
  )
}

export default Login

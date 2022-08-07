// capture mobile and forward to sms wallet

import {useState} from 'react'
import Cookies from 'js-cookie'
import {useNavigate} from 'react-router'

// const GATEWAY = 'https://smsnftgateway.herokuapp.com'
const GATEWAY = 'http://localhost:3000'
function Register() {
  const [mobileNumber, setMobileNumber] = useState('+6584901105')
  const [connecting, setConnecting] = useState(false)
  const navigate = useNavigate()

  const register = async () => {
    const res = await fetch(`${GATEWAY}/v0/users/phone/${mobileNumber}`, {
      method: 'GET',
    })
    setConnecting(false)
    console.log(res) // session created with registered user
    window.open(
      'https://smswallet.xyz',
      '_blank',
      'location=yes,height=730,width=400,scrollbars=yes,status=yes'
    )

    // redirect to stripe
    navigate('/creator/connect')
  }

  return (
    <div style={{textAlign: 'left', margin: 'auto', width: '300px'}}>
      <h2>Register as a d3jn creator!</h2>

      <div style={{width: '300px', margin: 'auto'}}>
        <div>
          Mobile:{' '}
          <input
            type="text"
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
            register()
          }}
        >
          Continue to SMS Wallet
        </button>
        <p>
          Have an account already? <a href="/creator/login">Login</a>
        </p>
      </div>
    </div>
  )
}

export default Register

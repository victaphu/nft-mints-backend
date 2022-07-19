import './App.css'
import {useParams} from 'react-router-dom'

const GATEWAY = 'https://smsnftgateway.herokuapp.com'
const REDIRECT_URL_SUCCESS = 'http://localhost:3001/'
const REDIRECT_URL_FAILURE = 'http://localhost:3001/'

function Buy() {
  const match = useParams()
  console.log(match)
  // select nft to purchase
  return <div>Nft Image Link: Name: Description: External Link: Quantity: Price:</div>
}

export default Buy

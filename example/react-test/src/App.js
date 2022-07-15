import logo from './logo.svg'
import './App.css'
import {useEffect, useState} from 'react'
import axios from 'axios'

function App() {
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState([])
  const [nfts, setNfts] = useState([])

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

  // get list of nfts

  // let user select nft to purchase

  // select nft to purchase

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  )
}

export default App

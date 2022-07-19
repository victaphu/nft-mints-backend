import './App.css'
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom'
import Marketplace from './marketplace'
import Buy from './buy'

const GATEWAY = 'https://smsnftgateway.herokuapp.com'
const REDIRECT_URL_SUCCESS = 'http://localhost:3001/'
const REDIRECT_URL_FAILURE = 'http://localhost:3001/'

function App() {
  // select nft to purchase
  // return (
  //   <div className="App">
  //     Collection:{' '}
  //     <select onChange={(event) => selectCollection(event.target.value)}>
  //       {nfts.map((nft, index) => {
  //         return (
  //           <option value={index} key={index}>
  //             {nft.creator.name} - {nft.nftAddress}
  //           </option>
  //         )
  //       })}
  //     </select>
  //     <h1>NFTs - {nfts[creator].creator.name}</h1>
  //     <div>{renderNft(nfts[creator])}</div>
  //     <div>{renderPurchaseInformation()}</div>
  //     <div>{renderCheckout()}</div>
  //   </div>
  // )

  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/">Marketplace</Link>
            </li>
            <li>
              <Link to="/create">Create</Link>
            </li>
            <li>
              <Link to="/purchase/:collectionUuid">Purchase</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Marketplace />}></Route>
          <Route path="/purchase/:collectionUuid" element={<Buy />}></Route>
          <Route path="/create"></Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App

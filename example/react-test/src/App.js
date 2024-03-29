import './App.css'
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom'
import Marketplace from './marketplace'
import Register from './creator/register'
import Login from './creator/login'
import Connect from './creator/connect'
import Gallery from './creator/gallery'
import CreateCollection from './creator/createcollection'
import Verify from './creator/verify'

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/">Marketplace</Link>
            </li>
            <li>
              <Link to="/purchase/:collectionUuid">Purchase</Link>
            </li>

            <li>
              <Link to="/creator/">Creators</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Marketplace />}></Route>
          <Route path="/purchase/:collectionUuid" element={<Marketplace />}></Route>
          <Route path="/creator" element={<Gallery />}></Route>
          <Route path="/creator/login" element={<Login />}></Route>
          <Route path="/creator/connect" element={<Connect />}></Route>
          <Route path="/creator/register" element={<Register />}></Route>
          <Route path="/creator/create" element={<CreateCollection />}></Route>
          <Route path="/creator/verify" element={<Verify />}></Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App

import './App.css'
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom'
import Marketplace from './marketplace'
import Mint from './mint'

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
              <Link to="/create">Create</Link>
            </li>
            <li>
              <Link to="/purchase/:collectionUuid">Purchase</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Marketplace />}></Route>
          <Route path="/purchase/:collectionUuid" element={<Marketplace />}></Route>
          <Route path="/create" element={<Mint />}></Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App

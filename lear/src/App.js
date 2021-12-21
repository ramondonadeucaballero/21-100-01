import Header from "./Components/header";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Graphs from "./Pages/Graphs/graphs";
import Options from "./Pages/Options/options";

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="appBody">
          <Routes>
            <Route exact path="/" element={<Graphs />} />
            <Route path="/options" element={<Options />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

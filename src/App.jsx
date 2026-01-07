import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Map from "./pages/Map.jsx";

const App = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </div>
  );
};

export default App;

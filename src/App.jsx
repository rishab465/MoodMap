import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Map from "./pages/Map.jsx";

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-white text-slate-800">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </div>
  );
};

export default App;

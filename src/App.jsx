import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Map from "./pages/Map.jsx";
import { ThemeProvider, useTheme } from "./theme/ThemeContext.jsx";

const AppContent = () => {
  const { theme } = useTheme();

  return (
    <div className={`theme-shell min-h-screen transition-all duration-500 ease-out ${theme.className}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;

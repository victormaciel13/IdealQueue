import { BrowserRouter as Router, Routes, Route } from "react-router";
import ReceptionPage from "@/react-app/pages/Reception";
import DisplayPage from "@/react-app/pages/Display";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ReceptionPage />} />
        <Route path="/display" element={<DisplayPage />} />
      </Routes>
    </Router>
  );
}

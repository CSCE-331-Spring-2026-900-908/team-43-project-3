import { Routes, Route } from "react-router-dom";
import Portal from "./pages/Portal";
import CustomerKiosk from "./pages/CustomerKiosk";
import CashierPOS from "./pages/CashierPOS";
import ManagerDashboard from "./pages/ManagerDashboard";
import MenuBoard from "./pages/MenuBoard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Portal />} />
      <Route path="/customer/*" element={<CustomerKiosk />} />
      <Route path="/cashier/*" element={<CashierPOS />} />
      <Route path="/manager/*" element={<ManagerDashboard />} />
      <Route path="/menuboard" element={<MenuBoard />} />
    </Routes>
  );
}

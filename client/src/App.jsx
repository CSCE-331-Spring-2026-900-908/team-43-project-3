/**
 * Application route map.
 *
 * This component selects the correct top-level experience for each role
 * while keeping the portal as the shared landing page.
 *
 * @returns {JSX.Element}
 */
import { Routes, Route } from "react-router-dom";
import { TranslationProvider } from "./contexts/TranslationContext";
import { AuthProvider } from "./contexts/AuthContext";
import AccessibilityToolbar from "./components/AccessibilityToolbar";
import AuthGate from "./components/AuthGate";
import Portal from "./pages/Portal";
import CustomerKiosk from "./pages/CustomerKiosk";
import CashierPOS from "./pages/CashierPOS";
import ManagerDashboard from "./pages/ManagerDashboard";
import MenuBoard from "./pages/MenuBoard";

export default function App() {
  return (
    <AuthProvider>
      <TranslationProvider>
        <div id="app-content">
          <Routes>
            <Route path="/" element={<Portal />} />
            <Route path="/customer/*" element={<CustomerKiosk />} />
            <Route
              path="/cashier/*"
              element={(
                <AuthGate allowedRoles={["cashier", "manager"]} title="Cashier POS">
                  <CashierPOS />
                </AuthGate>
              )}
            />
            <Route
              path="/manager/*"
              element={(
                <AuthGate allowedRoles={["manager"]} title="Manager Dashboard">
                  <ManagerDashboard />
                </AuthGate>
              )}
            />
            <Route path="/menuboard" element={<MenuBoard />} />
          </Routes>
        </div>
        <AccessibilityToolbar />
      </TranslationProvider>
    </AuthProvider>
  );
}
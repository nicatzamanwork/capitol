import React, { useState, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

// Layout & Auth
import Sidebar from "./components/layout/Sidebar";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";

// Internal Pages
import GoalsPage from "./components/GoalsPage";
import IntelligencePage from "./components/IntelligencePage";
import OverviewPage from "./components/OverviewPage";
import AccountsPage from "./components/AccountsPage";
import DebtsPage from "./components/DebtsPage";
import EligibilityPage from "./components/EligibilityPage";

// 🚀 1. Qlobal Financial Context Yaradırıq
const FinancialContext = createContext();

export function useFinancial() {
  return useContext(FinancialContext);
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [authView, setAuthView] = useState("landing");
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const handleGlobalErrors = (event) => {
      if (event.detail && event.detail.status === 401) {
        handleLogout();
      }
    };

    window.addEventListener("auth-error", handleGlobalErrors);
    return () => window.removeEventListener("auth-error", handleGlobalErrors);
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setAuthView("landing");
    console.log("✅ Giriş uğurludur, Dashboard-a yönləndirilir...");
    navigate("/overview");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_financials"); // 👈 Çıxış edəndə yaddaşdakı maliyyə məlumatlarını da təmizləyirik
    setIsAuthenticated(false);
    setAuthView("login");
    navigate("/");
    console.log("🚀 Sessiya uğurla sonlandırıldı.");
  };

  const isAdvisorPage = location.pathname === "/advisor";

  return (
    <div className="h-screen w-screen bg-black text-white font-sans overflow-hidden">
      {isAuthenticated ? (
        <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
          <Sidebar onLogout={handleLogout} />

          <main className="flex-1 h-full flex flex-col overflow-hidden relative">
            <div
              className={`flex-1 h-full w-full max-w-[1600px] mx-auto relative z-10 flex flex-col overflow-hidden ${
                isAdvisorPage ? "p-0" : "p-4 md:p-8 overflow-y-auto"
              }`}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/overview" replace />} />
                <Route path="/overview" element={<OverviewPage />} />
                {/* <Route path="/accounts" element={<AccountsPage />} /> */}
                <Route path="/advisor" element={<IntelligencePage />} />
                {/* <Route path="/goals" element={<GoalsPage />} /> */}
                {/* <Route path="/debts" element={<DebtsPage />} /> */}
                <Route path="/eligibility" element={<EligibilityPage />} />
                <Route path="*" element={<Navigate to="/overview" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      ) : (
        <Routes>
          <Route
            path="*"
            element={
              authView === "landing" ? (
                <LandingPage onStart={() => setAuthView("login")} />
              ) : authView === "login" ? (
                <LoginPage
                  onLogin={handleLogin}
                  onSwitchRegister={() => setAuthView("register")}
                />
              ) : (
                <RegisterPage onSwitchLogin={() => setAuthView("login")} />
              )
            }
          />
        </Routes>
      )}
    </div>
  );
}

// 🚀 2. Əsas App Komponentində Provayderi Qururuq
export default function App() {
  // 💾 İLKIN YÜKLƏNMƏ: Səhifə açılanda brauzerin localStorage yaddaşını yoxlayırıq
  const [financialData, setFinancialData] = useState(() => {
    const savedData = localStorage.getItem("user_financials");
    if (savedData) {
      return JSON.parse(savedData); // Əgər yaddaşda data varsa, birbaşa onu yükləyirik
    }
    // Yoxdursa, ilkin boş şablonla başlayır
    return {
      monthlyIncome: 0,
      monthlyDebtPayments: 0,
      dtiRatio: 0,
      creditScore: 742,
      totalAssets: 0,
      totalDebts: 0,
      isAnalyzed: false,
    };
  });

  // Datanı yeniləyən, DTI-ı avtomatik hesablayan və local dbyə (localStorage) yazan funksiya
  const updateFinancials = (newData) => {
    setFinancialData((prev) => {
      const updated = { ...prev, ...newData };

      // DTI Hesablanması: (Aylıq Borc / Aylıq Gəlir) * 100
      if (updated.monthlyIncome > 0) {
        updated.dtiRatio = Math.round(
          (updated.monthlyDebtPayments / updated.monthlyIncome) * 100
        );
      }

      // Səhifələrin vizual dolması üçün şərti proqnozlaşdırma
      updated.totalDebts = updated.monthlyDebtPayments * 12; // 1 illik borc proqnozu
      updated.totalAssets = updated.monthlyIncome * 4.5 + 15000; // Şərti aktiv proqnozu
      updated.isAnalyzed = true;

      // 💾 Datanı dərhal brauzer yaddaşına yazırıq (Update olunduqda üzərinə köçürülür)
      localStorage.setItem("user_financials", JSON.stringify(updated));

      return updated;
    });
  };

  return (
    <FinancialContext.Provider value={{ financialData, updateFinancials }}>
      <Router>
        <AppContent />
      </Router>
    </FinancialContext.Provider>
  );
}

import React, { useState, createContext, useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supaBaseClient";

// Layout & Auth
import Sidebar from "./components/layout/Sidebar";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";
import HomePage from "./components/Homepage";
import GoalsPage from "./components/GoalsPage";

// Internal Pages
import IntelligencePage from "./components/IntelligencePage";
import EligibilityPage from "./components/EligibilityPage";

const FinancialContext = createContext();
export function useFinancial() {
  return useContext(FinancialContext);
}

function AppContent() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false); // sessiya yoxlanana qədər gözlə
  const [authView, setAuthView] = useState("landing");
  const navigate = useNavigate();
  const location = useLocation();

  // 🔑 Supabase sessiyasını dinlə (həm email/parol, həm Google OAuth işləyir)
  useEffect(() => {
    // ilkin yoxlama
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    // sessiya dəyişəndə (login/logout/OAuth qayıdışı) avtomatik güncəllə
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess);
        setAuthReady(true);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!session;

  const handleLogin = () => {
    setAuthView("landing");
    navigate("/overview");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_financials");
    setAuthView("login");
    navigate("/");
  };

  const isAdvisorPage = location.pathname === "/advisor";

  // sessiya yoxlanana qədər boş qara ekran (landing tez göstərilməsin)
  if (!authReady) {
    return <div className="h-screen w-full bg-black" />;
  }

  return (
    <div className="h-screen w-full bg-black text-white font-sans overflow-hidden">
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
                <Route path="/overview" element={<HomePage />} />
                <Route
                  path="/home"
                  element={<Navigate to="/overview" replace />}
                />
                <Route path="/advisor" element={<IntelligencePage />} />
                <Route path="/goals" element={<GoalsPage />} />
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

export default function App() {
  const [financialData, setFinancialData] = useState(() => {
    const savedData = localStorage.getItem("user_financials");
    if (savedData) return JSON.parse(savedData);
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

  const updateFinancials = (newData) => {
    setFinancialData((prev) => {
      const updated = { ...prev, ...newData };
      if (updated.monthlyIncome > 0) {
        updated.dtiRatio = Math.round(
          (updated.monthlyDebtPayments / updated.monthlyIncome) * 100
        );
      }
      updated.totalDebts = updated.monthlyDebtPayments * 12;
      updated.totalAssets = updated.monthlyIncome * 4.5 + 15000;
      updated.isAnalyzed = true;
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

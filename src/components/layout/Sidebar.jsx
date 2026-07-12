import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  BrainCircuit,
  Wallet,
  Target,
  Settings,
  CreditCard,
  CirclePoundSterling,
  LogOut,
} from "lucide-react";

const Sidebar = ({ onLogout }) => {
  const menuItems = [
    // { icon: <LayoutGrid size={20} />, label: "Overview", path: "/overview" },
    { icon: <BrainCircuit size={20} />, label: "AI Advisor", path: "/advisor" },
    // { icon: <Wallet size={20} />, label: "Accounts", path: "/accounts" },
    // { icon: <Target size={20} />, label: "Goals", path: "/goals" },
    // { icon: <CreditCard size={20} />, label: "Debts", path: "/debts" },
    {
      icon: <CirclePoundSterling size={20} />,
      label: "Eligibility",
      path: "/eligibility",
    },
  ];

  return (
    <>
      {/* 📱 MOBİL ÜÇÜN: YUXARI HEADER (Sadəcə loqo və çıxış düymələri) */}
      <div className="flex md:hidden items-center justify-between p-4 border-b border-white/5 bg-black w-full sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-white">
            Capital
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* <button className="text-[#666] hover:text-white p-2">
            <Settings size={18} />
          </button> */}
          <button
            onClick={onLogout}
            className="text-[#666] hover:text-red-500 p-2"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* 📱 MOBİL ÜÇÜN: AŞAĞI NAVİQASİYA BARI (Bottom Navigation) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-lg border-t border-white/5 justify-around items-center px-2 z-50">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 h-full py-2
              transition-all duration-300
              ${
                isActive
                  ? "text-white scale-110"
                  : "text-[#444] hover:text-[#888]"
              }
            `}
          >
            {item.icon}
            {/* Opsional: Çox kiçik mətn istəsən aşağıdakı sətri aça bilərsən */}
            {/* <span className="text-[8px] uppercase tracking-tighter mt-1 font-medium">text</span> */}
          </NavLink>
        ))}
      </nav>

      {/* 💻 WEBDƏ GÖRÜNƏN STANDART SİDEBAR */}
      <aside className="hidden md:flex w-64 border-r border-white/5 flex-col p-6 bg-black min-h-screen sticky top-0">
        {/* Logo Hissəsi */}
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-2 h-2 rounded-full bg-white" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white">
            Capital
          </span>
        </div>

        {/* Naviqasiya Linkləri */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl 
                transition-all duration-300 ease-in-out
                ${
                  isActive
                    ? "bg-white/5 text-white border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]"
                    : "text-[#666] hover:text-white hover:bg-white/[0.02] border border-transparent"
                }
              `}
            >
              <span className="transition-transform duration-300">
                {item.icon}
              </span>
              <span className="text-[11px] uppercase tracking-widest font-bold">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Alt Bölmə: Settings və Logout */}
        <div className="pt-6 border-t border-white/5 space-y-1">
          {/* <button className="flex items-center gap-4 px-4 py-3 text-[#666] hover:text-white transition-colors w-full group">
            <Settings
              size={18}
              className="group-hover:rotate-45 transition-transform"
            />
            <span className="text-[11px] uppercase tracking-widest font-bold">
              Settings
            </span>
          </button> */}

          <button
            onClick={onLogout}
            className="flex items-center gap-4 px-4 py-3 text-[#666] hover:text-red-500 transition-all w-full group"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-[11px] uppercase tracking-widest font-bold">
              Log Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

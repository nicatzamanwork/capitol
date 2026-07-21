import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  BrainCircuit,
  CirclePoundSterling,
  LogOut,
  GoalIcon,
  
} from "lucide-react";

const GREEN = "#35D6A0";

const menuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: BrainCircuit, label: "Advisor", path: "/advisor" },
  { icon: GoalIcon, label: "Goals", path: "/goals" },
  { icon: CirclePoundSterling, label: "Eligibility", path: "/eligibility" },
];

const Sidebar = ({ onLogout }) => {
  return (
    <>
      {/* ═══════════ MOBİL: YUXARI HEADER ═══════════ */}
      <header
        className="flex md:hidden items-center justify-between px-5 bg-black/80 backdrop-blur-xl border-b border-white/[0.06] w-full sticky top-0 z-50"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 14px)",
          paddingBottom: 14,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: GREEN, boxShadow: `0 0 10px ${GREEN}` }}
          />
          <span className="text-[11px] uppercase tracking-[0.35em] font-bold text-white">
            Capitol
          </span>
        </div>
        <button
          onClick={onLogout}
          className="text-[#5A5F66] active:text-red-500 active:scale-90 transition-all p-2 -mr-2"
          aria-label="Çıxış"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* ═══════════ MOBİL: AŞAĞI TAB BAR ═══════════ */}
      <nav
        className="flex md:hidden fixed bottom-0 left-0 right-0 bg-black/85 backdrop-blur-xl border-t border-white/[0.06] z-50"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          height: "calc(64px + env(safe-area-inset-bottom))",
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 gap-1 select-none"
            >
              {({ isActive }) => (
                <>
                  <span
                    className="absolute top-0 h-[3px] rounded-b-full transition-all duration-300"
                    style={{
                      width: isActive ? 28 : 0,
                      background: GREEN,
                      boxShadow: isActive ? `0 0 12px ${GREEN}` : "none",
                    }}
                  />
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.4 : 1.9}
                    style={{
                      color: isActive ? GREEN : "#4A4F56",
                      transition: "color .25s, transform .25s",
                      transform: isActive ? "translateY(-1px)" : "none",
                    }}
                  />
                  <span
                    className="text-[9px] uppercase tracking-[0.12em] font-bold transition-colors duration-250"
                    style={{ color: isActive ? GREEN : "#4A4F56" }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ═══════════ DESKTOP: STANDART SIDEBAR ═══════════ */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-white/5 flex-col p-6 bg-black min-h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: GREEN, boxShadow: `0 0 10px ${GREEN}` }}
          />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white">
            Capitol
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-4 px-4 py-3 rounded-xl
                  transition-all duration-300 ease-in-out border
                  ${
                    isActive
                      ? "bg-white/5 text-white border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]"
                      : "text-[#666] hover:text-white hover:bg-white/[0.02] border-transparent"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={20}
                      style={{ color: isActive ? GREEN : undefined }}
                    />
                    <span className="text-[11px] uppercase tracking-widest font-bold">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-white/5">
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

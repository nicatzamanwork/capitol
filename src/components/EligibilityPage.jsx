import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFinancial } from "../App";
import {
  ShieldCheck,
  TriangleAlert,
  Landmark,
  ArrowUpRight,
  Lock,
  Sparkles,
} from "lucide-react";

/* ── shared assumptions (mirror IntelligencePage) ── */
const MAX_DTI = 0.45;
const TERM_MONTHS = 36;

/* ── bank config (open/public tariffs only; NO api, NO partner claims) ── */
const BANKS = [
  {
    key: "afb",
    name: "AFB Bank",
    url: "https://afb.az/",
    mult: 1.0,
    rate: 11.5,
  },
];

/* ── funnel analytics (CRA-safe) ── */
function logEvent(eventType, metadata = {}) {
  try {
    window.__capitalTrack?.(eventType, metadata);
  } catch (_) {}
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[funnel]", eventType, metadata);
  }
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");

const monthlyPayment = (principal, ratePct) => {
  const r = ratePct / 100 / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -TERM_MONTHS));
};

function CountUp({ value, duration = 1000, className = "" }) {
  const [d, setD] = React.useState(0);
  React.useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion:reduce)").matches) {
      setD(value);
      return;
    }
    let raf, start;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      setD(Math.round(value * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{fmt(d)}</span>;
}

const STATUS = {
  healthy: {
    label: "Sağlam",
    color: "#35D6A0",
    Icon: ShieldCheck,
    pill: "Verified Profile",
    prob: "Yüksək təsdiq ehtimalı",
  },
  watch: {
    label: "Diqqətli",
    color: "#E7B24C",
    Icon: TriangleAlert,
    pill: "Watch Profile",
    prob: "Orta təsdiq ehtimalı",
  },
  critical: {
    label: "Yüksək risk",
    color: "#F26D6D",
    Icon: TriangleAlert,
    pill: "High Risk Profile",
    prob: "Aşağı təsdiq ehtimalı",
  },
};

function DtiBar({ dti, color }) {
  const marker = Math.min((dti / 60) * 100, 100);
  return (
    <div className="mt-6">
      <div className="relative h-2 rounded-full overflow-hidden flex">
        <div style={{ width: "50%", background: "#35D6A033" }} />
        <div style={{ width: "25%", background: "#E7B24C33" }} />
        <div style={{ width: "25%", background: "#F26D6D33" }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-black transition-[left] duration-1000"
          style={{
            left: `calc(${marker}% - 6px)`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[9px] uppercase tracking-wider text-gray-600 font-bold">
        <span>0%</span>
        <span style={{ color: "#E7B24C" }}>bank həddi 45%</span>
        <span>60%</span>
      </div>
    </div>
  );
}

export default function EligibilityPage() {
  const { financialData } = useFinancial();
  const navigate = useNavigate();

  const analyzed =
    financialData?.isAnalyzed || financialData?.monthlyIncome > 0;
  const income = financialData?.monthlyIncome ?? 0;
  const debt = financialData?.monthlyDebtPayments ?? 0;

  const { dti, baseLimit, status, reduceBy } = useMemo(() => {
    const dtiRatio = income > 0 ? Math.round((debt / income) * 100) : 0;
    const maxPayment = income * MAX_DTI - debt;
    const r = 0.14 / 12;
    const pv = (1 - Math.pow(1 + r, -TERM_MONTHS)) / r;
    const limit =
      maxPayment > 0 ? Math.round((maxPayment * pv) / 100) * 100 : 0;
    let st = "healthy";
    if (dtiRatio > 45) st = "critical";
    else if (dtiRatio > 30) st = "watch";
    const reduce =
      maxPayment < 0 ? Math.ceil((debt - income * MAX_DTI) / 10) * 10 : 0;
    return {
      dti: dtiRatio,
      baseLimit: financialData?.computedLimit ?? limit,
      status: st,
      reduceBy: reduce,
    };
  }, [income, debt, financialData]);

  const s = STATUS[status];

  const goAdvisor = () => {
    logEvent("eligibility_to_advisor");
    navigate("/advisor");
  };

  const handleApply = (bank, amount) => {
    logEvent("offer_clicked", {
      bank_key: bank.key,
      amount,
      dti,
      limit: baseLimit,
    });
    window.open(bank.url, "_blank", "noopener,noreferrer");
  };

  /* ── empty state: invite to the chat first ── */
  if (!analyzed) {
    return (
      <div
        className="min-h-full flex flex-col items-center justify-center text-center px-6 bg-[#060708]"
        style={{
          paddingTop: 96,
          paddingBottom: "calc(120px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-6">
          <Sparkles size={22} className="text-[#35D6A0]" />
        </div>
        <h1 className="text-3xl font-semibold text-white tracking-tight mb-3">
          Əvvəlcə profilinizi quraq
        </h1>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-8">
          Bank təkliflərini görmək üçün AI Advisor-da gəlir və borcunuzu qeyd
          edin. 60 saniyə çəkir — bank bağlantısı tələb olunmur.
        </p>
        <button
          onClick={goAdvisor}
          className="flex items-center gap-2 text-[11px] font-semibold text-[#35D6A0] cursor-pointer hover:gap-3 transition-all active:scale-95 select-none bg-[#35D6A0]/[0.08] border border-[#35D6A0]/30 px-5 py-3 rounded-full"
        >
          AI Advisor-a keç <ArrowUpRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 md:space-y-8 bg-[#060708] px-4 md:px-1"
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}
    >
      {/* header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-0 pt-2">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.28em] text-gray-600 font-bold mb-1">
            Eligibility
          </h2>
          <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            Credit Eligibility
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Açıq bank tariflərinə əsaslanan şəxsi təkliflər.
          </p>
        </div>
        <div
          className="px-4 py-2 rounded-full border flex items-center gap-2 shrink-0 self-start"
          style={{
            background: `${s.color}1A`,
            borderColor: `${s.color}33`,
            color: s.color,
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: s.color }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {s.pill}
          </span>
        </div>
      </div>

      {/* hero card */}
      <div className="bg-[#0F1113] border border-white/[0.07] rounded-[32px] p-8 md:p-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-md space-y-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-bold">
              Debt-to-income status
            </p>
            <div className="flex items-center gap-3">
              <h2
                className="text-5xl font-semibold tracking-tight"
                style={{ color: status === "critical" ? "#F26D6D" : "#fff" }}
              >
                {s.label}
              </h2>
              <s.Icon size={26} style={{ color: s.color }} />
            </div>
            {status === "critical" ? (
              <p className="text-sm text-gray-500 leading-relaxed">
                Aylıq borcunuz gəlirinizin {dti}%-nə çatıb — bank həddi olan
                45%-i keçir. Aylıq borcunuzu təxminən{" "}
                <span className="text-white font-mono">{fmt(reduceBy)} ₼</span>{" "}
                azaltsanız, təkliflər açılır.
              </p>
            ) : (
              <p className="text-sm text-gray-500 leading-relaxed">
                Aylıq borcunuz gəlirinizin {dti}%-ni təşkil edir.{" "}
                {status === "healthy"
                  ? "Yeni kredit üçün optimaldır."
                  : "Kredit mümkündür, amma limit məhduddur."}
              </p>
            )}
            <DtiBar dti={dti} color={s.color} />
          </div>

          <div className="text-left md:text-right shrink-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-bold mb-2">
              Calculated limit
            </p>
            <p className="font-mono tabular-nums text-4xl md:text-5xl font-semibold text-white tracking-tight">
              <span className="text-gray-500 text-2xl font-sans">~</span>
              <CountUp value={baseLimit} />{" "}
              <span className="text-2xl text-gray-500">₼</span>
            </p>
            <div
              className="mt-4 flex items-center gap-2 md:justify-end text-xs font-medium"
              style={{ color: s.color }}
            >
              <ShieldCheck size={14} /> {s.prob}
            </div>
          </div>
        </div>
      </div>

      {/* offers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {BANKS.map((bank, i) => {
          const amount = Math.round((baseLimit * bank.mult) / 100) * 100;
          const disabled = amount <= 0;
          const pay = disabled ? 0 : monthlyPayment(amount, bank.rate);
          return (
            <div
              key={bank.key}
              className="bg-[#0F1113] border border-white/[0.07] rounded-3xl p-6 md:p-7 flex flex-col justify-between min-h-[260px] md:min-h-[300px] transition-all hover:-translate-y-1 hover:border-white/20 group"
              style={{
                animation: `rise .5s cubic-bezier(.22,.61,.36,1) both`,
                animationDelay: `${i * 70}ms`,
              }}
            >
              <div>
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <div className="p-3 bg-white/5 rounded-2xl text-gray-400 group-hover:text-white transition-colors">
                    <Landmark size={20} />
                  </div>
                  <span className="text-[9px] uppercase font-bold text-gray-600 tracking-widest">
                    Açıq tarif
                  </span>
                </div>
                <h4 className="text-white font-medium mb-4">{bank.name}</h4>
                <p className="font-mono tabular-nums text-3xl font-semibold text-white tracking-tight">
                  {disabled ? "0" : fmt(amount)}{" "}
                  <span className="text-lg text-gray-500">₼</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Faiz: <span className="font-mono">{bank.rate}%</span>-dən
                  (açıq tarif)
                </p>
                {!disabled && (
                  <p className="text-[11px] text-gray-600 mt-1 font-mono tabular-nums">
                    ~{fmt(pay)} ₼/ay · {TERM_MONTHS} ay
                  </p>
                )}
              </div>
              <div>
                <button
                  onClick={() => handleApply(bank, amount)}
                  disabled={disabled}
                  className="w-full bg-white text-black py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  Rəsmi sayta keç <ArrowUpRight size={14} />
                </button>
                {!disabled && (
                  <p className="text-[10px] text-gray-600 text-center mt-2">
                    Sizi {bank.name}-ın rəsmi səhifəsinə yönləndirir
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* privacy line */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-600 pt-2 text-center">
        <Lock size={12} className="shrink-0" />
        Limitlər açıq tariflərə əsaslanan proqnozdur. Dəqiq təklifi bank öz
        saytında verir. Məlumatlarınız bizdə qalır.
      </div>

      <style>{`@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){[style*="rise"]{animation:none!important;opacity:1!important;transform:none!important}}`}</style>
    </div>
  );
}

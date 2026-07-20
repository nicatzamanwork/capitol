import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFinancial } from "../App";
import { ShieldCheck, Landmark, ArrowUpRight, Sparkles } from "lucide-react";

/* ── tokens ── */
const C = {
  bg: "#060708",
  surface: "#0F1113",
  line: "rgba(255,255,255,.07)",
  dim: "#868B94",
  faint: "#4C525B",
  green: "#35D6A0",
  amber: "#E7B24C",
  red: "#F26D6D",
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace';
const MOBILE_NAV_PAD = "calc(96px + env(safe-area-inset-bottom))";

const MAX_DTI = 0.45,
  TERM_MONTHS = 36;

/* açıq tarif banklar (referral — partnyorluq iddiası yoxdur) */
const BANKS = [
  {
    key: "afb",
    name: "AFB Bank",
    url: "https://afb.az/",
    mult: 1.0,
    rate: 11.5,
  },
];

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const monthlyPayment = (p, ratePct) => {
  const r = ratePct / 100 / 12;
  return (p * r) / (1 - Math.pow(1 + r, -TERM_MONTHS));
};

function logEvent(type, meta = {}) {
  try {
    window.__capitalTrack?.(type, meta);
  } catch (_) {}
  if (process.env.NODE_ENV === "development")
    console.log("[funnel]", type, meta);
}

function CountUp({ value, duration = 1000, style }) {
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
  return <span style={style}>{fmt(d)}</span>;
}

const STATUS = {
  healthy: { label: "Sağlam", color: C.green },
  watch: { label: "Diqqətli", color: C.amber },
  critical: { label: "Yüksək risk", color: C.red },
};

function useIsMobile(bp = 768) {
  const [m, setM] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < bp : false
  );
  React.useEffect(() => {
    const on = () => setM(window.innerWidth < bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return m;
}

export default function EligibilityPage() {
  const { financialData } = useFinancial();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const income = financialData?.monthlyIncome ?? 0;
  const debt = financialData?.monthlyDebtPayments ?? 0;
  const analyzed = income > 0;

  const { dti, baseLimit, status } = useMemo(() => {
    const dtiRatio = income > 0 ? Math.round((debt / income) * 100) : 0;
    const maxPayment = income * MAX_DTI - debt;
    const r = 0.14 / 12;
    const pv = (1 - Math.pow(1 + r, -TERM_MONTHS)) / r;
    const limit =
      maxPayment > 0 ? Math.round((maxPayment * pv) / 100) * 100 : 0;
    let st = "healthy";
    if (dtiRatio > 45) st = "critical";
    else if (dtiRatio > 30) st = "watch";
    return {
      dti: dtiRatio,
      baseLimit: financialData?.computedLimit ?? limit,
      status: st,
    };
  }, [income, debt, financialData]);

  const s = STATUS[status];

  /* təkliflər: məbləğə görə sırala, birincisi = ən uyğun */
  const offers = useMemo(() => {
    return BANKS.map((b) => ({
      ...b,
      amount: Math.round((baseLimit * b.mult) / 100) * 100,
    }))
      .filter((b) => b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [baseLimit]);

  const openBank = (bank) => {
    logEvent("offer_clicked", {
      bank_key: bank.key,
      amount: bank.amount,
      dti,
      limit: baseLimit,
    });
    window.open(bank.url, "_blank", "noopener,noreferrer");
  };

  const card = {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 22,
  };
  const eyebrow = {
    fontSize: 9.5,
    letterSpacing: ".2em",
    textTransform: "uppercase",
    color: C.faint,
    fontWeight: 700,
  };

  /* ── boş hal ── */
  if (!analyzed) {
    return (
      <div
        style={{
          minHeight: "100%",
          background: C.bg,
          color: "#fff",
          boxSizing: "border-box",
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px",
          paddingBottom: isMobile ? MOBILE_NAV_PAD : 24,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: "rgba(255,255,255,.03)",
            border: `1px solid ${C.line}`,
            display: "grid",
            placeItems: "center",
            marginBottom: 20,
          }}
        >
          <Sparkles size={22} style={{ color: C.green }} />
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            margin: "0 0 10px",
            letterSpacing: "-.02em",
          }}
        >
          Əvvəlcə profilinizi quraq
        </h1>
        <p
          style={{
            fontSize: 14,
            color: C.dim,
            maxWidth: 340,
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          Bank təkliflərini görmək üçün AI Advisor-da gəlir və borcunuzu qeyd
          edin.
        </p>
        <button
          onClick={() => navigate("/advisor")}
          style={{
            background: "#fff",
            color: "#000",
            border: "none",
            padding: "14px 28px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Advisor-a keç <ArrowUpRight size={16} />
        </button>
      </div>
    );
  }

  const best = offers[0];
  const rest = offers.slice(1);
  const dtiMarker = Math.min((dti / 60) * 100, 100);

  return (
    <div
      style={{
        minHeight: "100%",
        background: C.bg,
        color: "#fff",
        boxSizing: "border-box",
        overflowX: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: isMobile ? "20px 16px" : "32px 24px",
        paddingBottom: isMobile ? MOBILE_NAV_PAD : 32,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ ...eyebrow, marginBottom: 6 }}>Eligibility</div>
            <h1
              style={{
                fontSize: isMobile ? 26 : 30,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-.02em",
              }}
            >
              Təklifləriniz
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 13px",
              borderRadius: 999,
              border: `1px solid ${C.green}33`,
              background: C.green + "12",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: C.green,
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: C.green,
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              Yoxlanılıb
            </span>
          </div>
        </div>

        {/* DTI card */}
        <div style={{ ...card, padding: isMobile ? 20 : 24, marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={eyebrow}>Borc / gəlir (DTI)</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 16,
                fontWeight: 600,
                color: s.color,
              }}
            >
              {s.label} <ShieldCheck size={16} />
            </div>
          </div>
          <p
            style={{
              fontSize: 13.5,
              color: C.dim,
              lineHeight: 1.55,
              margin: "0 0 18px",
            }}
          >
            {status === "healthy" &&
              `Aylıq borcunuz gəlirinizin ${dti}%-ni təşkil edir — yeni kredit üçün optimal.`}
            {status === "watch" &&
              `Aylıq borcunuz gəlirinizin ${dti}%-ni təşkil edir — 45% həddinə yaxınsınız.`}
            {status === "critical" &&
              `Aylıq borcunuz gəlirinizin ${dti}%-ni təşkil edir — 45% bank həddini keçir.`}
          </p>
          <div
            style={{
              position: "relative",
              height: 8,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, #35D6A0 0%, #E7B24C 62%, #F26D6D 100%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: `calc(${dtiMarker}% - 7px)`,
                transform: "translateY(-50%)",
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#fff",
                border: "2px solid #000",
                boxShadow: "0 0 8px rgba(0,0,0,.6)",
                transition: "left 1s cubic-bezier(.22,.61,.36,1)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 9.5,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: C.faint,
              fontWeight: 700,
            }}
          >
            <span>0%</span>
            <span style={{ color: C.amber }}>bank həddi 45%</span>
            <span>60%</span>
          </div>
        </div>

        {/* BEST MATCH */}
        {best && (
          <div
            style={{
              ...card,
              padding: isMobile ? 22 : 26,
              marginBottom: 12,
              border: `1px solid ${C.green}44`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 150,
                height: 150,
                background: `radial-gradient(circle, ${C.green}18, transparent 70%)`,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "rgba(255,255,255,.05)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Landmark size={20} style={{ color: "#fff" }} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: C.green + "1A",
                  border: `1px solid ${C.green}33`,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: C.green,
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                  }}
                >
                  Ən uyğun
                </span>
              </div>
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                margin: "0 0 10px",
                position: "relative",
              }}
            >
              {best.name}
            </h3>
            <div
              style={{
                fontFamily: MONO,
                fontVariantNumeric: "tabular-nums",
                fontSize: isMobile ? 34 : 40,
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1,
                marginBottom: 8,
                position: "relative",
              }}
            >
              <CountUp value={best.amount} />{" "}
              <span style={{ fontSize: 20, color: C.dim }}>₼</span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: C.dim,
                margin: "0 0 18px",
                fontFamily: MONO,
                position: "relative",
              }}
            >
              {best.rate}%-dən · ~{fmt(monthlyPayment(best.amount, best.rate))}{" "}
              ₼/ay · {TERM_MONTHS} ay
            </p>
            <button
              onClick={() => openBank(best)}
              style={{
                width: "100%",
                background: "#ECE9E2",
                color: "#161616",
                border: "none",
                padding: "15px",
                borderRadius: 16,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                position: "relative",
              }}
            >
              Rəsmi sayta keç <ArrowUpRight size={15} />
            </button>
          </div>
        )}

        {/* digər təkliflər */}
        {rest.map((b, i) => (
          <button
            key={b.key}
            onClick={() => openBank(b)}
            style={{
              ...card,
              width: "100%",
              padding: isMobile ? "16px 18px" : "18px 22px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              cursor: "pointer",
              textAlign: "left",
              animation: `rise .4s ${i * 60}ms both`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(255,255,255,.05)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Landmark size={18} style={{ color: C.dim }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.name}
                </div>
                <div style={{ fontSize: 12, color: C.faint }}>
                  {b.rate}%-dən
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontVariantNumeric: "tabular-nums",
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {fmt(b.amount)}{" "}
              <span style={{ fontSize: 13, color: C.dim }}>₼</span>
            </div>
          </button>
        ))}

        {/* disclaimer */}
        <p
          style={{
            fontSize: 11.5,
            color: C.faint,
            textAlign: "center",
            lineHeight: 1.5,
            marginTop: 18,
            maxWidth: 380,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Rəqəmlər açıq tariflərə əsaslanan proqnozdur. Dəqiq təklifi bank öz
          saytında təsdiqləyir.
        </p>
      </div>

      <style>{`@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){[style*="rise"]{animation:none!important;opacity:1!important;transform:none!important}}`}</style>
    </div>
  );
}

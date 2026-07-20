import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFinancial } from "../App";
import {
  ShieldCheck,
  TriangleAlert,
  ArrowRight,
  User,
  Sparkles,
} from "lucide-react";

/* ── tokens (app ilə eyni) ── */
const C = {
  bg: "#060708",
  surface: "#0F1113",
  surface2: "#141618",
  line: "rgba(255,255,255,.07)",
  text: "#F3F4F5",
  dim: "#868B94",
  faint: "#4C525B",
  green: "#35D6A0",
  amber: "#E7B24C",
  red: "#F26D6D",
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace';
const MOBILE_NAV_PAD = "calc(96px + env(safe-area-inset-bottom))";

/* açıq tarif banklar (referral) — best rate & offers üçün */
const BANKS = [
  { name: "AFB Bank", rate: 11.5 },
  { name: "ABB", rate: 12.0 },
  { name: "Bank Respublika", rate: 13.5 },
];

const fmt = (n) => Math.round(n).toLocaleString("en-US");

function useIsMobile(bp = 768) {
  const [m, setM] = useState(
    typeof window !== "undefined" ? window.innerWidth < bp : false
  );
  useEffect(() => {
    const on = () => setM(window.innerWidth < bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return m;
}

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Sabahınız xeyir";
  if (h >= 12 && h < 18) return "Günortanız xeyir";
  return "Axşamınız xeyir";
}

function CountUp({ value, duration = 1000, style }) {
  const [d, setD] = useState(0);
  useEffect(() => {
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

function RadialGauge({
  value,
  max = 100,
  color,
  size = 128,
  stroke = 9,
  children,
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(value / max, 1));
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion:reduce)").matches) {
      setShown(pct);
      return;
    }
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - circ * shown}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)",
            filter: `drop-shadow(0 0 6px ${color}66)`,
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function HomePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { financialData } = useFinancial();

  const income = financialData?.monthlyIncome ?? 0;
  const debt = financialData?.monthlyDebtPayments ?? 0;
  const limit = financialData?.computedLimit ?? 0;
  const status = financialData?.eligibilityStatus ?? "healthy";
  const pre = financialData?.prescore ?? null;
  const analyzed = income > 0;

  const dti = income > 0 ? Math.round((debt / income) * 100) : 0;

  /* readiness (hazırlıq): ön-skorinq varsa onun skoru; yoxsa DTI statusundan təxmini */
  const provisional = { healthy: 68, watch: 48, critical: 26 }[status] ?? 0;
  const readiness = pre?.score ?? provisional;
  const likelihood =
    pre?.likelihood ??
    (status === "healthy" ? "high" : status === "watch" ? "medium" : "low");
  const LK = {
    high: { label: "Yaxşı", color: C.green },
    medium: { label: "Orta", color: C.amber },
    low: { label: "Zəif", color: C.red },
  }[likelihood];

  const statusLabel = {
    healthy: "Sağlam",
    watch: "Diqqətli",
    critical: "Yüksək risk",
  }[status];
  const statusColor = { healthy: C.green, watch: C.amber, critical: C.red }[
    status
  ];
  const best = BANKS.reduce((a, b) => (b.rate < a.rate ? b : a), BANKS[0]);

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

  /* ── boş hal: hələ analiz yoxdur ── */
  if (!analyzed) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          minHeight: "100%",
          background: C.bg,
          color: C.text,
          boxSizing: "border-box",
          overflowX: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: isMobile ? "20px 16px" : "32px 24px",
          paddingBottom: isMobile ? MOBILE_NAV_PAD : 32,
        }}
      >
        <Header isMobile={isMobile} />
        <div
          style={{
            ...card,
            marginTop: 20,
            padding: isMobile ? 28 : 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 16,
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
            }}
          >
            <Sparkles size={24} style={{ color: C.green }} />
          </div>
          <div>
            <h2
              style={{
                fontSize: isMobile ? 22 : 26,
                fontWeight: 600,
                color: "#fff",
                margin: "0 0 8px",
                letterSpacing: "-.02em",
              }}
            >
              Kredit hazırlığınızı öyrənin
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: C.dim,
                lineHeight: 1.6,
                maxWidth: 340,
                margin: 0,
              }}
            >
              AI Advisor-da gəlir və borcunuzu qeyd edin — 60 saniyəyə hazırlıq
              skorunuzu, təxmini limitinizi və uyğun bankları görün.
            </p>
          </div>
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
            Advisor-da başla <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ── əsas dashboard ── */
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100%",
        background: C.bg,
        color: C.text,
        boxSizing: "border-box",
        overflowX: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: isMobile ? "20px 16px" : "32px 24px",
        paddingBottom: isMobile ? MOBILE_NAV_PAD : 32,
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Header isMobile={isMobile} />

        {/* hero: readiness ring + limit */}
        <div
          style={{
            ...card,
            marginTop: 20,
            padding: isMobile ? 20 : 26,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              background: `radial-gradient(circle, ${LK.color}18, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 18 : 28,
              position: "relative",
            }}
          >
            <RadialGauge
              value={readiness}
              max={100}
              color={LK.color}
              size={isMobile ? 128 : 148}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: isMobile ? 40 : 46,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                <CountUp value={readiness} />
              </div>
              <div style={{ ...eyebrow, marginTop: 3 }}>Hazırlıq</div>
            </RadialGauge>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  background: LK.color + "1A",
                  color: LK.color,
                  border: `1px solid ${LK.color}33`,
                  marginBottom: 14,
                }}
              >
                {LK.label}
              </div>
              <div style={{ ...eyebrow, marginBottom: 6 }}>Təxmini limit</div>
              <div
                style={{
                  fontFamily: MONO,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: isMobile ? 30 : 38,
                  fontWeight: 700,
                  color: C.green,
                  lineHeight: 1,
                }}
              >
                <CountUp value={limit} />{" "}
                <span style={{ fontSize: isMobile ? 18 : 22, color: C.dim }}>
                  ₼
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 stat */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginTop: 12,
          }}
        >
          <StatCard
            eyebrow="DTI"
            main={
              <>
                <CountUp value={dti} />%
              </>
            }
            sub={statusLabel}
            subColor={statusColor}
            isMobile={isMobile}
          />
          <StatCard
            eyebrow="Ən yaxşı faiz"
            main={<>{best.rate}%</>}
            sub={best.name}
            isMobile={isMobile}
          />
          <StatCard
            eyebrow="Təkliflər"
            main={<>{BANKS.length}</>}
            sub="Uyğun"
            isMobile={isMobile}
          />
        </div>

        {/* pre-scoring CTA */}
        <div style={{ ...card, marginTop: 12, padding: isMobile ? 20 : 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ ...eyebrow, color: C.green }}>Ön-skorinq</div>
            {pre && (
              <div style={{ fontSize: 11, color: C.faint, fontWeight: 700 }}>
                tamamlandı
              </div>
            )}
          </div>
          <h3
            style={{
              fontSize: isMobile ? 17 : 19,
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 16px",
              lineHeight: 1.35,
              letterSpacing: "-.01em",
            }}
          >
            {pre
              ? "Nəticənizi yeniləmək üçün sualları yenidən keçin"
              : "Bir neçə suala cavab verin — proqnozu dəqiqləşdirək"}
          </h3>
          <button
            onClick={() => navigate("/advisor")}
            style={{
              background: "#fff",
              color: "#000",
              border: "none",
              padding: "13px 24px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {pre ? "Yenidən keç" : "Davam et"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ isMobile }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <div style={{ fontSize: 13, color: C.dim, marginBottom: 4 }}>
          {greeting()}
        </div>
        <h1
          style={{
            fontSize: isMobile ? 24 : 28,
            fontWeight: 700,
            color: "#fff",
            margin: 0,
            letterSpacing: "-.02em",
          }}
        >
          Xoş gəldiniz
        </h1>
      </div>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          background: "rgba(255,255,255,.04)",
          border: `1px solid ${C.line}`,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <User size={18} style={{ color: C.dim }} />
      </div>
    </div>
  );
}

function StatCard({ eyebrow, main, sub, subColor, isMobile }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        padding: isMobile ? 14 : 18,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          color: C.faint,
          fontWeight: 700,
          marginBottom: 8,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontVariantNumeric: "tabular-nums",
          fontSize: isMobile ? 22 : 26,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {main}
      </div>
      <div
        style={{
          fontSize: 11,
          color: subColor ?? C.dim,
          fontWeight: subColor ? 600 : 400,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

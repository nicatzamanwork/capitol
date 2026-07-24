import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFinancial } from "../App";
import {
  ShieldCheck,
  Landmark,
  ArrowUpRight,
  Sparkles,
  Info,
} from "lucide-react";
import { logOfferClick } from "../logOfferClick";

/* ── tokens ── */
const C = {
  bg: "#060708",
  surface: "#0F1113",
  line: "rgba(255,255,255,.07)",
  dim: "#B0B6BF",
  faint: "#858B94",
  green: "#35D6A0",
  amber: "#E7B24C",
  red: "#F26D6D",
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace';
const MOBILE_NAV_PAD = "calc(96px + env(safe-area-inset-bottom))";
const MAX_DTI = 0.4,
  TERM_MONTHS = 36,
  LIVING_MIN = 400;

/* ══════════════════════════════════════════════════════════════
   BANK PAVİLYONU — TÖVSİYƏ / AÇIQ TARİF MODELİ
   ──────────────────────────────────────────────────────────────
   QAYDA: "rate" YALNIZ bankın RƏSMİ saytında dərc olunmuş real,
   cari illik faiz olmalıdır. Bilmədiyin faizi UYDURMA — rate: null
   qoy, sistem onu "Açıq tarif — sayta keçin" kimi göstərəcək.
   Yeni bank əlavə etmək = sadəcə bu siyahıya bir sətir.
   ════════════════════════════════════════════════════════════ */
const BANKS = [
  {
    key: "afb",
    name: "AFB Bank",
    url: "https://afb.az/nagd-pul-krediti",
    rate: 10.5,
  }, // afb.az — nağd kredit
  {
    key: "abb",
    name: "ABB",
    url: "https://abb-bank.az/ferdi/kreditler/nagd-kredit",
    rate: 10.9,
  }, // abb-bank.az — nağd kredit
  {
    key: "leobank",
    name: "Leobank",
    url: "https://leobank.az/az/cash",
    rate: 15.0,
  }, // leobank.az — nağd kredit

  /* Faizi təsdiqlənməyənlər (rate: null → "Açıq tarif — sayta baxın"). Real faizi yoxlayıb yaz: */
  {
    key: "turanbank",
    name: "Turanbank",
    url: "https://www.turanbank.az/az/pages/22/246",
    rate: null,
  },
  {
    key: "respublika",
    name: "Bank Respublika",
    url: "https://www.bankrespublika.az/",
    rate: null,
  },

  /* Əlavə etmək üçün (real açıq faizlə doldur, şərhi götür): */
  // { key: "kapital", name: "Kapital Bank", url: "https://www.kapitalbank.az/", rate: null },
  // { key: "pasha", name: "PAŞA Bank", url: "https://www.pashabank.az/", rate: null },
  // { key: "unibank", name: "Unibank", url: "https://www.unibank.az/", rate: null },
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

  const { dti, limit, status } = useMemo(() => {
    const freeIncome = Math.max(0, income - LIVING_MIN); // yaşayış minimumu (400 ₼) çıxılır
    const dtiRatio = freeIncome > 0 ? Math.round((debt / freeIncome) * 100) : 0;
    const maxPayment = freeIncome * MAX_DTI - debt; // bank həddi 40%
    const r = 0.105 / 12;
    const pv = (1 - Math.pow(1 + r, -TERM_MONTHS)) / r;
    const lim = maxPayment > 0 ? Math.round((maxPayment * pv) / 100) * 100 : 0;
    let st = "healthy";
    if (dtiRatio > 40) st = "critical";
    else if (dtiRatio > 30) st = "watch";
    return {
      dti: dtiRatio,
      limit: financialData?.computedLimit ?? lim,
      status: st,
    };
  }, [income, debt, financialData]);

  const s = STATUS[status];

  /* faizi bilinən banklar əvvəl (aşağı faiz = daha sərfəli), bilinməyənlər sonra */
  const ranked = useMemo(() => {
    const known = BANKS.filter((b) => typeof b.rate === "number").sort(
      (a, b) => a.rate - b.rate
    );
    const unknown = BANKS.filter((b) => typeof b.rate !== "number");
    return [...known, ...unknown];
  }, []);

  const openBank = (bank) => {
    logEvent("offer_clicked", {
      bank_key: bank.key,
      rate: bank.rate,
      dti,
      limit,
    });
    // Supabase-ə yaz (data toplama — hansı bank, DTI, limit)
    logOfferClick({
      bankKey: bank.key,
      bankName: bank.name,
      rate: bank.rate,
      dti,
      limit,
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

  const known = ranked.filter((b) => typeof b.rate === "number");
  const unknown = ranked.filter((b) => typeof b.rate !== "number");
  const dtiMarker = Math.min((dti / 60) * 100, 100);

  /* faizi bilinən bank — tam kart (AFB kimi izahlı) */
  const BankCard = ({ b, isBest }) => (
    <div
      style={{
        ...card,
        padding: isMobile ? 22 : 26,
        marginBottom: 12,
        border: `1px solid ${isBest ? C.green + "44" : C.line}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isBest && (
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
      )}
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
            background: isBest ? C.green + "1A" : "rgba(255,255,255,.03)",
            border: `1px solid ${isBest ? C.green + "33" : C.line}`,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: isBest ? C.green : C.dim,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            {isBest ? "Ən sərfəli faiz" : "Açıq tarif"}
          </span>
        </div>
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          margin: "0 0 6px",
          position: "relative",
        }}
      >
        {b.name}
      </h3>
      <div
        style={{
          fontFamily: MONO,
          fontVariantNumeric: "tabular-nums",
          fontSize: isMobile ? 30 : 36,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1,
          marginBottom: 6,
          position: "relative",
        }}
      >
        {b.rate}
        <span style={{ fontSize: 20, color: C.dim }}>%</span>{" "}
        <span style={{ fontSize: 14, color: C.faint, fontWeight: 400 }}>
          illik, açıq tarif · ən aşağı hədd
        </span>
      </div>
      <p
        style={{
          fontSize: 13,
          color: C.dim,
          margin: "0 0 4px",
          lineHeight: 1.55,
          position: "relative",
        }}
      >
        Əgər bank sizə <b style={{ color: "#fff" }}>~{fmt(limit)} ₼</b>-i{" "}
        <b style={{ color: "#fff" }}>{b.rate}%</b> ilə uyğun görsə, aylıq
        ödənişiniz təxminən{" "}
        <b style={{ color: C.green, fontFamily: MONO }}>
          ~{fmt(monthlyPayment(limit, b.rate))} ₼
        </b>{" "}
        olar ({TERM_MONTHS} ay üzrə).
      </p>
      <p
        style={{
          fontSize: 11,
          color: C.faint,
          margin: "0 0 18px",
          position: "relative",
        }}
      >
        Bu, ehtimaldır — real faiz və məbləği bank sizin profilinizə görə təyin
        edir.
      </p>
      <button
        onClick={() => openBank(b)}
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
  );

  /* faizi bilinməyən bank — sadə sətir */
  const BankRow = ({ b }) => (
    <button
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
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}
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
            Açıq tarif — sayta baxın
          </div>
        </div>
      </div>
      <ArrowUpRight size={18} style={{ color: C.dim }} />
    </button>
  );

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
              Bank təklifləri
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 13px",
              borderRadius: 999,
              border: `1px solid ${C.line}`,
              background: "rgba(255,255,255,.02)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: C.dim,
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
              }}
            >
              Açıq tarif · tövsiyə
            </span>
          </div>
        </div>

        {/* DTI + təxmini limit card */}
        <div style={{ ...card, padding: isMobile ? 20 : 24, marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
              gap: 12,
            }}
          >
            <div>
              <div style={{ ...eyebrow, marginBottom: 6 }}>
                Təxmini götürə biləcəyiniz
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: isMobile ? 32 : 40,
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                color: s.color,
                flexShrink: 0,
              }}
            >
              {s.label} <ShieldCheck size={15} />
            </div>
          </div>
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
            <span>DTI {dti}%</span>
            <span style={{ color: C.amber }}>bank həddi 40%</span>
            <span>60%</span>
          </div>

          {/* bildiriş — tövsiyə/açıq data modeli */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${C.line}`,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <Info
              size={15}
              style={{ color: C.green, flexShrink: 0, marginTop: 1 }}
            />
            <p
              style={{
                fontSize: 11.5,
                color: C.dim,
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              Biz kredit vermirik və kredit qərarı çıxarmırıq. Yalnız bankların
              hər kəsə açıq (ictimai) tariflərini toplayıb sizin profilinizə
              görə müqayisə edir və tövsiyə edirik. Hesablamalar tamamilə sizin
              daxil etdiyiniz məlumatlara əsaslanır — real banka müraciət
              edərkən bankın öz yoxlaması nəticəsində şərtlər fərqli ola bilər.
              Bütün rəqəmlər təxminidir; yekun qərara və şərtlərə görə
              məsuliyyət daşımırıq.
            </p>
          </div>
        </div>

        {/* faizi bilinən banklar — hamısı tam kart (AFB kimi) */}
        {known.map((b, i) => (
          <BankCard key={b.key} b={b} isBest={i === 0} />
        ))}

        {/* faizi təsdiqlənməyən banklar */}
        {unknown.length > 0 && (
          <>
            <div style={{ ...eyebrow, margin: "18px 4px 12px" }}>
              Digər banklar
            </div>
            {unknown.map((b) => (
              <BankRow key={b.key} b={b} />
            ))}
          </>
        )}

        {/* disclaimer — hüquqi qoruma */}
        <p
          style={{
            fontSize: 11.5,
            color: C.faint,
            textAlign: "center",
            lineHeight: 1.55,
            marginTop: 18,
            maxWidth: 400,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Bu, bankların açıq (ictimai) tariflərinə əsaslanan tövsiyədir — rəsmi
          təklif və ya partnyorluq deyil. Rəqəmlər təxminidir; dəqiq şərtləri
          bank öz saytında təsdiqləyir.
        </p>
      </div>
    </div>
  );
}

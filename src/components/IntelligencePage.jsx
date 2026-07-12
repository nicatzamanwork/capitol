import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFinancial } from "../App";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Send,
  Bot,
  ClipboardList,
} from "lucide-react";

/* ── tokens ── */
const C = {
  bg: "#060708",
  surface: "#0F1113",
  surface2: "#17191C",
  line: "rgba(255,255,255,.07)",
  text: "#F3F4F5",
  dim: "#868B94",
  faint: "#4C525B",
  green: "#35D6A0",
  amber: "#E7B24C",
  red: "#F26D6D",
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace';

/* ── chat persistence ── */
const CHAT_KEY = "capital_chat";
const GREETING = {
  role: "ai",
  text: "Salam. Kredit potensialınızı hesablamaq üçün aylıq xalis gəlirinizi yazın və ya aşağıdakı hazır məbləğlərdən birini seçin.",
};
function loadChat() {
  try {
    const r = localStorage.getItem(CHAT_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

/* ── responsive ── */
function useIsMobile(bp = 640) {
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

/* ── calc assumptions ── */
const MAX_DTI = 0.45,
  TERM_MONTHS = 36,
  ANNUAL_RATE = 0.14;
const INCOME_MIN = 100,
  INCOME_MAX = 100000,
  DEBT_MAX_MULT = 5;
const PV = (() => {
  const r = ANNUAL_RATE / 12;
  return (1 - Math.pow(1 + r, -TERM_MONTHS)) / r;
})();

function logEvent(type, metadata = {}) {
  try {
    window.__capitalTrack?.(type, metadata);
  } catch (_) {}
}
const incomeBucket = (v) =>
  v < 500 ? "<500" : v <= 1500 ? "500-1500" : "1500+";
const debtBucket = (v) =>
  v === 0 ? "0" : v <= 300 ? "1-300" : v <= 700 ? "301-700" : "700+";
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const round100 = (n) => Math.round(n / 100) * 100;

function computeResult(income, debt) {
  const dtiRatio = income > 0 ? Math.round((debt / income) * 100) : 0;
  const maxPayment = income * MAX_DTI - debt;
  const limit = maxPayment > 0 ? round100(maxPayment * PV) : 0;
  let status = "healthy";
  if (dtiRatio > 45) status = "critical";
  else if (dtiRatio > 30) status = "watch";
  const reduceBy =
    maxPayment < 0 ? Math.ceil((debt - income * MAX_DTI) / 10) * 10 : 0;
  return { dtiRatio, limit, status, reduceBy };
}

const STATUS = {
  healthy: { label: "Sağlam", color: C.green, Icon: ShieldCheck },
  watch: { label: "Diqqətli", color: C.amber, Icon: TriangleAlert },
  critical: { label: "Yüksək risk", color: C.red, Icon: TriangleAlert },
};

/* ════════════ PRE-SCORING ════════════ */
/* the questions a loan officer would ask (income & debt reused from quick flow) */
const PRESCORE_Q = [
  {
    key: "incomeType",
    text: "Gəliriniz hansı növdür?",
    type: "chips",
    options: [
      { v: "salary", l: "Rəsmi maaş" },
      { v: "business", l: "Sahibkarlıq" },
      { v: "pension", l: "Təqaüd" },
      { v: "informal", l: "Qeyri-rəsmi" },
    ],
  },
  {
    key: "activeLoans",
    text: "Hazırda neçə aktiv krediti­niz var?",
    type: "chips",
    options: [
      { v: 0, l: "0" },
      { v: 1, l: "1" },
      { v: 2, l: "2" },
      { v: 3, l: "3+" },
    ],
  },
  {
    key: "tenure",
    text: "Cari iş yerinizdə iş stajınız nə qədərdir?",
    type: "chips",
    options: [
      { v: "lt6", l: "6 aydan az" },
      { v: "6-12", l: "6–12 ay" },
      { v: "1-3", l: "1–3 il" },
      { v: "3+", l: "3 ildən çox" },
    ],
  },
  {
    key: "age",
    text: "Yaşınız hansı aralıqdadır?",
    type: "chips",
    options: [
      { v: "18-25", l: "18–25" },
      { v: "26-40", l: "26–40" },
      { v: "41-55", l: "41–55" },
      { v: "55+", l: "55+" },
    ],
  },
  {
    key: "region",
    text: "Hansı regiondasınız?",
    type: "chips",
    options: [
      { v: "baku", l: "Bakı" },
      { v: "region", l: "Region" },
    ],
  },
  { key: "amount", text: "Nə qədər kredit istəyirsiniz? (₼)", type: "number" },
  {
    key: "term",
    text: "Neçə aya götürmək istəyirsiniz?",
    type: "chips",
    options: [
      { v: 12, l: "12 ay" },
      { v: 24, l: "24 ay" },
      { v: 36, l: "36 ay" },
      { v: 48, l: "48+ ay" },
    ],
  },
  {
    key: "purpose",
    text: "Kredit hansı məqsədlə?",
    type: "chips",
    options: [
      { v: "cash", l: "Nağd" },
      { v: "auto", l: "Avto" },
      { v: "repair", l: "Təmir" },
      { v: "business", l: "Biznes" },
    ],
  },
  {
    key: "history",
    text: "Kredit tarixçəniz necədir?",
    type: "chips",
    options: [
      { v: "clean", l: "Təmiz" },
      { v: "minor", l: "Kiçik gecikmə olub" },
      { v: "serious", l: "Ciddi problem olub" },
    ],
  },
  {
    key: "guarantor",
    text: "Girov və ya zamin verə bilərsiniz?",
    type: "chips",
    options: [
      { v: "yes", l: "Bəli" },
      { v: "no", l: "Xeyr" },
    ],
  },
];

const LIKE = {
  high: { label: "Yüksək təsdiq ehtimalı", color: C.green },
  medium: { label: "Orta təsdiq ehtimalı", color: C.amber },
  low: { label: "Aşağı təsdiq ehtimalı", color: C.red },
};

function prescore(a) {
  const income = a.income || 0,
    debt = a.debt || 0;
  const base = computeResult(income, debt);
  let score = 0;
  score +=
    { salary: 25, business: 15, pension: 15, informal: 5 }[a.incomeType] ?? 5;
  score += base.dtiRatio <= 30 ? 25 : base.dtiRatio <= 45 ? 12 : 0;
  score += { lt6: 0, "6-12": 5, "1-3": 10, "3+": 15 }[a.tenure] ?? 5;
  score += { 0: 15, 1: 10, 2: 5, 3: 0 }[a.activeLoans] ?? 0;
  score += { clean: 20, minor: 8, serious: 0 }[a.history] ?? 8;
  score += a.age === "26-40" || a.age === "41-55" ? 5 : 2;
  score += a.guarantor === "yes" ? 5 : 0;
  score = Math.max(0, Math.min(100, score));

  let factor = 1;
  if (a.incomeType === "informal") factor *= 0.6;
  if (a.incomeType === "business") factor *= 0.85;
  if (a.history === "minor") factor *= 0.85;
  if (a.history === "serious") factor *= 0.5;
  if (a.guarantor === "yes") factor *= 1.15;

  const eligibleLimit = Math.max(0, round100(base.limit * factor));
  const requested = a.amount || eligibleLimit;
  const likelihood = score >= 70 ? "high" : score >= 45 ? "medium" : "low";

  const factors = [];
  if (a.incomeType === "salary")
    factors.push({ good: true, text: "Rəsmi maaş — güclü siqnal" });
  else if (a.incomeType === "informal")
    factors.push({ good: false, text: "Qeyri-rəsmi gəlir — limit azalır" });
  if (base.dtiRatio <= 30)
    factors.push({ good: true, text: `DTI aşağıdır (${base.dtiRatio}%)` });
  else if (base.dtiRatio > 45)
    factors.push({ good: false, text: `DTI yüksəkdir (${base.dtiRatio}%)` });
  if (a.history === "clean")
    factors.push({ good: true, text: "Təmiz kredit tarixçəsi" });
  else if (a.history === "serious")
    factors.push({ good: false, text: "Kredit tarixçəsində ciddi problem" });
  if (a.tenure === "3+") factors.push({ good: true, text: "Uzun iş stajı" });
  else if (a.tenure === "lt6")
    factors.push({ good: false, text: "Qısa iş stajı" });
  if (a.activeLoans >= 3)
    factors.push({ good: false, text: "Çoxsaylı aktiv kredit" });
  if (a.guarantor === "yes")
    factors.push({ good: true, text: "Zamin/girov mövcuddur" });

  return {
    score,
    likelihood,
    dti: base.dtiRatio,
    eligibleLimit,
    requested,
    factors: factors.slice(0, 5),
  };
}

const isCreditIntent = (t) => {
  const s = t.toLowerCase();
  return (
    /(kredit|müraciət|loan|borc almaq)/.test(s) &&
    /(ist|götür|lazım|ehtiyac|al|müraciət|başla|edə|verin)/.test(s)
  );
};

/* ── rule-based Q&A ── */
function answerFor(question, ctx) {
  if (!ctx)
    return "Əvvəlcə gəlir və borcunuzu qeyd edin, sonra suallarınızı cavablandıra bilərəm.";
  const t = question.toLowerCase();
  const { income, debt, result } = ctx;
  const { dtiRatio, limit, status, reduceBy } = result;
  const per100debt = round100(100 * PV);
  const per100income = round100(100 * MAX_DTI * PV);
  const zeroDebtLimit = round100(income * MAX_DTI * PV);
  if (/(faiz|interest|dərəcə|%|percent)/.test(t))
    return `Hesablamada təxmini ~${Math.round(
      ANNUAL_RATE * 100
    )}% illik dərəcə götürülüb. Real faizi bank sizin profilinizə görə təyin edir — açıq tariflər Eligibility səhifəsindədir (11.5%-dən başlayır).`;
  if (/(azalt|azald|borcu.*az|reduce|ödə)/.test(t)) {
    if (status === "critical")
      return `Aylıq borcunuzu təxminən ${fmt(
        reduceBy
      )} ₼ azaltsanız, DTI 45% həddinin altına düşür və təkliflər açılır.`;
    return `Borc azaltmaq limitinizi artırır: hər 100 ₼ az borc ≈ +${fmt(
      per100debt
    )} ₼ limit. Borcunuzu tam bağlasanız (${fmt(debt)} ₼), limit ~${fmt(
      zeroDebtLimit
    )} ₼-ə çıxar.`;
  }
  if (/(artır|çoxalt|daha çox|yüksəlt|böyüt|increase)/.test(t))
    return `Limiti artırmağın iki yolu var: (1) borcu azaltmaq — hər 100 ₼ ≈ +${fmt(
      per100debt
    )} ₼; (2) gəliri artırmaq — hər 100 ₼ gəlir ≈ +${fmt(
      per100income
    )} ₼ limit.`;
  if (/(limit|nə qədər|hesabla|necə çıx|haradan|calculate)/.test(t))
    return `Limit belə çıxır: gəlirinizin 45%-i (${fmt(
      income * MAX_DTI
    )} ₼) minus mövcud borc (${fmt(
      debt
    )} ₼) = aylıq əlçatan ödəniş. Bu, ${TERM_MONTHS} ay üzrə ~${Math.round(
      ANNUAL_RATE * 100
    )}% ilə hesablanır → ~${fmt(limit)} ₼.`;
  if (/(dti|nisbət|borc.*gəlir|risk)/.test(t))
    return `DTI = aylıq borc ÷ aylıq gəlir. Sizdə: ${fmt(debt)} ÷ ${fmt(
      income
    )} = ${dtiRatio}%. Banklar adətən 45%-ə qədər qəbul edir; siz ${
      status === "healthy"
        ? "bu həddin xeyli altındasınız"
        : status === "watch"
        ? "həddə yaxınsınız"
        : "həddi keçirsiniz"
    }.`;
  if (/(müddət|neçə ay|term|il )/.test(t))
    return `Hesablama ${TERM_MONTHS} ay əsasındadır. Daha uzun müddət aylıq ödənişi azaldıb limiti artırır, amma ümumi faiz yükünü çoxaldır.`;
  if (/(bank|hansı|təklif|kim|müraciət)/.test(t))
    return `Sizə uyğun bankları və onların açıq tariflərini Eligibility səhifəsində görə bilərsiniz — profilinizə görə sıralanıb.`;
  if (/(sağ ?ol|təşəkkür|thanks|minnətdar)/.test(t))
    return `Dəyməz. Başqa sualınız olsa, buradan soruşa bilərsiniz.`;
  return `Bunu dəqiq cavablandıra bilmirəm. Kredit almaq istəyirsinizsə "kredit istəyirəm" yazın — ətraflı ön-skorinqə başlayaq. Ya da faiz, limit, DTI barədə soruşun.`;
}

/* ── count-up ── */
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

/* ── quick DTI result card ── */
function ResultCard({ result, isMobile }) {
  const { dtiRatio, limit, status, reduceBy } = result;
  const s = STATUS[status];
  const marker = Math.min((dtiRatio / 60) * 100, 100);
  const box = {
    background: "rgba(255,255,255,.02)",
    border: `1px solid ${C.line}`,
    borderRadius: 16,
    padding: isMobile ? 16 : 20,
  };
  const eyebrow = {
    fontSize: 10,
    letterSpacing: ".2em",
    textTransform: "uppercase",
    color: C.faint,
    fontWeight: 700,
    marginBottom: 6,
  };
  return (
    <div
      style={{
        paddingTop: 8,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={box}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 16,
            gap: 12,
          }}
        >
          <div>
            <div style={eyebrow}>Borc / gəlir nisbəti</div>
            <div
              style={{
                fontFamily: MONO,
                fontVariantNumeric: "tabular-nums",
                fontSize: isMobile ? 32 : 40,
                fontWeight: 600,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              <CountUp value={dtiRatio} />
              <span style={{ fontSize: isMobile ? 18 : 22, color: C.dim }}>
                %
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              background: s.color + "1A",
              color: s.color,
              border: `1px solid ${s.color}33`,
              whiteSpace: "nowrap",
            }}
          >
            <s.Icon size={13} /> {s.label}
          </div>
        </div>
        <div
          style={{
            position: "relative",
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div style={{ width: "50%", background: C.green + "33" }} />
          <div style={{ width: "25%", background: C.amber + "33" }} />
          <div style={{ width: "25%", background: C.red + "33" }} />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `calc(${marker}% - 6px)`,
              transform: "translateY(-50%)",
              width: 12,
              height: 12,
              borderRadius: 999,
              background: s.color,
              border: "2px solid #000",
              boxShadow: `0 0 10px ${s.color}`,
              transition: "left 1s cubic-bezier(.22,.61,.36,1)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontSize: 9,
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
      <div style={box}>
        <div style={eyebrow}>Təxmini kredit limiti</div>
        <div
          style={{
            fontFamily: MONO,
            fontVariantNumeric: "tabular-nums",
            fontSize: isMobile ? 26 : 30,
            fontWeight: 600,
            lineHeight: 1,
            marginBottom: 12,
            color: limit > 0 ? C.green : C.red,
          }}
        >
          <CountUp value={limit} />{" "}
          <span style={{ fontSize: isMobile ? 15 : 18, color: C.dim }}>₼</span>
        </div>
        <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.55, margin: 0 }}>
          {status === "healthy" &&
            `Gəlirinizin ${dtiRatio}%-i borc ödənişlərinə gedir — bankların 45% həddindən xeyli aşağı. Yeni kredit üçün güclü mövqedəsiniz.`}
          {status === "watch" &&
            `Gəlirinizin ${dtiRatio}%-i borca gedir — 45% həddinə yaxınlaşırsınız. Kredit mümkündür, amma limit məhduddur.`}
          {status === "critical" && (
            <>
              Gəlirinizin {dtiRatio}%-i borca gedir — 45% həddini keçir. Aylıq
              borcunuzu təxminən{" "}
              <b style={{ color: "#fff", fontFamily: MONO }}>
                {fmt(reduceBy)} ₼
              </b>{" "}
              azaltsanız, təkliflər açılır.
            </>
          )}
        </p>
        <div style={{ marginTop: 12, fontSize: 10, color: C.faint }}>
          {TERM_MONTHS} ay · ~{Math.round(ANNUAL_RATE * 100)}% əsasında təxmini.
          Dəqiq rəqəm bank tərəfindən müəyyən olunur.
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: C.green,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Sparkles size={12} style={{ flexShrink: 0 }} /> Kredit almaq
          istəyirsinizsə "kredit istəyirəm" yazın — ətraflı ön-skorinqə
          başlayaq.
        </div>
      </div>
    </div>
  );
}

/* ── pre-scoring result card ── */
function PrescoreCard({ data, isMobile }) {
  const { score, likelihood, eligibleLimit, requested, factors } = data;
  const lk = LIKE[likelihood];
  const box = {
    background: "rgba(255,255,255,.02)",
    border: `1px solid ${C.line}`,
    borderRadius: 16,
    padding: isMobile ? 16 : 20,
  };
  const eyebrow = {
    fontSize: 10,
    letterSpacing: ".2em",
    textTransform: "uppercase",
    color: C.faint,
    fontWeight: 700,
    marginBottom: 6,
  };
  return (
    <div
      style={{
        paddingTop: 8,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={box}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 16,
            gap: 12,
          }}
        >
          <div>
            <div style={eyebrow}>Ön-skorinq nəticəsi</div>
            <div
              style={{
                fontFamily: MONO,
                fontVariantNumeric: "tabular-nums",
                fontSize: isMobile ? 32 : 40,
                fontWeight: 600,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              <CountUp value={score} />
              <span style={{ fontSize: isMobile ? 16 : 20, color: C.dim }}>
                /100
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              background: lk.color + "1A",
              color: lk.color,
              border: `1px solid ${lk.color}33`,
              whiteSpace: "nowrap",
            }}
          >
            <ShieldCheck size={13} /> {lk.label}
          </div>
        </div>
        <div
          style={{
            position: "relative",
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            background: "rgba(255,255,255,.06)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${score}%`,
              background: lk.color,
              borderRadius: 999,
              boxShadow: `0 0 10px ${lk.color}`,
              transition: "width 1s cubic-bezier(.22,.61,.36,1)",
            }}
          />
        </div>
      </div>

      <div style={box}>
        <div style={eyebrow}>Təxmini əlçatan limit</div>
        <div
          style={{
            fontFamily: MONO,
            fontVariantNumeric: "tabular-nums",
            fontSize: isMobile ? 26 : 30,
            fontWeight: 600,
            lineHeight: 1,
            marginBottom: 8,
            color: eligibleLimit > 0 ? C.green : C.red,
          }}
        >
          <CountUp value={eligibleLimit} />{" "}
          <span style={{ fontSize: isMobile ? 15 : 18, color: C.dim }}>₼</span>
        </div>
        {requested > 0 && (
          <p style={{ fontSize: 12, color: C.dim, margin: "0 0 12px" }}>
            İstədiyiniz:{" "}
            <span style={{ fontFamily: MONO, color: "#fff" }}>
              {fmt(requested)} ₼
            </span>
            {eligibleLimit >= requested
              ? " — bu məbləğ profilinizə uyğundur."
              : " — profilinizə görə bu məbləğ məhduddur."}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {factors.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: C.dim,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: f.good ? C.green : C.red,
                  flexShrink: 0,
                }}
              />
              {f.text}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: C.faint }}>
          Bu, süni intellekt əsaslı ilkin proqnozdur (pre-scoring), rəsmi kredit
          qərarı deyil. Yekun qərarı bank verir.
        </div>
      </div>
    </div>
  );
}

export default function IntelligencePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { updateFinancials } = useFinancial();

  const [saved] = useState(loadChat);
  const [step, setStep] = useState(() => saved?.step ?? 1); // 1 income · 2 debt · 3 Q&A
  const [mode, setMode] = useState(() => saved?.mode ?? "quick"); // "quick" | "prescore"
  const [preIndex, setPreIndex] = useState(() => saved?.preIndex ?? 0);
  const [answers, setAnswers] = useState(() => saved?.answers ?? {});
  const [inputValue, setInputValue] = useState("");
  const [tempIncome, setTempIncome] = useState(() => saved?.tempIncome ?? null);
  const [analysis, setAnalysis] = useState(() => saved?.analysis ?? null);
  const [messages, setMessages] = useState(() => saved?.messages ?? [GREETING]);

  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (!saved) logEvent("chat_start");
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        CHAT_KEY,
        JSON.stringify({
          messages: messages.slice(-60),
          step,
          mode,
          preIndex,
          answers,
          tempIncome,
          analysis,
        })
      );
    } catch {}
  }, [messages, step, mode, preIndex, answers, tempIncome, analysis]);

  const addAI = (text, extra = {}) =>
    setMessages((p) => [...p, { role: "ai", text, ...extra }]);
  const addUser = (text) => setMessages((p) => [...p, { role: "user", text }]);

  const validate = (raw) => {
    const clean = String(raw)
      .replace(",", ".")
      .replace(/[^0-9.]/g, "");
    const num = parseFloat(clean);
    if (!clean || isNaN(num))
      return { error: "Zəhmət olmasa məbləği rəqəmlə yazın (məsələn: 1500)." };
    if (num < 0) return { error: "Məbləğ mənfi ola bilməz. Yenidən yoxlayın." };
    if (step === 1) {
      if (num < INCOME_MIN)
        return {
          error: "Bu gəlir çox aşağı görünür. Aylıq xalis gəlirinizi yoxlayın.",
        };
      if (num > INCOME_MAX)
        return { error: "Bu rəqəm həddindən yüksəkdir. Yenidən yoxlayın." };
    } else if (step === 2 && tempIncome && num > tempIncome * DEBT_MAX_MULT) {
      return {
        error:
          "Borc ödənişi gəlirinizdən qat-qat böyük görünür. Rəqəmi yoxlayın.",
      };
    }
    return { value: num };
  };

  const submitNumber = (raw, label) => {
    const { value, error } = validate(raw);
    addUser(label ?? `${String(raw).replace(/[^0-9.]/g, "")} ₼`);
    setInputValue("");
    if (error) {
      setTimeout(() => addAI(error, { isError: true }), 400);
      return;
    }
    if (step === 1) {
      setTempIncome(value);
      setStep(2);
      logEvent("income_entered", { bucket: incomeBucket(value) });
      setTimeout(
        () =>
          addAI(
            "Alındı. İndi isə aylıq daimi borc ödənişlərinizin ümumi məbləğini yazın (kredit, kredit kartı və s.). Borcunuz yoxdursa, 0 seçin."
          ),
        550
      );
    } else if (step === 2) {
      const result = computeResult(tempIncome, value);
      setAnalysis({ income: tempIncome, debt: value, result });
      updateFinancials({
        monthlyIncome: tempIncome,
        monthlyDebtPayments: value,
        computedLimit: result.limit,
        eligibilityStatus: result.status,
      });
      setStep(3);
      logEvent("debt_entered", { bucket: debtBucket(value) });
      logEvent("limit_shown", {
        dti: result.dtiRatio,
        limit: result.limit,
        status: result.status,
      });
      setTimeout(
        () =>
          addAI(
            'Analiziniz hazırdır. Kredit almaq istəyirsinizsə, ətraflı ön-skorinq üçün aşağıdakı düyməni basın və ya "kredit istəyirəm" yazın.',
            { result }
          ),
        550
      );
    }
  };

  /* ── pre-scoring flow ── */
  const startPrescore = () => {
    if (!analysis) {
      addAI(
        "Əvvəlcə gəlir və borcunuzu qeyd edək, sonra ön-skorinqə keçək. Aylıq gəlirinizi yazın."
      );
      return;
    }
    setMode("prescore");
    setPreIndex(0);
    setAnswers({ income: analysis.income, debt: analysis.debt });
    logEvent("prescore_start");
    setTimeout(
      () =>
        addAI(
          `Kredit əməkdaşının soruşduğu sualları verəcəm — ${PRESCORE_Q.length} qısa sual. ${PRESCORE_Q[0].text}`
        ),
      500
    );
  };

  const answerPre = (value, label) => {
    addUser(label ?? String(value));
    setInputValue("");
    const qdef = PRESCORE_Q[preIndex];
    const next = { ...answers, [qdef.key]: value };
    setAnswers(next);
    const ni = preIndex + 1;
    if (ni < PRESCORE_Q.length) {
      setPreIndex(ni);
      setTimeout(() => addAI(PRESCORE_Q[ni].text), 400);
    } else {
      const res = prescore(next);
      setMode("quick");
      setPreIndex(0);
      updateFinancials({
        monthlyIncome: next.income,
        monthlyDebtPayments: next.debt,
        computedLimit: res.eligibleLimit,
        eligibilityStatus:
          res.likelihood === "high"
            ? "healthy"
            : res.likelihood === "medium"
            ? "watch"
            : "critical",
        prescore: {
          score: res.score,
          likelihood: res.likelihood,
          requested: res.requested,
        },
      });
      logEvent("prescore_complete", {
        score: res.score,
        likelihood: res.likelihood,
        limit: res.eligibleLimit,
      });
      setTimeout(
        () => addAI("Ön-skorinqiniz hazırdır:", { prescore: res }),
        500
      );
    }
  };

  const answerPreFromInput = () => {
    const qdef = PRESCORE_Q[preIndex];
    const raw = inputValue.trim();
    if (!raw) return;
    if (qdef.type === "number") {
      const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
      if (isNaN(n) || n <= 0) {
        addUser(raw);
        setInputValue("");
        setTimeout(
          () =>
            addAI("Zəhmət olmasa məbləği rəqəmlə yazın.", { isError: true }),
          300
        );
        return;
      }
      answerPre(n, `${fmt(n)} ₼`);
    } else {
      answerPre(raw, raw);
    }
  };

  const ask = (raw) => {
    const q = String(raw).trim();
    if (!q) return;
    if (isCreditIntent(q)) {
      addUser(q);
      setInputValue("");
      startPrescore();
      return;
    }
    addUser(q);
    setInputValue("");
    logEvent("followup_question");
    setTimeout(() => addAI(answerFor(q, analysis)), 500);
  };

  const send = () => {
    if (!inputValue.trim()) return;
    if (mode === "prescore") answerPreFromInput();
    else if (step === 3) ask(inputValue);
    else submitNumber(inputValue);
  };

  const reset = () => {
    setStep(1);
    setMode("quick");
    setPreIndex(0);
    setAnswers({});
    setTempIncome(null);
    setInputValue("");
    setAnalysis(null);
    addAI("Yenidən başlayaq. Aylıq xalis gəlirinizi yazın və ya seçin.");
    logEvent("chat_start", { restarted: true });
  };

  const goEligibility = () => {
    logEvent("go_to_eligibility");
    navigate("/eligibility");
  };

  const quickIncome = [800, 1500, 3000];
  const quickDebt = [
    { v: 0, l: "Borcum yoxdur" },
    { v: 300, l: "300 ₼" },
    { v: 700, l: "700 ₼" },
  ];

  const chip = {
    background: "rgba(255,255,255,.03)",
    border: `1px solid ${C.line}`,
    color: C.dim,
    fontSize: 11,
    padding: "8px 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: MONO,
  };
  const chipAsk = { ...chip, fontFamily: "inherit", color: C.text };
  const chipGreen = {
    ...chip,
    fontFamily: "inherit",
    color: C.green,
    borderColor: C.green + "44",
    background: C.green + "12",
  };
  const pad = isMobile ? "16px 12px" : "28px 24px";

  const curQ = mode === "prescore" ? PRESCORE_Q[preIndex] : null;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.text,
        padding: pad,
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          gap: 12,
          maxWidth: 760,
          width: "100%",
          margin: `0 auto ${isMobile ? 16 : 24}px`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: ".28em",
              textTransform: "uppercase",
              color: C.faint,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Intelligence
          </div>
          <h1
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 600,
              letterSpacing: "-.02em",
              margin: 0,
              color: "rgba(255,255,255,.9)",
            }}
          >
            AI Financial Advisor
          </h1>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,.02)",
            border: `1px solid ${C.line}`,
            padding: "6px 12px",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: mode === "prescore" ? C.amber : C.green,
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: C.dim,
              fontWeight: 600,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            {mode === "prescore"
              ? "Pre-Scoring"
              : isMobile
              ? "AI"
              : "Hybrid Chat"}
          </span>
        </div>
      </div>

      {/* chat stream */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          maxWidth: 760,
          width: "100%",
          margin: "0 auto",
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 16 : 20,
          }}
        >
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div
                key={i}
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    background: C.surface2,
                    border: `1px solid ${C.line}`,
                    padding: "12px 18px",
                    borderRadius: 16,
                    fontSize: 12,
                    color: "#D1D5DB",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ) : (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: isMobile ? 8 : 12,
                }}
              >
                <div
                  style={{
                    width: isMobile ? 30 : 34,
                    height: isMobile ? 30 : 34,
                    borderRadius: 999,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    marginTop: 2,
                    background: (msg.isError ? C.red : C.green) + "1A",
                    border: `1px solid ${msg.isError ? C.red : C.green}33`,
                  }}
                >
                  <Bot
                    size={isMobile ? 14 : 16}
                    style={{ color: msg.isError ? C.red : C.green }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    maxWidth: 600,
                    border: `1px solid ${msg.isError ? C.red + "33" : C.line}`,
                    borderRadius: 16,
                    padding: isMobile ? 16 : 20,
                    background: msg.isError
                      ? C.red + "0D"
                      : "linear-gradient(to bottom, rgba(255,255,255,.04), transparent)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: ".16em",
                      textTransform: "uppercase",
                      color: C.faint,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Advisor
                  </div>
                  <p
                    style={{
                      lineHeight: 1.6,
                      margin: 0,
                      fontSize: 12,
                      color: msg.isError ? C.red : "#D1D5DB",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.text}
                  </p>
                  {msg.result && (
                    <ResultCard result={msg.result} isMobile={isMobile} />
                  )}
                  {msg.prescore && (
                    <PrescoreCard data={msg.prescore} isMobile={isMobile} />
                  )}
                </div>
              </div>
            )
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* control panel */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: 16,
          maxWidth: 760,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* PRE-SCORING: progress + current question chips */}
        {mode === "prescore" && curQ && (
          <>
            <div
              style={{
                fontSize: 10,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: C.amber,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ClipboardList size={12} /> Ön-skorinq · sual {preIndex + 1}/
              {PRESCORE_Q.length}
            </div>
            {curQ.type === "chips" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {curQ.options.map((o) => (
                  <button
                    key={String(o.v)}
                    style={chipAsk}
                    onClick={() => answerPre(o.v, o.l)}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* QUICK flow chips */}
        {mode === "quick" && step === 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {quickIncome.map((v) => (
              <button
                key={v}
                style={chip}
                onClick={() => submitNumber(v, `Aylıq gəlir: ${fmt(v)} ₼`)}
              >
                {fmt(v)} ₼
              </button>
            ))}
          </div>
        )}
        {mode === "quick" && step === 2 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {quickDebt.map((d) => (
              <button
                key={d.v}
                style={chip}
                onClick={() => submitNumber(d.v, `Aylıq borc: ${d.l}`)}
              >
                {d.l}
              </button>
            ))}
          </div>
        )}
        {mode === "quick" && step === 3 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button style={chipGreen} onClick={startPrescore}>
              Kredit almaq istəyirəm
            </button>
            <button style={chipAsk} onClick={() => ask("Limiti necə artırım?")}>
              Limiti necə artırım?
            </button>
            <button style={chipAsk} onClick={() => ask("Faizi niyə belədir?")}>
              Faiz nə qədərdir?
            </button>
          </div>
        )}

        {/* input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#0D0D0F",
            border: `1px solid ${C.line}`,
            borderRadius: 999,
            padding: isMobile ? "8px 12px" : "10px 16px",
          }}
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            inputMode={
              (mode === "prescore" && curQ?.type === "number") || step < 3
                ? "decimal"
                : "text"
            }
            placeholder={
              mode === "prescore"
                ? curQ?.type === "number"
                  ? "Rəqəm yazın…"
                  : "Cavabı yazın və ya yuxarıdan seçin…"
                : step === 1
                ? "Gəlirinizi yazın və ya seçin…"
                : step === 2
                ? "Borcunuzu yazın və ya seçin…"
                : 'Sual verin və ya "kredit istəyirəm" yazın…'
            }
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontFamily:
                (mode === "quick" && step === 3) ||
                (mode === "prescore" && curQ?.type !== "number")
                  ? "inherit"
                  : MONO,
              fontVariantNumeric: "tabular-nums",
              fontSize: isMobile ? 16 : 14,
              padding: "4px 0",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginLeft: 8,
            }}
          >
            {((mode === "quick" && step !== 3) ||
              (mode === "prescore" && curQ?.type === "number")) && (
              <span
                style={{
                  fontSize: 10,
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  padding: "4px 10px",
                  borderRadius: 999,
                  color: C.dim,
                }}
              >
                ₼
              </span>
            )}
            <button
              onClick={send}
              disabled={!inputValue.trim()}
              style={{
                padding: 8,
                borderRadius: 999,
                background: "#fff",
                color: "#000",
                border: "none",
                cursor: inputValue.trim() ? "pointer" : "default",
                opacity: inputValue.trim() ? 1 : 0.2,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Send size={11} />
            </button>
          </div>
        </div>

        {/* footer row (quick step 3 only) */}
        {mode === "quick" && step === 3 && (
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <button
              onClick={reset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                color: C.dim,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <RotateCcw size={13} /> Yenidən hesabla
            </button>
            <button
              onClick={goEligibility}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                fontWeight: 600,
                color: C.green,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                textAlign: "left",
              }}
            >
              Sizə kimlər kredit təklif edir, hansı şərtlərlə{" "}
              <ArrowRight size={14} style={{ flexShrink: 0 }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFinancial } from "../App";
import { BrainCircuit, Send, RotateCcw, ArrowRight } from "lucide-react";

/* ── tokens ── */
const C = {
  bg: "#060708",
  surface: "#0F1113",
  bubbleAI: "#1B1D1F",
  bubbleUser: "#ECE9E2",
  line: "rgba(255,255,255,.07)",
  text: "#F3F4F5",
  dim: "#868B94",
  faint: "#4C525B",
  green: "#35D6A0",
  amber: "#E7B24C",
  red: "#F26D6D",
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace';
const MOBILE_NAV_PAD = "calc(120px + env(safe-area-inset-bottom))";

/* ── calc ── */
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
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const round100 = (n) => Math.round(n / 100) * 100;

function logEvent(type, meta = {}) {
  try {
    window.__capitalTrack?.(type, meta);
  } catch (_) {}
}

function computeResult(income, debt) {
  const dtiRatio = income > 0 ? Math.round((debt / income) * 100) : 0;
  const maxPayment = income * MAX_DTI - debt;
  const limit = maxPayment > 0 ? round100(maxPayment * PV) : 0;
  let status = "healthy";
  if (dtiRatio > 45) status = "critical";
  else if (dtiRatio > 30) status = "watch";
  return { dtiRatio, limit, status };
}

/* ── 5 sual (funksional, dizayna sadiq) ── */
const QUESTIONS = [
  {
    key: "income",
    text: "Aylıq xalis gəliriniz nə qədərdir?",
    type: "number",
    quick: [800, 1500, 3000],
  },
  {
    key: "debt",
    text: "Aylıq borc ödənişiniz nə qədərdir? (kredit, kart və s.)",
    type: "number",
    quick: [
      { v: 0, l: "Borcum yoxdur" },
      { v: 300, l: "300 ₼" },
      { v: 700, l: "700 ₼" },
    ],
  },
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
];

const LIKE = {
  high: { label: "Yüksək təsdiq ehtimalı", color: C.green },
  medium: { label: "Orta təsdiq ehtimalı", color: C.amber },
  low: { label: "Aşağı təsdiq ehtimalı", color: C.red },
};

/* ── 5-faktorlu skorinq (cəmi 100) ── */
function prescore(a) {
  const income = a.income || 0,
    debt = a.debt || 0;
  const base = computeResult(income, debt);
  let score = 0;
  score +=
    { salary: 30, business: 20, pension: 20, informal: 8 }[a.incomeType] ?? 8;
  score += base.dtiRatio <= 30 ? 30 : base.dtiRatio <= 45 ? 15 : 0;
  score += { lt6: 0, "6-12": 8, "1-3": 14, "3+": 20 }[a.tenure] ?? 8;
  score += { 0: 20, 1: 14, 2: 7, 3: 0 }[a.activeLoans] ?? 0;
  score = Math.max(0, Math.min(100, score));

  let factor = 1;
  if (a.incomeType === "informal") factor *= 0.6;
  if (a.incomeType === "business") factor *= 0.85;
  const eligibleLimit = Math.max(0, round100(base.limit * factor));
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
  if (a.tenure === "3+") factors.push({ good: true, text: "Uzun iş stajı" });
  else if (a.tenure === "lt6")
    factors.push({ good: false, text: "Qısa iş stajı" });
  if (a.activeLoans >= 3)
    factors.push({ good: false, text: "Çoxsaylı aktiv kredit" });
  else if (a.activeLoans === 0)
    factors.push({ good: true, text: "Aktiv krediti yoxdur" });

  return {
    ...base,
    score,
    likelihood,
    eligibleLimit,
    factors: factors.slice(0, 4),
  };
}

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

/* ── persistence ── */
const CHAT_KEY = "capital_advisor";
const GREETING = {
  role: "ai",
  text: "Kredit hazırlığınızı hesablayaq — bir neçə qısa sual.",
};
function loadChat() {
  try {
    const r = localStorage.getItem(CHAT_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

export default function IntelligencePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { updateFinancials } = useFinancial();

  const [saved] = useState(loadChat);
  const [messages, setMessages] = useState(
    () => saved?.messages ?? [GREETING, { role: "ai", text: QUESTIONS[0].text }]
  );
  const [qIndex, setQIndex] = useState(() => saved?.qIndex ?? 0);
  const [answers, setAnswers] = useState(() => saved?.answers ?? {});
  const [done, setDone] = useState(() => saved?.done ?? false);
  const [inputValue, setInputValue] = useState("");

  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (!saved) logEvent("prescore_start");
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        CHAT_KEY,
        JSON.stringify({ messages: messages.slice(-40), qIndex, answers, done })
      );
    } catch {}
  }, [messages, qIndex, answers, done]);

  const addAI = (text, extra = {}) =>
    setMessages((p) => [...p, { role: "ai", text, ...extra }]);
  const addUser = (text) => setMessages((p) => [...p, { role: "user", text }]);

  const curQ = QUESTIONS[qIndex];

  const finish = (allAnswers) => {
    const res = prescore(allAnswers);
    updateFinancials({
      monthlyIncome: allAnswers.income,
      monthlyDebtPayments: allAnswers.debt,
      computedLimit: res.eligibleLimit,
      eligibilityStatus:
        res.likelihood === "high"
          ? "healthy"
          : res.likelihood === "medium"
          ? "watch"
          : "critical",
      prescore: { score: res.score, likelihood: res.likelihood },
    });
    logEvent("prescore_complete", {
      score: res.score,
      likelihood: res.likelihood,
      limit: res.eligibleLimit,
    });
    setDone(true);
    setTimeout(
      () =>
        addAI(
          `Hazırdır! Hazırlıq skorunuz ${res.score}/100 — ${LIKE[
            res.likelihood
          ].label.toLowerCase()}. Nəticə Home səhifənizdə göründü.`
        ),
      450
    );
  };

  const advance = (key, value, label) => {
    addUser(label);
    setInputValue("");
    const next = { ...answers, [key]: value };
    setAnswers(next);
    const ni = qIndex + 1;
    if (ni < QUESTIONS.length) {
      setQIndex(ni);
      setTimeout(() => addAI(QUESTIONS[ni].text), 420);
    } else {
      finish(next);
    }
  };

  const submitNumber = (raw, label) => {
    const clean = String(raw)
      .replace(",", ".")
      .replace(/[^0-9.]/g, "");
    const num = parseFloat(clean);
    if (!clean || isNaN(num) || num < 0) {
      addUser(String(raw));
      setInputValue("");
      setTimeout(
        () =>
          addAI("Zəhmət olmasa məbləği rəqəmlə yazın (məsələn: 1500).", {
            isError: true,
          }),
        300
      );
      return;
    }
    if (curQ.key === "income") {
      if (num < INCOME_MIN) {
        addUser(`${fmt(num)} ₼`);
        setInputValue("");
        setTimeout(
          () =>
            addAI(
              "Bu gəlir çox aşağı görünür. Aylıq xalis gəlirinizi yoxlayın.",
              { isError: true }
            ),
          300
        );
        return;
      }
      if (num > INCOME_MAX) {
        addUser(`${fmt(num)} ₼`);
        setInputValue("");
        setTimeout(
          () =>
            addAI("Bu rəqəm həddindən yüksəkdir. Yenidən yoxlayın.", {
              isError: true,
            }),
          300
        );
        return;
      }
    }
    if (
      curQ.key === "debt" &&
      answers.income &&
      num > answers.income * DEBT_MAX_MULT
    ) {
      addUser(`${fmt(num)} ₼`);
      setInputValue("");
      setTimeout(
        () =>
          addAI("Borc gəlirinizdən qat-qat böyük görünür. Rəqəmi yoxlayın.", {
            isError: true,
          }),
        300
      );
      return;
    }
    advance(curQ.key, num, label ?? `${fmt(num)} ₼`);
  };

  const send = () => {
    if (done || !inputValue.trim()) return;
    if (curQ.type === "number") submitNumber(inputValue);
  };

  const reset = () => {
    setMessages([GREETING, { role: "ai", text: QUESTIONS[0].text }]);
    setQIndex(0);
    setAnswers({});
    setDone(false);
    setInputValue("");
    logEvent("prescore_start", { restarted: true });
  };

  const chip = {
    background: "rgba(255,255,255,.03)",
    border: `1px solid ${C.line}`,
    color: C.text,
    fontSize: 13,
    padding: "10px 18px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: "inherit",
  };
  const chipMono = { ...chip, fontFamily: MONO, color: C.dim };
  const pad = isMobile ? "16px 14px" : "24px 24px";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.text,
        padding: pad,
        boxSizing: "border-box",
        overflowX: "hidden",
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
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          paddingBottom: 16,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: C.green + "1A",
              border: `1px solid ${C.green}33`,
              display: "grid",
              placeItems: "center",
            }}
          >
            <BrainCircuit size={20} style={{ color: C.green }} />
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "-.01em",
            }}
          >
            AI Advisor
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 13px",
            borderRadius: 999,
            border: `1px solid ${C.green}33`,
            background: C.green + "12",
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
              letterSpacing: ".14em",
              textTransform: "uppercase",
            }}
          >
            Pre-Scoring
          </span>
        </div>
      </div>

      {/* chat */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          padding: "18px 0",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    background: C.bubbleUser,
                    color: "#161616",
                    padding: "11px 18px",
                    borderRadius: 18,
                    borderBottomRightRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ) : (
              <div
                key={i}
                style={{ display: "flex", justifyContent: "flex-start" }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    background: m.isError ? C.red + "12" : C.bubbleAI,
                    border: `1px solid ${
                      m.isError ? C.red + "33" : "transparent"
                    }`,
                    color: m.isError ? C.red : "#DFE2E6",
                    padding: "12px 18px",
                    borderRadius: 18,
                    borderBottomLeftRadius: 6,
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {m.text}
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
          paddingTop: 14,
          paddingBottom: isMobile ? MOBILE_NAV_PAD : 0,
          maxWidth: 720,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {done ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                logEvent("go_to_eligibility");
                navigate("/eligibility");
              }}
              style={{
                flex: 1,
                minWidth: 180,
                background: C.bubbleUser,
                color: "#161616",
                border: "none",
                padding: "15px",
                borderRadius: 16,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Bank təkliflərini gör <ArrowRight size={16} />
            </button>
            <button
              onClick={reset}
              style={{
                background: "transparent",
                color: C.dim,
                border: `1px solid ${C.line}`,
                padding: "15px 22px",
                borderRadius: 16,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RotateCcw size={15} /> Yenidən
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: C.green,
                fontWeight: 700,
              }}
            >
              Sual {qIndex + 1} / {QUESTIONS.length}
            </div>

            {curQ.type === "chips" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {curQ.options.map((o) => (
                  <button
                    key={String(o.v)}
                    style={chip}
                    onClick={() => advance(curQ.key, o.v, o.l)}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            )}

            {curQ.type === "number" && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {curQ.quick.map((q) => {
                    const v = typeof q === "object" ? q.v : q;
                    const l = typeof q === "object" ? q.l : `${fmt(q)} ₼`;
                    return (
                      <button
                        key={String(v)}
                        style={chipMono}
                        onClick={() => advance(curQ.key, v, l)}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
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
                    inputMode="decimal"
                    placeholder="Məbləği yazın…"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontFamily: MONO,
                      fontVariantNumeric: "tabular-nums",
                      fontSize: isMobile ? 16 : 14,
                      padding: "4px 0",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.1)",
                      padding: "4px 10px",
                      borderRadius: 999,
                      color: C.dim,
                      marginRight: 8,
                    }}
                  >
                    ₼
                  </span>
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

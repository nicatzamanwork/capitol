import React, { useState, useEffect } from "react";
import { useFinancial } from "../App";
import {
  PiggyBank,
  CreditCard,
  ShoppingBag,
  Target,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

/* ── tokens ── */
const C = {
  bg: "#060708",
  surface: "#0F1113",
  surface2: "#141618",
  line: "rgba(255,255,255,.07)",
  text: "#F3F4F5",
  dim: "#B0B6BF",
  faint: "#858B94",
  green: "#35D6A0",
  amber: "#E7B24C",
  red: "#F26D6D",
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace';
const MOBILE_NAV_PAD = "calc(96px + env(safe-area-inset-bottom))";
const GOALS_KEY = "capital_goals";

const CATS = [
  { key: "savings", label: "Yığım", icon: PiggyBank },
  { key: "debt", label: "Borc bağlama", icon: CreditCard },
  { key: "purchase", label: "Alış", icon: ShoppingBag },
  { key: "other", label: "Digər", icon: Target },
];
const catOf = (k) => CATS.find((c) => c.key === k) ?? CATS[3];

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function loadGoals() {
  try {
    const r = localStorage.getItem(GOALS_KEY);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}
function logEvent(type, meta = {}) {
  try {
    window.__capitalTrack?.(type, meta);
  } catch (_) {}
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

/* suggested templates (istifadəçinin datasına bağlı ola bilər) */
function suggestions(financialData) {
  const list = [
    { title: "Təcili ehtiyat fondu", cat: "savings", target: 3000 },
    {
      title: "Borcumu bağla",
      cat: "debt",
      target: (financialData?.monthlyDebtPayments ?? 0) * 12 || 5000,
    },
    { title: "Yeni telefon", cat: "purchase", target: 1500 },
  ];
  return list;
}

export default function GoalsPage() {
  const isMobile = useIsMobile();
  const { financialData } = useFinancial();
  const [goals, setGoals] = useState(loadGoals);
  const [editing, setEditing] = useState(null); // null | "new" | goalId
  const [form, setForm] = useState({
    title: "",
    target: "",
    current: "",
    cat: "savings",
  });

  useEffect(() => {
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch {}
  }, [goals]);

  const openNew = (preset) => {
    setForm(
      preset
        ? {
            title: preset.title,
            target: String(preset.target),
            current: "",
            cat: preset.cat,
          }
        : { title: "", target: "", current: "", cat: "savings" }
    );
    setEditing("new");
  };
  const openEdit = (g) => {
    setForm({
      title: g.title,
      target: String(g.target),
      current: String(g.current),
      cat: g.cat,
    });
    setEditing(g.id);
  };
  const cancel = () => {
    setEditing(null);
    setForm({ title: "", target: "", current: "", cat: "savings" });
  };

  const save = () => {
    const target = parseFloat(String(form.target).replace(/[^0-9.]/g, "")) || 0;
    const current =
      parseFloat(String(form.current).replace(/[^0-9.]/g, "")) || 0;
    if (!form.title.trim() || target <= 0) return;
    if (editing === "new") {
      setGoals((p) => [
        { id: uid(), title: form.title.trim(), target, current, cat: form.cat },
        ...p,
      ]);
      logEvent("goal_created", { cat: form.cat });
    } else {
      setGoals((p) =>
        p.map((g) =>
          g.id === editing
            ? { ...g, title: form.title.trim(), target, current, cat: form.cat }
            : g
        )
      );
      logEvent("goal_updated");
    }
    cancel();
  };

  const remove = (id) => {
    setGoals((p) => p.filter((g) => g.id !== id));
    logEvent("goal_deleted");
  };
  const bump = (id, delta) =>
    setGoals((p) =>
      p.map((g) =>
        g.id === id
          ? {
              ...g,
              current: Math.max(0, Math.min(g.target, g.current + delta)),
            }
          : g
      )
    );

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
  const inputStyle = {
    width: "100%",
    background: "#0D0D0F",
    border: `1px solid ${C.line}`,
    borderRadius: 12,
    padding: "12px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const Form = () => (
    <div style={{ ...card, padding: isMobile ? 18 : 22, marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={eyebrow}>
          {editing === "new" ? "Yeni məqsəd" : "Məqsədi düzəlt"}
        </div>
        <button
          onClick={cancel}
          style={{
            background: "none",
            border: "none",
            color: C.dim,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          style={inputStyle}
          placeholder="Məqsəd adı (məs. Yeni avtomobil)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <input
            style={inputStyle}
            inputMode="decimal"
            placeholder="Hədəf ₼"
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
          />
          <input
            style={inputStyle}
            inputMode="decimal"
            placeholder="Yığılan ₼"
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CATS.map((c) => {
            const active = form.cat === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setForm({ ...form, cat: c.key })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: active ? C.green + "18" : "rgba(255,255,255,.03)",
                  border: `1px solid ${active ? C.green + "44" : C.line}`,
                  color: active ? C.green : C.dim,
                }}
              >
                <c.icon size={14} /> {c.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={save}
          style={{
            marginTop: 4,
            background: "#ECE9E2",
            color: "#161616",
            border: "none",
            padding: "14px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Check size={16} /> Yadda saxla
        </button>
      </div>
    </div>
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
            <div style={{ ...eyebrow, marginBottom: 6 }}>Goals</div>
            <h1
              style={{
                fontSize: isMobile ? 26 : 30,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-.02em",
              }}
            >
              Məqsədlər
            </h1>
          </div>
          {editing == null && (
            <button
              onClick={() => openNew()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: C.green + "14",
                border: `1px solid ${C.green}33`,
                color: C.green,
                padding: "10px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={16} /> Yeni
            </button>
          )}
        </div>

        {/* form */}
        {editing != null && <Form />}

        {/* empty state */}
        {goals.length === 0 && editing == null && (
          <>
            <div
              style={{
                ...card,
                padding: isMobile ? 28 : 36,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "rgba(255,255,255,.03)",
                  border: `1px solid ${C.line}`,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Target size={22} style={{ color: C.green }} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#fff",
                    margin: "0 0 8px",
                  }}
                >
                  İlk maliyyə məqsədinizi qoyun
                </h2>
                <p
                  style={{
                    fontSize: 13.5,
                    color: C.dim,
                    lineHeight: 1.6,
                    maxWidth: 320,
                    margin: 0,
                  }}
                >
                  Yığım, borc bağlama və ya alış — hədəf təyin edin, irəliləyişi
                  izləyin.
                </p>
              </div>
            </div>
            <div style={{ ...eyebrow, margin: "0 4px 12px" }}>
              Təklif olunan məqsədlər
            </div>
            {suggestions(financialData).map((sug, i) => {
              const Cat = catOf(sug.cat).icon;
              return (
                <button
                  key={i}
                  onClick={() => openNew(sug)}
                  style={{
                    ...card,
                    width: "100%",
                    padding: "16px 18px",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: "rgba(255,255,255,.05)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Cat size={17} style={{ color: C.dim }} />
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}
                      >
                        {sug.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: C.faint,
                          fontFamily: MONO,
                        }}
                      >
                        {fmt(sug.target)} ₼
                      </div>
                    </div>
                  </div>
                  <Plus size={18} style={{ color: C.green }} />
                </button>
              );
            })}
          </>
        )}

        {/* goal list */}
        {goals.map((g) => {
          const pct = Math.max(
            0,
            Math.min(1, g.target > 0 ? g.current / g.target : 0)
          );
          const done = pct >= 1;
          const remaining = Math.max(0, g.target - g.current);
          const Cat = catOf(g.cat).icon;
          const barColor = done ? C.green : pct >= 0.5 ? C.green : C.amber;
          return (
            <div
              key={g.id}
              style={{ ...card, padding: isMobile ? 18 : 22, marginBottom: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
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
                    <Cat size={18} style={{ color: done ? C.green : C.dim }} />
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
                      {g.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.faint }}>
                      {catOf(g.cat).label}
                      {done ? " · tamamlandı ✓" : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(g)}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.faint,
                      cursor: "pointer",
                      padding: 6,
                    }}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => remove(g.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.faint,
                      cursor: "pointer",
                      padding: 6,
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontVariantNumeric: "tabular-nums",
                    fontSize: isMobile ? 20 : 24,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {fmt(g.current)}{" "}
                  <span style={{ fontSize: 13, color: C.faint }}>
                    / {fmt(g.target)} ₼
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 13,
                    fontWeight: 700,
                    color: barColor,
                  }}
                >
                  {Math.round(pct * 100)}%
                </div>
              </div>

              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.06)",
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct * 100}%`,
                    background: barColor,
                    borderRadius: 999,
                    boxShadow: `0 0 10px ${barColor}`,
                    transition: "width .6s cubic-bezier(.22,.61,.36,1)",
                  }}
                />
              </div>

              {!done && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 12, color: C.dim }}>
                    Qalıb:{" "}
                    <b style={{ color: "#fff", fontFamily: MONO }}>
                      {fmt(remaining)} ₼
                    </b>
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => bump(g.id, -100)}
                      style={{
                        background: "rgba(255,255,255,.04)",
                        border: `1px solid ${C.line}`,
                        color: C.dim,
                        borderRadius: 10,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: MONO,
                      }}
                    >
                      −100
                    </button>
                    <button
                      onClick={() => bump(g.id, 100)}
                      style={{
                        background: C.green + "18",
                        border: `1px solid ${C.green}33`,
                        color: C.green,
                        borderRadius: 10,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: MONO,
                      }}
                    >
                      +100 ₼
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* add another (when goals exist) */}
        {goals.length > 0 && editing == null && (
          <button
            onClick={() => openNew()}
            style={{
              width: "100%",
              background: "transparent",
              border: `1px dashed ${C.line}`,
              color: C.dim,
              padding: "16px",
              borderRadius: 16,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Plus size={16} /> Yeni məqsəd əlavə et
          </button>
        )}
      </div>
    </div>
  );
}

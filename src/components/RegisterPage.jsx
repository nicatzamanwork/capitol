import React, { useState } from "react";
import { Loader2, TrendingUp, CheckCircle2, EyeOff, Eye } from "lucide-react";
import { supabase } from "../supaBaseClient";

const GREEN = "#35D6A0";
const CREAM = "#ECE9E2";
const BG = "#060708";

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function RegisterPage({ onSwitchLogin }) {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const set = (k) => (e) => setFormData({ ...formData, [k]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        setIsSuccess(true);
        setTimeout(() => onSwitchLogin(), 2500);
      }
    } catch (err) {
      setError("Qeydiyyat zamanı xəta baş verdi.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/home" },
      });
      if (error) throw error;
    } catch (err) {
      setError("Google ilə qeydiyyat tezliklə aktiv olacaq.");
    }
  };

  const label = {
    fontSize: 10,
    letterSpacing: ".18em",
    textTransform: "uppercase",
    color: "#6B7280",
    fontWeight: 700,
    marginBottom: 8,
    display: "block",
  };
  const input = {
    width: "100%",
    background: "#141618",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 14,
    padding: "15px 16px",
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {isSuccess && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            background: "rgba(6,7,8,.94)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: GREEN,
                  padding: 16,
                  borderRadius: 999,
                  boxShadow: `0 0 50px ${GREEN}55`,
                }}
              >
                <CheckCircle2 style={{ color: "#111" }} size={48} />
              </div>
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#fff",
                margin: "0 0 8px",
              }}
            >
              Qeydiyyat tamamlandı!
            </h2>
            <p
              style={{
                color: "#6B7280",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: ".2em",
              }}
            >
              Giriş səhifəsinə yönləndirilirsiniz...
            </p>
          </div>
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 380 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: CREAM,
              display: "grid",
              placeItems: "center",
              boxShadow: "0 0 40px rgba(255,255,255,.06)",
            }}
          >
            <TrendingUp size={28} style={{ color: "#111" }} strokeWidth={2.5} />
          </div>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#fff",
            textAlign: "center",
            margin: "0 0 8px",
            letterSpacing: "-.02em",
          }}
        >
          Hesab yaradın
        </h1>
        <p
          style={{
            fontSize: 10.5,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "#6B7280",
            fontWeight: 600,
            textAlign: "center",
            margin: "0 0 28px",
          }}
        >
          Məlumatları daxil edin
        </p>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Ad Soyad</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={set("name")}
              placeholder="Adınızı daxil edin"
              style={input}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Email ünvanı</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={set("email")}
              placeholder="ad@sirket.com"
              style={input}
            />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={label}>Şifrə</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={set("password")}
                placeholder="Ən azı 8 simvol"
                style={{ ...input, paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#6B7280",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#F26D6D18",
                border: "1px solid #F26D6D33",
                color: "#F26D6D",
                fontSize: 13,
                padding: "12px 14px",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: CREAM,
              color: "#111",
              border: "none",
              padding: "16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Gözləyin...
              </>
            ) : (
              "Hesab yarat"
            )}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            margin: "20px 0",
            color: "#4C525B",
            fontSize: 10,
            letterSpacing: ".2em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }}
          />{" "}
          və ya{" "}
          <div
            style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }}
          />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          style={{
            width: "100%",
            background: "#141618",
            color: "#fff",
            border: "1px solid rgba(255,255,255,.1)",
            padding: "15px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <GoogleIcon /> Google ilə qeydiyyat
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 11,
            color: "#4C525B",
            lineHeight: 1.5,
          }}
        >
          Hesab yaratmaqla İstifadə Şərtləri və Məxfilik Siyasəti ilə
          razılaşırsınız.
        </p>

        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "#6B7280",
            fontWeight: 600,
          }}
        >
          Artıq hesabınız var?{" "}
          <button
            type="button"
            onClick={onSwitchLogin}
            style={{
              background: "none",
              border: "none",
              color: GREEN,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: ".12em",
              textTransform: "uppercase",
              fontSize: 11,
            }}
          >
            Daxil ol
          </button>
        </p>
      </div>
    </div>
  );
}

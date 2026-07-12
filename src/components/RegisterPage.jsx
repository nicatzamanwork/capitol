import React, { useState } from "react";
import {
  ShieldCheck,
  Loader2,
  TrendingUpDownIcon,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage({ onSwitchLogin }) {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Uğur vəziyyəti üçün
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true); // Alert əvəzinə seliqəli UI göstər

        // 2 saniyə sonra Logine yönəlt
        setTimeout(() => {
          onSwitchLogin();
        }, 2500);
      } else {
        alert(data.message); // Xəta mesajı hələlik qala bilər və ya bunu da stilizə edə bilərik
      }
    } catch (error) {
      console.error("Xəta:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 relative overflow-hidden">
      {/* SELİQELİ SUCCESS OVERLAY */}
      {isSuccess && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-emerald-500/100 p-4 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-emerald-500/20">
                <CheckCircle2 className="text-black" size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-medium text-white tracking-tight">
              Qeydiyyat Tamamlandı!
            </h2>
            <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">
              Giriş səhifəsinə yönləndirilirsiniz...
            </p>
          </div>
        </div>
      )}

      {/* Logo */}
      <div className="mb-12 bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
        <TrendingUpDownIcon className="text-black" size={32} />
      </div>

      <div className="w-full max-w-[400px] bg-[#0c0c0c] border border-white/5 rounded-[32px] p-10 shadow-2xl relative">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-medium text-white tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
            Enter details to create account
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleRegister}>
          <InputGroup
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(val) => setFormData({ ...formData, name: val })}
          />
          <InputGroup
            label="Email Address"
            placeholder="name@company.com"
            type="email"
            value={formData.email}
            onChange={(val) => setFormData({ ...formData, email: val })}
          />
          <InputGroup
            label="Password"
            placeholder="Min. 8 characters"
            type="password"
            value={formData.password}
            onChange={(val) => setFormData({ ...formData, password: val })}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          Already have an account?{" "}
          <span
            onClick={onSwitchLogin}
            className="text-white cursor-pointer hover:underline underline-offset-4"
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}

const InputGroup = ({ label, placeholder, type = "text", value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold ml-1">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-gray-800"
      required
    />
  </div>
);

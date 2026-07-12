import React, { useState } from "react";
import {
  EyeOff,
  Eye,
  TrendingUpDownIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage({ onLogin, onSwitchRegister }) {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Giriş uğurlu olanda overlay üçün
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // 1. Məlumatları yaddaşa yazırıq
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // 2. Uğur ekranını aktiv edirik
        setIsSuccess(true);

        // 3. 1.5 saniyə sonra ana səhifəyə (onLogin) keçid edirik
        setTimeout(() => {
          onLogin(data.user);
        }, 1500);
      } else {
        setError(data.message || "Email və ya şifrə yanlışdır.");
      }
    } catch (error) {
      setError("Serverlə əlaqə yaradıla bilmədi.");
    } finally {
      if (!isSuccess) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 relative overflow-hidden">
      {/* SUCCESS OVERLAY (Register ilə eyni dizayn) */}
      {isSuccess && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-emerald-500/10 p-4 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-emerald-500/20">
                <CheckCircle2 className="text-emerald-500" size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-medium text-white tracking-tight">
              Xoş gəldiniz!
            </h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">
              Sistemə giriş edilir...
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
            Welcome Back
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
            Enter details to access account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="text-red-500" size={16} />
            <p className="text-[11px] text-red-500 font-bold uppercase tracking-tighter">
              {error}
            </p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-600 font-bold ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-gray-800"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-600 font-bold ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-gray-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isSuccess}
            className="w-full bg-white text-black py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-10 text-center text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          Don't have an account?{" "}
          <span
            onClick={onSwitchRegister}
            className="text-white cursor-pointer hover:underline underline-offset-4"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

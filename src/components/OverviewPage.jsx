import React from "react";
import { useFinancial } from "../App"; // Qlobal mərkəzi Context-imizi çağırırıq
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Activity,
} from "lucide-react";

export default function OverviewPage() {
  const { financialData } = useFinancial();

  // 📊 Datanın emalı
  // Çat tamamlanıbsa real hesablanan datanı, yoxdursa standart dashboard dəyərlərini göstəririk
  const netWorth = financialData.isAnalyzed
    ? financialData.totalAssets - financialData.totalDebts
    : 2200; // default placeholder

  const totalAssets = financialData.isAnalyzed
    ? financialData.totalAssets
    : 2323;
  const totalDebts = financialData.isAnalyzed ? financialData.totalDebts : 123;
  const dti = financialData.isAnalyzed ? financialData.dtiRatio : 18; // default 18% DTI

  // Borc reytinqinə görə vizual rəng indikatoru
  const getDtiColor = (val) => {
    if (val <= 35)
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/10";
    if (val <= 45)
      return "text-orange-400 bg-orange-500/10 border-orange-500/10";
    return "text-red-400 bg-red-500/10 border-red-500/10";
  };

  return (
    <div className="page-transition space-y-8 pb-10">
      {/* 👑 Üst Başlıq və Status Paneli */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            Financial Overview
          </h1>
          <p className="text-sm text-gray-500">
            Real-time synchronization with AI Advisor data.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 px-4 py-2 rounded-full flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              financialData.isAnalyzed
                ? "bg-green-500 animate-pulse"
                : "bg-gray-600"
            }`}
          />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {financialData.isAnalyzed ? "AI Live Sync" : "Offline Sandbox"}
          </span>
        </div>
      </div>

      {/* 💳 BÖYÜK METRİKA KARTLARI (Skrinşot 4 Dizaynı) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: Net Worth */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[32px] p-8 space-y-6 shadow-2xl hover:border-white/10 transition-all group">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              Net Worth
            </span>
            <div className="p-2.5 bg-white/5 rounded-xl text-gray-400 group-hover:text-white transition-colors">
              <Wallet size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-medium tracking-tight text-white">
              {netWorth.toLocaleString()}{" "}
              {financialData.isAnalyzed ? "AZN" : "$"}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">
              Balans və aktivlərin cəmi
            </p>
          </div>
        </div>

        {/* CARD 2: Total Assets */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[32px] p-8 space-y-6 shadow-2xl hover:border-white/10 transition-all group">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              Total Assets
            </span>
            <div className="p-2.5 bg-emerald-500/5 rounded-xl text-emerald-400">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-medium tracking-tight text-emerald-400">
              {totalAssets.toLocaleString()}{" "}
              {financialData.isAnalyzed ? "AZN" : "$"}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">
              Aylıq gəlir əsaslı proqnozlaşdırılan aktiv
            </p>
          </div>
        </div>

        {/* CARD 3: Total Debts */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[32px] p-8 space-y-6 shadow-2xl hover:border-white/10 transition-all group">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              Total Debts
            </span>
            <div className="p-2.5 bg-red-500/5 rounded-xl text-red-400">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-medium tracking-tight text-red-400">
              {totalDebts.toLocaleString()}{" "}
              {financialData.isAnalyzed ? "AZN" : "$"}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">
              İllik ümumi rəsmi öhdəliklər
            </p>
          </div>
        </div>
      </div>

      {/* 📊 DETALLI DAXİLİ STRUKTUR & DTI DIAQRAMI PANELİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol Panel: DTI Progress Bar widget-i */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[40px] p-8 space-y-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Percent size={16} className="text-gray-400" />
              <h3 className="text-sm font-medium text-gray-300">
                Debt-to-Income (DTI) Limit
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getDtiColor(
                dti
              )}`}
            >
              {dti}% Ratio
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {/* Dinamik Dəyişən Progress Bar */}
            <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 rounded-full ${
                  dti > 45
                    ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                    : dti > 35
                    ? "bg-orange-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(dti, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 font-bold tracking-wide">
              <span>MIN RISK (0%)</span>
              <span>MAX LIMIT (45%)</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed pt-2 border-t border-white/5">
            {financialData.isAnalyzed
              ? `Aylıq ${financialData.monthlyIncome} AZN gəlirinizin ${
                  financialData.monthlyDebtPayments
                } AZN hissəsi birbaşa borclara gedir. AI tövsiyəsi: ${
                  dti > 45
                    ? "Təcili borcları restrukturizasiya edin."
                    : "Yeni kredit müraciətləri üçün tam uyğundur."
                }`
              : "Sistemə hələ real data daxil edilməyib. Intelligence bölməsində çatı tamamlayaraq bu paneli canlandıra bilərsiniz."}
          </p>
        </div>

        {/* Sağ Panel: Müştərinin Qısa Maliyyə Profili */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[40px] p-8 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-300">
              Profile Analytics
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 my-auto pt-2">
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] text-gray-500 block mb-1">
                AYLIQ GƏLİR
              </span>
              <span className="text-sm font-semibold text-white">
                {financialData.isAnalyzed
                  ? `${financialData.monthlyIncome.toLocaleString()} AZN`
                  : "N/A"}
              </span>
            </div>
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] text-gray-500 block mb-1">
                AYLIQ ÖHDƏLİK
              </span>
              <span className="text-sm font-semibold text-white">
                {financialData.isAnalyzed
                  ? `${financialData.monthlyDebtPayments.toLocaleString()} AZN`
                  : "N/A"}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 italic border-t border-white/5 pt-3">
            Son Sinxronizasiya:{" "}
            {financialData.isAnalyzed ? "Bayaq" : "Məlumat yoxdur"}
          </div>
        </div>
      </div>
    </div>
  );
}

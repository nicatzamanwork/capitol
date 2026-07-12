import React from "react";
import ChatInterface from "./ChatInterface"; // fayl yolunu özünə görə yoxla
import { Simulator } from "./features/Intelligence/Simulator"; // fayl yolunu özünə görə yoxla

export default function IntelligencePage() {
  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-8">
      {/* Səhifə Başlığı */}
      <div className="px-1">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#666] font-bold mb-1">
          Intelligence
        </h2>
        <h1 className="text-2xl md:text-3xl font-medium tracking-tighter">
          AI Financial Advisor
        </h1>
      </div>

      {/* 📦 ƏSAS LAYOUT DƏYİŞİKLİYİ: Mobildə alt-alta (flex-col), Böyük ekranda 12-lik Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
        {/* Çat İnterfeysi: Mobildə tam en, Webdə 7 sütun */}
        <div className="w-full lg:col-span-7">
          <ChatInterface />
        </div>

        {/* Strategiya Aləti / Simulator: Mobildə tam en, Webdə 5 sütun */}
        <div className="w-full lg:col-span-5 sticky top-24">
          {/* Başlıq hissəsi skrinşotdakı kimi minimalist olsun */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-[#444] font-bold block mb-2">
                Simulator Tool
              </span>
              <p className="text-[11px] text-[#666] leading-relaxed">
                Aylıq borc ödənişlərini simulyasiya edərək qənaət olunan faiz və
                zamanı hesablayın.
              </p>
            </div>

            {/* Simulator komponentinin özü */}
            <Simulator />

            {/* Skrinşotdakı Apply Strategy Düyməsi */}
            <button className="w-full bg-white text-black py-3.5 rounded-xl text-[11px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-all">
              Apply Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

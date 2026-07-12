import React, { useState } from "react";

export default function SimulatorTool() {
  const [allocation, setAllocation] = useState(2500);

  return (
    <div className="page-transition bg-card border border-white/5 rounded-2xl p-8">
      <div className="flex justify-between items-center mb-10 text-[#666]">
        <h3 className="text-[10px] uppercase tracking-widest font-bold">
          Simulator Tool
        </h3>
        <span className="text-[9px] border border-white/10 px-2 py-0.5 rounded italic">
          Dynamic Mode
        </span>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] uppercase text-[#444] font-bold">
              Monthly Allocation
            </span>
            <span className="text-2xl font-mono tracking-tighter">
              ${allocation.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="10000"
            step="100"
            value={allocation}
            onChange={(e) => setAllocation(parseInt(e.target.value))}
            className="w-full h-[1px] bg-white/10 appearance-none cursor-pointer accent-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <p className="text-[9px] uppercase text-[#444] mb-1 font-bold tracking-widest">
              Interest Saved
            </p>
            <p className="text-lg font-mono">
              ${(allocation * 0.15).toFixed(0)}
            </p>
          </div>
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <p className="text-[9px] uppercase text-[#444] mb-1 font-bold tracking-widest">
              Time Reduction
            </p>
            <p className="text-lg font-mono">
              -{Math.floor(allocation / 500)} Mo
            </p>
          </div>
        </div>

        <button className="w-full bg-white text-black text-[10px] font-bold py-4 rounded-xl uppercase tracking-[0.2em] hover:bg-gray-200 transition-all">
          Apply Strategy
        </button>
      </div>
    </div>
  );
}

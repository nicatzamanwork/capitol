// features/Intelligence/Simulator.jsx
import React from "react";
import * as Slider from "@radix-ui/react-slider";

// Stat komponentini faylın yuxarısında və ya aşağısında yarat:
const Stat = ({ label, value, color = "text-gray-400" }) => (
  <div>
    <p className="text-[10px] uppercase text-gray-500 mb-1">{label}</p>
    <p className={`text-xl font-mono ${color}`}>{value}</p>
  </div>
);

export const Simulator = () => {
  const [value, setValue] = React.useState([2500]);

  return (
    <div className="bg-[#111] p-6 rounded-xl border border-white/5">
      <div className="flex justify-between mb-6">
        <span className="text-[10px] uppercase text-gray-400">
          Monthly Debt Payment
        </span>
        <span className="text-xl font-mono">${value[0]}</span>
      </div>

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={value}
        onValueChange={setValue}
        max={5000}
        step={100}
      >
        <Slider.Track className="bg-white/10 relative grow rounded-full h-[2px]">
          <Slider.Range className="absolute bg-white rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-lg" />
      </Slider.Root>

      <div className="grid grid-cols-2 gap-4 mt-12">
        <Stat label="Interest Saved" value="$12,450" />
        <Stat label="Time Reduced" value="-18 Mo" color="text-white" />
      </div>
    </div>
  );
};

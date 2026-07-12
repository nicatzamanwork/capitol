export const GoalCard = ({ title, percentage, saved, goal }) => {
  return (
    <div className="bg-card border border-cardBorder p-8 rounded-2xl">
      <div className="flex justify-between items-start mb-10">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-mutedText">
          {title}
        </h3>
        <span className="text-mutedText cursor-pointer">•••</span>
      </div>

      <div className="mb-10">
        <span className="text-6xl font-extralight tracking-tighter">
          {percentage}
        </span>
        <span className="text-2xl text-mutedText ml-1">%</span>
      </div>

      {/* Custom Progress Bar */}
      <div className="relative w-full h-[1px] bg-white/10 mb-6">
        <div
          className="absolute top-0 left-0 h-full bg-white transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-mutedText">
        <span>Saved ${".2f"}</span>
        <span>Goal ${".2f"}</span>
      </div>
    </div>
  );
};

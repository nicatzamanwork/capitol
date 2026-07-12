export const VelocityAnalysis = () => {
  return (
    <div className="bg-card border border-cardBorder rounded-2xl p-10 flex items-center gap-12">
      {/* Sol tərəf: Dairəvi qrafik effekti */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-white/5 shadow-[0_0_40px_rgba(255,255,255,0.03)]" />
        <div className="text-center">
          <p className="text-2xl font-light">12%</p>
          <p className="text-[8px] uppercase tracking-widest text-mutedText">
            Projection
          </p>
        </div>
      </div>

      {/* Sağ tərəf: Mətnlər */}
      <div className="flex-1">
        <h4 className="text-lg font-medium mb-4">Savings Velocity Analysis</h4>
        <p className="text-mutedText text-sm max-w-2xl leading-relaxed">
          Your monthly savings average is{" "}
          <span className="text-white">$2,400.00</span>. At this current rate,
          your 'Emergency Fund' will be fully funded in{" "}
          <span className="text-white font-bold">2.4 months</span>, exceeding
          your initial target timeline by 15 days.
        </p>

        <div className="flex gap-8 mt-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-mutedText">
            <span className="w-4 h-[1px] bg-white/40" /> Optimized Path
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-mutedText">
            <span className="w-4 h-[1px] bg-white/40" /> Oct 2024 Target
          </div>
        </div>
      </div>
    </div>
  );
};

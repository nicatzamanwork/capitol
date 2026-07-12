const LandingPage = ({ onStart }) => (
  <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
    <div className="mb-12 flex flex-col items-center">
      <div className="w-4 h-4 flex items-center justify-center mb-4">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
      <h2 className="text-[10px] uppercase tracking-[0.5em] font-bold">
        CAPITAL
      </h2>
      <p className="text-[8px] uppercase tracking-[0.2em] text-gray-500 mt-1">
        Private Intelligence
      </p>
    </div>

    <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-8 max-w-4xl">
      Take control of your future
    </h1>

    <p className="text-gray-400 max-w-xl leading-relaxed mb-12 text-sm">
      Track your debts, manage your goals, and understand your financial
      situation simply and clearly. We help you see where you stand and what to
      do next.
    </p>

    <button
      onClick={onStart}
      className="bg-white text-black px-12 py-4 rounded-full text-sm font-bold hover:bg-gray-200 transition-all mb-12"
    >
      Log in
    </button>

    <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-gray-600">
      <span className="opacity-50">🔒</span> No bank connection required. Your
      data stays private.
    </div>
  </div>
);

export default LandingPage;

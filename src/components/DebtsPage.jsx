import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  X,
  Landmark,
  DollarSign,
  Percent,
  Calendar,
  Tag,
  Home,
  Car,
  GraduationCap,
  CreditCard,
} from "lucide-react";

export default function DebtsPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Backend-dən borcları yükləyirik
  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/debts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Backend-dən gələn "amount" sahəsini sənin UI-dakı "total" sahəsinə uyğunlaşdırırıq
        const formattedData = data.map((d) => ({
          ...d,
          id: d._id,
          title: d.name,
          total: d.amount, // Backend: amount -> UI: total
          remaining: d.remaining || d.amount, // Əgər remaining yoxdursa amount-u göstər
        }));
        setDebts(formattedData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Yeni borcu backend-ə göndəririk
  const handleAddDebt = async (data) => {
    try {
      const response = await fetch("http://localhost:5000/api/debts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: data.title,
          institution: data.institution,
          amount: parseFloat(data.totalAmount),
          remaining: parseFloat(data.remainingAmount),
          apr: parseFloat(data.interestRate),
          category: "Loan",
        }),
      });

      if (response.ok) {
        fetchDebts(); // Siyahını yeniləyirik
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Add debt error:", error);
    }
  };

  const totalBalance = useMemo(() => {
    return debts.reduce(
      (sum, debt) => sum + (parseFloat(debt.remaining) || 0),
      0
    );
  }, [debts]);

  const totalUtilization = useMemo(() => {
    const total = debts.reduce(
      (sum, debt) => sum + (parseFloat(debt.total) || 0),
      0
    );
    const remaining = debts.reduce(
      (sum, debt) => sum + (parseFloat(debt.remaining) || 0),
      0
    );
    if (total === 0) return 0;
    return ((1 - remaining / total) * 100).toFixed(1);
  }, [debts]);

  if (loading)
    return (
      <div className="p-10 text-white font-mono">
        Loading data from vault...
      </div>
    );

  return (
    <div className="page-transition space-y-10 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">
            Active Obligations
          </h1>
          <p className="text-sm text-gray-500">
            Total utilization is at{" "}
            <span className="text-white font-medium">{totalUtilization}%</span>{" "}
            across {debts.length} accounts.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-1">
            Total Balance
          </p>
          <p className="text-4xl font-light tracking-tighter text-white">
            $
            {totalBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debts.map((debt) => (
          <DebtCard key={debt.id} debt={debt} />
        ))}

        <div
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 group hover:border-white/10 hover:bg-white/[0.01] transition-all cursor-pointer min-h-[280px]"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-white/10 transition-all">
            <Plus size={24} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold group-hover:text-gray-400 transition-colors">
            Add New Obligation
          </p>
        </div>
      </div>

      <AddDebtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddDebt}
      />
    </div>
  );
}

// --- DebtCard (Dizayn eyni qalır) ---
function DebtCard({ debt }) {
  const progress = ((1 - debt.remaining / debt.total) * 100).toFixed(0);

  // İkonu kateqoriyaya görə seçə bilərsən və ya default saxlaya bilərsən
  const getIcon = () => {
    if (debt.title?.toLowerCase().includes("car")) return <Car size={18} />;
    if (debt.title?.toLowerCase().includes("home")) return <Home size={18} />;
    return <CreditCard size={18} />;
  };

  return (
    <div className="bg-[#0c0c0c] border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-all group">
      <div className="flex justify-between items-start mb-8">
        <div className="p-3 bg-white/5 rounded-2xl text-gray-400 group-hover:text-white transition-colors">
          {getIcon()}
        </div>
        <p className="text-[10px] font-mono text-gray-600 font-bold tracking-widest">
          {debt.apr}% APR
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-1">{debt.title}</h3>
        <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold">
          {debt.institution}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
            Principal Paid
          </p>
          <p className="text-xs font-medium text-white">{progress}%</p>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between pt-2">
          <div>
            <p className="text-[8px] uppercase text-gray-600 font-bold mb-1">
              Remaining
            </p>
            <p className="text-sm font-medium text-white">
              ${debt.remaining?.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[8px] uppercase text-gray-600 font-bold mb-1">
              Total
            </p>
            <p className="text-sm font-medium text-gray-400">
              ${debt.total?.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- AddDebtModal (Dizayn eyni qalır) ---
function AddDebtModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: "",
    institution: "",
    totalAmount: "",
    interestRate: "",
    term: "",
    remainingAmount: "",
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onAdd(formData);
    setFormData({
      title: "",
      institution: "",
      totalAmount: "",
      interestRate: "",
      term: "",
      remainingAmount: "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#050505] border border-white/10 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div>
            <h2 className="text-2xl font-medium text-white tracking-tight">
              New Obligation
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-2 font-bold">
              Register a new liability
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <ModalInput
              label="Purpose"
              icon={<Tag size={14} />}
              placeholder="Mortgage"
              value={formData.title}
              onChange={(v) => setFormData({ ...formData, title: v })}
            />
            <ModalInput
              label="Institution"
              icon={<Landmark size={14} />}
              placeholder="Bank Name"
              value={formData.institution}
              onChange={(v) => setFormData({ ...formData, institution: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <ModalInput
              label="Total Amount"
              icon={<DollarSign size={14} />}
              type="number"
              placeholder="0.00"
              value={formData.totalAmount}
              onChange={(v) => setFormData({ ...formData, totalAmount: v })}
            />
            <ModalInput
              label="APR %"
              icon={<Percent size={14} />}
              type="number"
              placeholder="4.5"
              value={formData.interestRate}
              onChange={(v) => setFormData({ ...formData, interestRate: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <ModalInput
              label="Remaining"
              icon={<DollarSign size={14} />}
              type="number"
              placeholder="0.00"
              value={formData.remainingAmount}
              onChange={(v) => setFormData({ ...formData, remainingAmount: v })}
            />
            <ModalInput
              label="Term (Months)"
              icon={<Calendar size={14} />}
              type="number"
              placeholder="360"
              value={formData.term}
              onChange={(v) => setFormData({ ...formData, term: v })}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-white text-black py-5 rounded-2xl text-xs font-bold uppercase tracking-[0.3em] hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
            Confirm & Add
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalInput({
  label,
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
}) {
  return (
    <div className="space-y-3">
      <label className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors">
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-gray-800"
        />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  Landmark,
  ArrowUpRight,
  Plus,
  X,
  ShieldCheck,
  Edit2,
  TrendingUp,
} from "lucide-react";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // 1. Backend-dən hesabları yükləyirik
  const fetchAccounts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/accounts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAccounts(data);
        if (data.length > 0 && !selectedAccountId)
          setSelectedAccountId(data[0]._id);
      }
    } catch (error) {
      console.error("Accounts fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 2. Yeni sadə hesab əlavə etmək
  const handleAddAccount = async (formData) => {
    try {
      const response = await fetch("http://localhost:5000/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          totalBalance: parseFloat(formData.balance), // Backend hələ totalBalance gözləyirsə bunu göndəririk
          principalPaid: parseFloat(formData.balance), // Sadə sistemdə Paid = Total
        }),
      });

      if (response.ok) {
        fetchAccounts();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Account add error:", error);
    }
  };

  // 3. Balansı Yeniləmək
  const handleUpdateBalance = async (newBalance) => {
    try {
      // Backend-dəki updateAccountBalance funksiyasına uyğun olaraq totalBalance-i yeniləyirik
      const response = await fetch(
        `http://localhost:5000/api/accounts/${selectedAccountId}/balance`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ principalPaid: newBalance }), // Backend bu sahəni update edir
        }
      );

      if (response.ok) {
        await fetchAccounts();
        setIsUpdateModalOpen(false);
      }
    } catch (error) {
      console.error("Update balance error:", error);
    }
  };

  const selectedAccount = useMemo(() => {
    return accounts.find((acc) => acc._id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  if (loading)
    return (
      <div className="p-10 text-white font-mono opacity-50 uppercase text-[10px] tracking-widest">
        Loading...
      </div>
    );

  return (
    <div className="page-transition h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">
              Net Capital
            </h2>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-white">
            Accounts
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
        >
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* SOL SÜTUN - Hesab Listi */}
        <div className="col-span-4 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {accounts.map((acc) => (
            <AccountListItem
              key={acc._id}
              title={acc.title}
              // Backend-də hansı sahə gəlirsə ona baxırıq
              balance={`$${(
                acc.totalBalance ||
                acc.balance ||
                0
              ).toLocaleString()}`}
              type={acc.type}
              isActive={selectedAccountId === acc._id}
              onClick={() => setSelectedAccountId(acc._id)}
              icon={
                acc.type === "Business" ? (
                  <Landmark size={16} />
                ) : (
                  <Wallet size={16} />
                )
              }
            />
          ))}
        </div>

        {/* SAĞ SÜTUN - Detallar */}
        <div className="col-span-8 bg-[#0c0c0c] border border-white/5 rounded-3xl overflow-hidden flex flex-col">
          {selectedAccount ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10 group-hover:border-emerald-500/50 transition-all">
                {selectedAccount.type === "Business" ? (
                  <Landmark size={32} className="text-gray-400" />
                ) : (
                  <Wallet size={32} className="text-gray-400" />
                )}
              </div>

              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-bold mb-2">
                {selectedAccount.type} Portfolio
              </p>
              <h2 className="text-2xl text-white font-medium mb-10 tracking-tight">
                {selectedAccount.title}
              </h2>

              <div
                className="group relative cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setIsUpdateModalOpen(true)}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">
                  <span className="text-[9px] bg-emerald-500 text-white px-3 py-1 rounded-full uppercase font-bold tracking-widest shadow-xl">
                    Update Balance
                  </span>
                </div>

                <p className="text-6xl font-light tracking-tighter text-white mb-2">
                  $
                  {(
                    selectedAccount.totalBalance ||
                    selectedAccount.balance ||
                    0
                  ).toLocaleString()}
                </p>

                <div className="flex items-center justify-center gap-2 text-emerald-500/60">
                  <TrendingUp size={14} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    Active Balance
                  </span>
                  <Edit2 size={12} className="ml-2" />
                </div>
              </div>

              <div className="mt-16 grid grid-cols-2 gap-20 border-t border-white/5 pt-16 w-full max-w-md">
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mb-2">
                    Status
                  </p>
                  <p className="text-xs text-emerald-500 uppercase font-bold tracking-widest">
                    Healthy
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mb-2">
                    Category
                  </p>
                  <p className="text-xs text-white uppercase font-bold tracking-widest">
                    {selectedAccount.type}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 uppercase tracking-widest text-[10px]">
              Select an account to view details
            </div>
          )}
        </div>
      </div>

      {/* MODALLAR */}
      <AddSimpleAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddAccount}
      />

      <UpdateBalanceModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdate={handleUpdateBalance}
        currentValue={selectedAccount?.totalBalance || 0}
      />
    </div>
  );
}

// --- Köşəkçi Komponentlər ---

function UpdateBalanceModal({ isOpen, onClose, onUpdate, currentValue }) {
  const [val, setVal] = useState(currentValue);
  useEffect(() => {
    setVal(currentValue);
  }, [currentValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#0c0c0c] border border-white/10 p-10 rounded-[40px] w-full max-w-sm shadow-2xl">
        <h3 className="text-white text-[11px] uppercase tracking-[0.3em] font-bold mb-8 text-center">
          Set New Balance
        </h3>
        <div className="relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-gray-600 font-mono">
            $
          </span>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-white text-center text-2xl font-mono focus:outline-none focus:border-emerald-500/50 transition-all"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            onClick={onClose}
            className="py-4 text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdate(parseFloat(val))}
            className="bg-white text-black py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSimpleAccountModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "Personal",
    balance: "",
  });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="bg-[#050505] border border-white/10 w-full max-w-md rounded-[40px] shadow-2xl p-10">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-medium text-white tracking-tight">
            New Account
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold ml-1">
              Account Title
            </label>
            <input
              type="text"
              placeholder="e.g. Savings Wallet"
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-white/20"
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold ml-1">
                Type
              </label>
              <select
                className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="Personal">Personal</option>
                <option value="Business">Business</option>
                <option value="Investment">Investment</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold ml-1">
                Initial Balance
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none"
                onChange={(e) =>
                  setFormData({ ...formData, balance: e.target.value })
                }
              />
            </div>
          </div>

          <button
            onClick={() => onAdd(formData)}
            className="w-full bg-white text-black py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-white transition-all mt-4"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

const AccountListItem = ({ title, balance, type, isActive, onClick, icon }) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
      isActive
        ? "bg-white/[0.03] border-white/20 shadow-2xl"
        : "bg-transparent border-white/5 hover:border-white/10"
    }`}
  >
    <div className="flex justify-between items-start mb-4">
      <div
        className={`p-3 rounded-xl transition-colors ${
          isActive ? "bg-white text-black" : "bg-white/5 text-gray-500"
        }`}
      >
        {icon}
      </div>
      <ArrowUpRight
        size={14}
        className={`transition-opacity ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
        }`}
      />
    </div>
    <p
      className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${
        isActive ? "text-gray-400" : "text-gray-600"
      }`}
    >
      {type}
    </p>
    <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
    <p className="text-xl font-mono tracking-tighter text-white/90">
      {balance}
    </p>
  </div>
);

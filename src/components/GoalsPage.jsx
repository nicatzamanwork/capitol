import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  X,
  Target,
  PiggyBank,
  Briefcase,
  Plane,
  Monitor,
  MoreHorizontal,
  Calendar,
} from "lucide-react";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Backend-dən məqsədləri çəkmək
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/goals", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setGoals(data);
      }
    } catch (error) {
      console.error("Məqsədlər yüklənərkən xəta:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Yeni məqsəd əlavə etmək (POST)
  const handleAddGoal = async (formData) => {
    try {
      const response = await fetch("http://localhost:5000/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: formData.title,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.savedAmount),
          deadline: formData.deadline,
          category: "Savings", // Default olaraq
        }),
      });

      if (response.ok) {
        fetchGoals(); // Siyahını yenilə
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Məqsəd əlavə edilərkən xəta:", error);
    }
  };

  // 3. Cəmi yığılan məbləğin hesablanması
  const totalSaved = useMemo(() => {
    return goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
  }, [goals]);

  if (loading)
    return (
      <div className="p-10 text-white font-light">Məqsədlər yüklənir...</div>
    );

  return (
    <div className="page-transition space-y-10 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">
            Your Goals
          </h1>
          <p className="text-sm text-gray-500">
            You've saved a total of{" "}
            <span className="text-white font-medium">
              ${totalSaved.toLocaleString()}
            </span>{" "}
            across {goals.length} active goals.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-1">
            Overall Progress
          </p>
          <p className="text-4xl font-light tracking-tighter text-white">
            {goals.length > 0 ? "Active" : "None"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <GoalCard key={goal._id} goal={goal} />
        ))}

        <div
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 group hover:border-white/10 hover:bg-white/[0.01] transition-all cursor-pointer min-h-[280px]"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-white/10 transition-all">
            <Plus size={24} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold group-hover:text-gray-400 transition-colors">
            Add New Goal
          </p>
        </div>
      </div>

      <AddGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddGoal}
      />
    </div>
  );
}

// --- Goal Card Komponenti ---
function GoalCard({ goal }) {
  const percentage = Math.min(
    Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100),
    100
  );

  return (
    <div className="bg-[#0c0c0c] border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">
            {goal.title}
          </p>
          <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-medium">
            <Calendar size={10} className="text-gray-700" />
            {goal.deadline
              ? new Date(goal.deadline).toLocaleDateString()
              : "No Deadline"}
          </div>
        </div>
        <button className="text-gray-700 hover:text-white transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="mb-10">
        <h2 className="text-7xl font-light tracking-tighter text-white relative inline-block">
          {percentage}
          <span className="text-2xl font-normal text-gray-600 ml-1">%</span>
        </h2>
      </div>

      <div className="space-y-4">
        <div className="h-[1px] w-full bg-white/10">
          <div
            className="h-full bg-white transition-all duration-1000"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
          <span className="text-gray-600">
            Saved ${(goal.currentAmount || 0).toLocaleString()}
          </span>
          <span className="text-gray-600">
            Goal ${(goal.targetAmount || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Add Goal Modal Komponenti ---
function AddGoalModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    savedAmount: "",
    deadline: "",
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onAdd(formData);
    setFormData({ title: "", targetAmount: "", savedAmount: "", deadline: "" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="bg-[#050505] border border-white/10 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-medium text-white tracking-tight">
              New Goal
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-2 font-bold">
              Define your next milestone
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-10 space-y-6">
          <GoalInput
            label="Goal Name"
            placeholder="e.g. Dream House"
            value={formData.title}
            onChange={(v) => setFormData({ ...formData, title: v })}
          />
          <div className="grid grid-cols-2 gap-6">
            <GoalInput
              label="Target Amount"
              type="number"
              placeholder="25000"
              value={formData.targetAmount}
              onChange={(v) => setFormData({ ...formData, targetAmount: v })}
            />
            <GoalInput
              label="Currently Saved"
              type="number"
              placeholder="5000"
              value={formData.savedAmount}
              onChange={(v) => setFormData({ ...formData, savedAmount: v })}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold ml-1">
              Target Deadline
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600"
                size={14}
              />
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all [color-scheme:dark]"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-white text-black py-5 rounded-2xl text-xs font-bold uppercase tracking-[0.3em] hover:bg-gray-200 transition-all active:scale-[0.98] mt-4"
          >
            Create Goal
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalInput({ label, placeholder, type = "text", value, onChange }) {
  return (
    <div className="space-y-3">
      <label className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold ml-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-gray-800"
      />
    </div>
  );
}

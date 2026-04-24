import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import PlanForm from "../components/PlanForm";
import PlanResult from "../components/PlanResult";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [currentInput, setCurrentInput] = useState<any>(null);
  const [view, setView] = useState<"form" | "result" | "history">("form");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/plans/");
      setSavedPlans(res.data.data);
    } catch {
      /* handle silently */
    }
  };

  const handleGenerate = async (formData: any) => {
    setLoading(true);
    try {
      const res = await api.post("/plans/generate", formData);
      setCurrentPlan(res.data.data);
      setCurrentInput(formData);
      setView("result");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPlan || !currentInput) return;
    try {
      const title = `${currentInput.target_role} in ${currentInput.destination} — ${new Date().toLocaleDateString()}`;
      await api.post("/plans/save", {
        title,
        profile: currentInput,
        plan: currentPlan.plan,
      });
      alert("Plan saved!");
      fetchPlans();
    } catch {
      alert("Failed to save plan");
    }
  };

  const handleLoadPlan = async (id: string) => {
    try {
      const res = await api.get(`/plans/${id}`);
      setCurrentPlan({ dataFound: true, result: res.data.data.plan });
      setCurrentInput(res.data.data.profile);
      setView("result");
    } catch {
      alert("Failed to load plan");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold m-0">Career Relocation Planner</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">Hello, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 text-gray-800 hover:bg-gray-100 rounded cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 mb-6">
        {(["form", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-5 py-2 rounded-md font-medium transition-colors ${
              view === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab === "form" ? "New Plan" : `Saved Plans (${savedPlans.length})`}
          </button>
        ))}
        {view === "result" && (
          <button
            className="px-5 py-2 rounded-md font-medium bg-green-600 text-white"
            disabled
          >
            Current Result
          </button>
        )}
      </div>

      {/* Views */}
      {view === "form" && (
        <PlanForm onSubmit={handleGenerate} loading={loading} />
      )}
      {view === "result" && currentPlan && (
        <PlanResult
          plan={currentPlan}
          onSave={handleSave}
          onBack={() => setView("form")}
        />
      )}
      {view === "history" && (
        <div className="space-y-3">
          {savedPlans.length === 0 && (
            <p className="text-gray-600">No saved plans yet.</p>
          )}
          {savedPlans.map((plan: any) => (
            <div
              key={plan._id}
              className="p-4 border border-gray-200 rounded-lg flex justify-between items-center hover:shadow-md transition-shadow"
            >
              <div>
                <strong className="block text-gray-900">{plan.title}</strong>
                <div className="text-sm text-gray-600 mt-1">
                  {plan["input.destination"]} · {plan["input.target_role"]} ·{" "}
                  {plan["result.feasibility_label"]}
                </div>
              </div>
              <button
                onClick={() => handleLoadPlan(plan._id)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer font-medium"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

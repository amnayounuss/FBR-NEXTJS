"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface BusinessData {
  business_name: string;
  ntn: string;
  address: string;
  contact_email: string;
  contact_mobile: string;
  fbr_sandbox_api_url: string;
  fbr_sandbox_bearer_token: string;
  fbr_prod_api_url: string;
  fbr_prod_bearer_token: string;
}

export default function FBRSetup() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BusinessData>({
    business_name: "", ntn: "", address: "",
    contact_email: "", contact_mobile: "", 
    fbr_sandbox_api_url: "", fbr_sandbox_bearer_token: "",
    fbr_prod_api_url: "", fbr_prod_bearer_token: ""
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (res.ok) {
          setFormData(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch { 
      toast.error("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-4">FBR Configuration Setup</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sandbox Card */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-blue-700 flex items-center gap-2">
              <span>🧪</span> Sandbox Environment
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-900">Sandbox API URL</label>
                <input type="text" className="mt-1 block w-full p-2 border border-blue-300 rounded text-black"
                  value={formData.fbr_sandbox_api_url} onChange={(e) => setFormData({...formData, fbr_sandbox_api_url: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900">Sandbox Bearer Token</label>
                <input type="password" size={1} className="mt-1 block w-full p-2 border border-blue-300 rounded text-black"
                  value={formData.fbr_sandbox_bearer_token} onChange={(e) => setFormData({...formData, fbr_sandbox_bearer_token: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Production Card */}
          <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-green-700 flex items-center gap-2">
              <span>🚀</span> Production Environment
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-900">Production API URL</label>
                <input type="text" className="mt-1 block w-full p-2 border border-green-300 rounded text-black"
                  value={formData.fbr_prod_api_url} onChange={(e) => setFormData({...formData, fbr_prod_api_url: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-900">Production Bearer Token</label>
                <input type="password" size={1} className="mt-1 block w-full p-2 border border-green-300 rounded text-black"
                  value={formData.fbr_prod_bearer_token} onChange={(e) => setFormData({...formData, fbr_prod_bearer_token: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
          {loading ? "Saving Settings..." : "Save All Configurations"}
        </button>
      </form>
    </div>
  );
}
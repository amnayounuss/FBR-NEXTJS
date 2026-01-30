"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface BusinessData {
  business_name: string;
  ntn: string;
  province: string;
  address: string;
  contact_email: string;
  contact_mobile: string;
  fbr_sandbox_api_url: string;
  fbr_sandbox_bearer_token: string;
}

export default function FBRSetup() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BusinessData>({
    business_name: "",
    ntn: "",
    province: "",
    address: "",
    contact_email: "",
    contact_mobile: "",
    fbr_sandbox_api_url: "",
    fbr_sandbox_bearer_token: "",
  });

  // Database se existing settings fetch karne ke liye
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          // Null values ko empty string mein convert karna zaroori hai
          setFormData({
            business_name: data.business_name || "",
            ntn: data.ntn || "",
            province: data.province || "",
            address: data.address || "",
            contact_email: data.contact_email || "",
            contact_mobile: data.contact_mobile || "",
            fbr_sandbox_api_url: data.fbr_sandbox_api_url || "",
            fbr_sandbox_bearer_token: data.fbr_sandbox_bearer_token || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
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

      if (res.ok) {
        toast.success("Settings updated successfully!");
      } else {
        toast.error("Failed to update settings.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        FBR & Business Configuration
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
              value={formData.business_name || ""}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
          </div>

          {/* NTN */}
          <div>
            <label className="block text-sm font-medium text-gray-700">NTN</label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
              value={formData.ntn || ""}
              onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input
              type="email"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
              value={formData.contact_email || ""}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
              value={formData.contact_mobile || ""}
              onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Address</label>
          <textarea
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
            rows={3}
            value={formData.address || ""}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <h2 className="text-lg font-semibold mt-6 text-blue-600 border-b pb-1">
          FBR Sandbox Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sandbox API URL</label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
              value={formData.fbr_sandbox_api_url || ""}
              onChange={(e) => setFormData({ ...formData, fbr_sandbox_api_url: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sandbox Bearer Token</label>
            <input
              type="password"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-black"
              value={formData.fbr_sandbox_bearer_token || ""}
              onChange={(e) => setFormData({ ...formData, fbr_sandbox_bearer_token: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
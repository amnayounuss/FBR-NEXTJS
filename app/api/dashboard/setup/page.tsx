"use client";
import { useState, useEffect } from 'react';

export default function FBRSetup() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    fbr_sandbox_api_url: '',
    fbr_sandbox_bearer_token: '',
    fbr_prod_api_url: '',
    fbr_prod_bearer_token: ''
  });

  useEffect(() => {
    // Fetch existing settings on load
    const fetchSettings = async () => {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const res = await fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setConfig(data);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(config)
    });

    if (res.ok) alert("Settings updated successfully!");
    else alert("Failed to update settings.");
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">FBR API Configuration</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-orange-600">Sandbox (Testing)</h2>
          <input 
            type="text" placeholder="Sandbox API URL" 
            className="w-full p-2 border rounded" value={config.fbr_sandbox_api_url}
            onChange={(e) => setConfig({...config, fbr_sandbox_api_url: e.target.value})}
          />
          <textarea 
            placeholder="Sandbox Bearer Token" 
            className="w-full p-2 border rounded h-24" value={config.fbr_sandbox_bearer_token}
            onChange={(e) => setConfig({...config, fbr_sandbox_bearer_token: e.target.value})}
          />
        </div>
        
        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-lg font-semibold text-green-600">Production (Live)</h2>
          <input 
            type="text" placeholder="Production API URL" 
            className="w-full p-2 border rounded" value={config.fbr_prod_api_url}
            onChange={(e) => setConfig({...config, fbr_prod_api_url: e.target.value})}
          />
          <textarea 
            placeholder="Production Bearer Token" 
            className="w-full p-2 border rounded h-24" value={config.fbr_prod_bearer_token}
            onChange={(e) => setConfig({...config, fbr_prod_bearer_token: e.target.value})}
          />
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
        >
          {loading ? "Saving..." : "Save Configuration"}
        </button>
      </form>
    </div>
  );
}
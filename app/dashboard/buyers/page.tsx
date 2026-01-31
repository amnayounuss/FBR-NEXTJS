"use client";

import { useEffect, useState, useCallback } from 'react';

// 1. TypeScript Interface Define Karein (any se bachne ke liye)
interface Buyer {
  id: number;
  buyer_name: string;
  ntn_cnic: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_address?: string;
}

export default function BuyersPage() {
  // any[] ki jagah Buyer[] use karein
  const [buyers, setBuyers] = useState<Buyer[]>([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    buyer_name: '', ntn_cnic: '', email: '', address: '', phone: ''
  });

  // 2. fetchBuyers ko useCallback mein rakhein taake useEffect warning na de
  const fetchBuyers = useCallback(async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const res = await fetch('/api/buyers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      setBuyers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch buyers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // fetchBuyers ab dependency array mein safely dala ja sakta hai
  useEffect(() => { 
    fetchBuyers(); 
  }, [fetchBuyers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    const res = await fetch('/api/buyers', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert("Buyer Added!");
      setShowModal(false);
      // Form reset karein
      setFormData({ buyer_name: '', ntn_cnic: '', email: '', address: '', phone: '' });
      fetchBuyers();
    } else {
      alert("Error adding buyer");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Buyer Management</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          + Add New Buyer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">NTN / CNIC</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {buyers.map((buyer) => (
              <tr key={buyer.id} className="hover:bg-gray-50 text-sm">
                <td className="px-6 py-4 font-medium">{buyer.buyer_name}</td>
                <td className="px-6 py-4">{buyer.ntn_cnic}</td>
                <td className="px-6 py-4">{buyer.buyer_phone || '-'}</td>
                <td className="px-6 py-4">{buyer.buyer_address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-10 text-center text-gray-500">Loading buyers...</p>}
        {!loading && buyers.length === 0 && <p className="p-10 text-center text-gray-500">No buyers found.</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center text-black justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Buyer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Buyer Name" required className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" onChange={(e) => setFormData({...formData, buyer_name: e.target.value})} />
              <input type="text" placeholder="NTN or CNIC" required className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" onChange={(e) => setFormData({...formData, ntn_cnic: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input type="text" placeholder="Phone" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              <textarea placeholder="Full Address" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" onChange={(e) => setFormData({...formData, address: e.target.value})} />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition">Save Buyer</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface InvoiceItem {
  hs_code: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function CreateInvoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { hs_code: '', description: '', quantity: 1, unit_price: 0 }
  ]);
  const [formData, setFormData] = useState({
    buyer_id: '',
    internal_invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0]
  });

  const addItem = () => {
    setItems([...items, { hs_code: '', description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, items })
      });

      const result = await response.json();

      if (response.ok) {
        alert("Invoice Draft Saved Successfully!");
        router.push('/dashboard/invoices');
      } else {
        alert(result.error || "Failed to save invoice");
      }
    } catch (error) {
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Create New Invoice</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice #</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full p-2 border rounded-md"
              onChange={(e) => setFormData({...formData, internal_invoice_number: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input 
              type="date" 
              value={formData.invoice_date}
              className="mt-1 block w-full p-2 border rounded-md"
              onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Buyer ID</label>
            <input 
              type="number" 
              required
              className="mt-1 block w-full p-2 border rounded-md"
              onChange={(e) => setFormData({...formData, buyer_id: e.target.value})}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Items</h2>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 items-end bg-gray-50 p-3 rounded-lg">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500">Description</label>
                <input 
                  type="text" placeholder="Product Name" 
                  value={item.description}
                  className="w-full p-2 border rounded"
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">HS Code</label>
                <input 
                  type="text" placeholder="8 digits" 
                  value={item.hs_code}
                  className="w-full p-2 border rounded"
                  onChange={(e) => updateItem(index, 'hs_code', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Qty</label>
                <input 
                  type="number" 
                  value={item.quantity}
                  className="w-full p-2 border rounded"
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                />
              </div>
              <div>
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="text-red-500 text-sm font-bold pb-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button 
            type="button" 
            onClick={addItem}
            className="text-indigo-600 font-semibold text-sm hover:underline"
          >
            + Add Another Item
          </button>
        </div>

        <div className="flex justify-end gap-4 border-t pt-6">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
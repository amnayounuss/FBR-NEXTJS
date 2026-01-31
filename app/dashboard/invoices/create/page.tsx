"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface Buyer {
  id: number;
  name: string;
  ntn: string;
  address: string;
}

interface Item {
  name: string;
  qty: number;
  price: number;
  tax_rate: number;
}

export default function CreateInvoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState("");
  const [showAddBuyer, setShowAddBuyer] = useState(false);
  
  // New Buyer Form State
  const [newBuyer, setNewBuyer] = useState({ name: "", ntn: "", address: "" });

  // Invoice Items State
  const [items, setItems] = useState<Item[]>([{ name: "", qty: 1, price: 0, tax_rate: 18 }]);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const res = await fetch("/api/buyers");
      const data = await res.json();
      // Error fix: Ensure data is always an array
      if (Array.isArray(data)) {
        setBuyers(data);
      } else {
        setBuyers([]);
      }
    } catch (err) {
      console.error("Failed to load buyers", err);
      setBuyers([]);
    }
  };

  const handleAddBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuyer.name || !newBuyer.ntn || !newBuyer.address) {
      return toast.error("Please fill all buyer fields");
    }
    
    try {
      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBuyer),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Buyer added successfully");
        await fetchBuyers();
        setSelectedBuyer(result.id.toString());
        setShowAddBuyer(false);
        setNewBuyer({ name: "", ntn: "", address: "" });
      } else {
        toast.error(result.error || "Failed to add buyer");
      }
    } catch (err) {
      console.error("Add buyer error", err);
      toast.error("Network error while adding buyer");
    }
  };

  const addItem = () => setItems([...items, { name: "", qty: 1, price: 0, tax_rate: 18 }]);
  
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as Item;
    setItems(newItems);
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const calculateTax = () => items.reduce((acc, item) => acc + (item.qty * item.price * (item.tax_rate / 100)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyer) return toast.error("Please select a buyer");
    
    setLoading(true);
    const subtotal = calculateSubtotal();
    const tax = calculateTax();

    try {
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: selectedBuyer,
          items,
          total_amount: subtotal + tax,
          tax_amount: tax,
        }),
      });

      if (res.ok) {
        toast.success("Invoice Created Successfully!");
        router.push("/dashboard/invoices");
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to save invoice");
      }
    } catch (err) {
      console.error("Submit error", err);
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Create New Invoice</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 text-black">
        
        {/* Buyer Selection Section */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Buyer / Customer Details</h2>
            <button 
              type="button" 
              onClick={() => setShowAddBuyer(!showAddBuyer)}
              className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md border border-indigo-200 hover:bg-indigo-100"
            >
              {showAddBuyer ? "Cancel" : "+ Add New Buyer"}
            </button>
          </div>

          {!showAddBuyer ? (
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-600 mb-1">Select Existing Buyer</label>
              <select 
                className="w-full p-2 border rounded-lg text-black bg-white focus:ring-2 focus:ring-indigo-500"
                value={selectedBuyer}
                onChange={(e) => setSelectedBuyer(e.target.value)}
                required={!showAddBuyer}
              >
                <option value="">-- Choose Buyer --</option>
                {Array.isArray(buyers) && buyers.map((buyer) => (
                  <option key={buyer.id} value={buyer.id}>{buyer.name} ({buyer.ntn})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4 bg-white p-4 rounded-lg border border-indigo-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="Buyer Name" 
                  className="p-2 border rounded text-black w-full"
                  value={newBuyer.name} onChange={(e) => setNewBuyer({...newBuyer, name: e.target.value})}
                />
                <input 
                  type="text" placeholder="Buyer NTN" 
                  className="p-2 border rounded text-black w-full"
                  value={newBuyer.ntn} onChange={(e) => setNewBuyer({...newBuyer, ntn: e.target.value})}
                />
              </div>
              <textarea 
                placeholder="Buyer Address" 
                className="p-2 border rounded text-black w-full h-20"
                value={newBuyer.address} onChange={(e) => setNewBuyer({...newBuyer, address: e.target.value})}
              />
              <button 
                type="button" onClick={handleAddBuyer}
                className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
              >
                Save & Select
              </button>
            </div>
          )}
        </div>

        {/* Items Table Section */}
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-800 text-white text-sm">
              <tr>
                <th className="p-4 border-b">Item Description</th>
                <th className="p-4 border-b w-24">Qty</th>
                <th className="p-4 border-b w-32">Unit Price</th>
                <th className="p-4 border-b w-24">Tax %</th>
                <th className="p-4 border-b w-32">Total</th>
                <th className="p-4 border-b w-16"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 text-black">
                  <td className="p-3">
                    <input type="text" placeholder="Product name" className="w-full p-2 border rounded" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} required />
                  </td>
                  <td className="p-3">
                    <input type="number" className="w-full p-2 border rounded" value={item.qty} onChange={(e) => updateItem(index, 'qty', Number(e.target.value))} required />
                  </td>
                  <td className="p-3">
                    <input type="number" className="w-full p-2 border rounded" value={item.price} onChange={(e) => updateItem(index, 'price', Number(e.target.value))} required />
                  </td>
                  <td className="p-3">
                    <input type="number" className="w-full p-2 border rounded" value={item.tax_rate} onChange={(e) => updateItem(index, 'tax_rate', Number(e.target.value))} />
                  </td>
                  <td className="p-3 font-semibold">
                    {(item.qty * item.price).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 border-t text-black">
            <button type="button" onClick={addItem} className="text-indigo-600 font-bold hover:underline">+ Add Row</button>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col items-end space-y-4">
          <div className="w-72 bg-gray-50 p-4 rounded-xl border space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-bold">Rs. {calculateSubtotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sales Tax:</span>
              <span className="font-bold">Rs. {calculateTax().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl border-t pt-2 text-indigo-700">
              <span>Grand Total:</span>
              <span className="font-bold">Rs. {(calculateSubtotal() + calculateTax()).toLocaleString()}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-72 bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:bg-gray-400 shadow-lg"
          >
            {loading ? "Saving Invoice..." : "Save Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
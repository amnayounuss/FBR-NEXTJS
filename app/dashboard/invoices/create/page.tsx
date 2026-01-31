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
  hsCode: string;
  prodCode: string;
  name: string;
  qty: number;
  price: number;
  uoM: string;
  tax_rate: number;
  discount: number;
  furtherTax: number;
  extraTax: number;
}

export default function CreateInvoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceType, setInvoiceType] = useState("2"); 
  const [saleType, setSaleType] = useState("T1000017");

  const [showAddBuyer, setShowAddBuyer] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ name: "", ntn: "", address: "" });

  const [items, setItems] = useState<Item[]>([
    { hsCode: "0000.0000", prodCode: "", name: "", qty: 1, price: 0, uoM: "U1000069", tax_rate: 18, discount: 0, furtherTax: 0, extraTax: 0 }
  ]);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const res = await fetch("/api/buyers");
      const data = await res.json();
      if (Array.isArray(data)) setBuyers(data);
    } catch (err) {
      console.error("Failed to load buyers", err);
    }
  };

  // Naya buyer save karne ka logic
  const handleAddBuyer = async () => {
    if (!newBuyer.name || !newBuyer.ntn || !newBuyer.address) {
      return toast.error("Please fill all buyer fields");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBuyer),
      });
      if (res.ok) {
        toast.success("Buyer added successfully");
        await fetchBuyers(); // List refresh
        setShowAddBuyer(false); // Form close
        setNewBuyer({ name: "", ntn: "", address: "" }); // Reset form
      } else {
        toast.error("Failed to add buyer");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as Item;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { hsCode: "0000.0000", prodCode: "", name: "", qty: 1, price: 0, uoM: "U1000069", tax_rate: 18, discount: 0, furtherTax: 0, extraTax: 0 }]);
  
  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const calculateTax = () => items.reduce((acc, item) => acc + (item.qty * item.price * (item.tax_rate / 100)), 0);

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    if (!selectedBuyerId) return toast.error("Please select a buyer");
    setLoading(true);

    const buyer = buyers.find(b => b.id.toString() === selectedBuyerId);

    const fbrPayload = {
      invoiceType: invoiceType === "2" ? "Sale Invoice" : "Purchase Invoice",
      invoiceDate,
      invoiceRefNo: invoiceNumber,
      buyerNTNCNIC: buyer?.ntn,
      buyerBusinessName: buyer?.name,
      buyerAddress: buyer?.address,
      status: isDraft ? "Draft" : "Submitted",
      items: items.map(item => ({
        ...item,
        rate: `${item.tax_rate}%`,
        totalValues: item.qty * item.price,
        salesTaxApplicable: (item.qty * item.price) * (item.tax_rate / 100),
        saleType: saleType
      }))
    };

    try {
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fbrPayload),
      });

      if (res.ok) {
        toast.success(isDraft ? "Draft Saved!" : "Invoice Submitted to FBR!");
        router.push("/dashboard/invoices");
      } else {
        toast.error("Failed to save invoice");
      }
    } catch (err) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Invoice</h1>
          <p className="text-gray-500 mt-1 text-sm">Fill in the details to generate a new FBR compliant invoice.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
          <span className="text-indigo-700 font-semibold">{invoiceNumber}</span>
        </div>
      </div>
      
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-10 text-black">
        
        {/* Invoice Info Section */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Invoice Meta Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Date</label>
              <input type="date" className="w-full p-3 border rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Type</label>
              <select className="w-full p-3 border rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
                <option value="2">Sale Invoice</option>
                <option value="1">Purchase Invoice</option>
              </select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sale Type</label>
              <select className="w-full p-3 border rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none" value={saleType} onChange={(e) => setSaleType(e.target.value)}>
                <option value="T1000017">Goods at Standard Rate (default)</option>
                <option value="T1000018">Services</option>
                <option value="T1000085">Petroleum Products</option>
              </select>
            </div>
          </div>
        </section>

        {/* Buyer Selection */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              Customer Details
            </h2>
            <button type="button" onClick={() => setShowAddBuyer(!showAddBuyer)} className="text-sm text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
              {showAddBuyer ? "← Back to List" : "+ New Customer"}
            </button>
          </div>

          {!showAddBuyer ? (
            <select className="w-full p-3 border rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all" value={selectedBuyerId} onChange={(e) => setSelectedBuyerId(e.target.value)} required>
              <option value="">-- Choose Existing Buyer --</option>
              {Array.isArray(buyers) && buyers.map(b => <option key={b.id} value={b.id}>{b.name} ({b.ntn})</option>)}
            </select>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Full Name" className="p-3 border rounded-xl text-black w-full outline-none focus:ring-4 focus:ring-indigo-100" value={newBuyer.name} onChange={(e) => setNewBuyer({...newBuyer, name: e.target.value})} />
                <input type="text" placeholder="NTN / CNIC" className="p-3 border rounded-xl text-black w-full outline-none focus:ring-4 focus:ring-indigo-100" value={newBuyer.ntn} onChange={(e) => setNewBuyer({...newBuyer, ntn: e.target.value})} />
              </div>
              <textarea placeholder="Complete Business Address" className="p-3 border rounded-xl text-black w-full h-24 outline-none focus:ring-4 focus:ring-indigo-100" value={newBuyer.address} onChange={(e) => setNewBuyer({...newBuyer, address: e.target.value})} />
              <div className="flex justify-end">
                <button type="button" onClick={handleAddBuyer} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition shadow-lg">
                   Save Buyer
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Line Items Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            <h2 className="text-lg font-bold text-gray-800">Line Items</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {items.map((item, index) => (
              <div key={index} className="relative bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-300">
                <button type="button" onClick={() => removeItem(index)} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-all z-10">✕</button>

                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saved Item</label>
                    <select className="w-full border rounded-lg p-2 text-sm outline-none bg-gray-50 focus:border-indigo-500">
                      <option value="">-- Select --</option>
                    </select>
                  </div>
                  <div className="w-[120px] space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HS Code</label>
                    <input className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={item.hsCode} onChange={(e) => updateItem(index, 'hsCode', e.target.value)} />
                  </div>
                  <div className="w-[120px] space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prod Code</label>
                    <input className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={item.prodCode} onChange={(e) => updateItem(index, 'prodCode', e.target.value)} />
                  </div>
                  <div className="flex-1 min-w-[250px] space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                    <input className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} required />
                  </div>
                  <div className="w-[80px] space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.qty} onChange={(e) => updateItem(index, 'qty', Number(e.target.value))} />
                  </div>
                  <div className="w-[100px] space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={item.price} onChange={(e) => updateItem(index, 'price', Number(e.target.value))} />
                  </div>
                  <div className="w-[120px] space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">UOM</label>
                    <select className="w-full border rounded-lg p-2 text-sm outline-none bg-white focus:border-indigo-500" value={item.uoM} onChange={(e) => updateItem(index, 'uoM', e.target.value)}>
                      <option value="U1000069">Pieces</option>
                      <option value="U1000013">KG</option>
                      <option value="U1000003">MT</option>
                      <option value="U1000009">Liters</option>
                    </select>
                  </div>
                  <div className="w-[80px] space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tax %</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.tax_rate} onChange={(e) => updateItem(index, 'tax_rate', Number(e.target.value))} />
                  </div>
                  <div className="w-[80px] space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Disc</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.discount} onChange={(e) => updateItem(index, 'discount', Number(e.target.value))} />
                  </div>
                  <div className="w-[80px] space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Further</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.furtherTax} onChange={(e) => updateItem(index, 'furtherTax', Number(e.target.value))} />
                  </div>
                  <div className="w-[80px] space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Extra</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.extraTax} onChange={(e) => updateItem(index, 'extraTax', Number(e.target.value))} />
                  </div>
                  <div className="flex-grow flex flex-col justify-end items-end min-w-[120px]">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1">Row Total</label>
                    <div className="text-lg font-bold text-gray-900">Rs. {(item.qty * item.price).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
              <span className="text-xl">+</span> Add New Row
            </button>
          </div>
        </section>

        {/* Final Submission Section */}
        <div className="flex flex-col md:flex-row items-end md:items-start justify-end gap-6 pb-20">
          <div className="w-full md:w-96 bg-gray-900 text-white p-8 rounded-3xl shadow-2xl space-y-4">
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Subtotal Amount</span>
              <span className="font-mono">Rs. {calculateSubtotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Sales Tax Total</span>
              <span className="font-mono">Rs. {calculateTax().toLocaleString()}</span>
            </div>
            <div className="h-px bg-white/10 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Payable</span>
              <span className="text-2xl font-black text-indigo-400 font-mono">Rs. {(calculateSubtotal() + calculateTax()).toLocaleString()}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading} 
                className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:bg-gray-800"
              >
                SAVE DRAFT
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:bg-gray-700"
              >
                SUBMIT TO FBR
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
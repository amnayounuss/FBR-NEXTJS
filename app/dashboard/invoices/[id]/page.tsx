"use client";

import { useState, useEffect, use } from "react";
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

interface DbInvoiceItem {
  hs_code: string;
  product_code: string;
  description: string;
  quantity: string | number;
  price: string | number;
  uom: string;
  tax_rate: string | number;
  discount?: string | number;
  further_tax?: string | number;
  extra_tax?: string | number;
}

export default function UpdateInvoice({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");

  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceType, setInvoiceType] = useState("2");
  const [saleType, setSaleType] = useState("T1000017");
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const buyerRes = await fetch("/api/buyers");
        const buyerData = await buyerRes.json();
        if (Array.isArray(buyerData)) setBuyers(buyerData);

        const res = await fetch(`/api/invoices/${resolvedParams.id}`);
        const data = await res.json();

        if (res.ok) {
          setInvoiceDate(data.invoice_date.split('T')[0]);
          setInvoiceNumber(data.invoice_ref_no);
          setStatus(data.status);
          setInvoiceType(data.invoice_type === "Sale Invoice" ? "2" : "1");
          
          // Fixed: Explicit type mapping instead of 'any'
          setItems(data.items.map((it: DbInvoiceItem) => ({
            hsCode: it.hs_code || "0000.0000",
            prodCode: it.product_code || "",
            name: it.description || "",
            qty: Number(it.quantity) || 0,
            price: Number(it.price) || 0,
            uoM: it.uom || "U1000069",
            tax_rate: Number(it.tax_rate) || 18,
            discount: Number(it.discount) || 0,
            furtherTax: Number(it.further_tax) || 0,
            extraTax: Number(it.extra_tax) || 0
          })));
          
          const matchedBuyer = buyerData.find((b: Buyer) => b.ntn === data.buyer_ntn);
          if (matchedBuyer) setSelectedBuyerId(matchedBuyer.id.toString());
        }
      } catch (err) {
        console.error("Load Error:", err); 
        toast.error("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [resolvedParams.id]);

  const isEditable = status === "Draft";

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as Item;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { hsCode: "0000.0000", prodCode: "", name: "", qty: 1, price: 0, uoM: "U1000069", tax_rate: 18, discount: 0, furtherTax: 0, extraTax: 0 }]);
  const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const calculateTax = () => items.reduce((acc, item) => acc + (item.qty * item.price * (item.tax_rate / 100)), 0);

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    if (!selectedBuyerId) return toast.error("Please select a buyer");
    setSubmitting(true);

    const buyer = buyers.find(b => b.id.toString() === selectedBuyerId);
    const payload = {
      invoiceType: invoiceType === "2" ? "Sale Invoice" : "Purchase Invoice",
      invoiceDate,
      invoiceRefNo: invoiceNumber,
      buyerNTNCNIC: buyer?.ntn,
      buyerBusinessName: buyer?.name,
      buyerAddress: buyer?.address,
      status: isDraft ? "Draft" : "Submitted",
      totalAmount: calculateSubtotal() + calculateTax(),
      taxAmount: calculateTax(),
      items: items.map(item => ({
        ...item,
        totalValues: item.qty * item.price,
        salesTaxApplicable: (item.qty * item.price) * (item.tax_rate / 100),
        saleType: saleType
      }))
    };

    try {
      const res = await fetch(`/api/invoices/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isDraft ? "Draft Updated!" : "Invoice Submitted to FBR!");
        router.push("/dashboard/invoices");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-indigo-600">Loading Invoice...</div>;

  return (
    <div className="max-w-400 mx-auto p-4 md:p-8 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6 text-black">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{isEditable ? "Update Draft Invoice" : "View Invoice"}</h1>
          <p className="text-gray-500 mt-1 text-sm">Modify draft or view details of this FBR compliant invoice.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
          <span className="text-indigo-700 font-semibold">{invoiceNumber}</span>
        </div>
      </div>
      
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-10 text-black">
        {/* Meta Section */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> Invoice Meta Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Date</label>
              <input type="date" className="w-full p-3 border rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} disabled={!isEditable} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Type</label>
              <select className="w-full p-3 border rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)} disabled={!isEditable}>
                <option value="2">Sale Invoice</option>
                <option value="1">Purchase Invoice</option>
              </select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sale Type</label>
              <select className="w-full p-3 border rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none" value={saleType} onChange={(e) => setSaleType(e.target.value)} disabled={!isEditable}>
                <option value="T1000017">Goods at Standard Rate (default)</option>
                <option value="T1000018">Services</option>
                <option value="T1000085">Petroleum Products</option>
              </select>
            </div>
          </div>
        </section>

        {/* Customer Section */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span> Customer Details
          </h2>
          <select className="w-full p-3 border rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all" value={selectedBuyerId} onChange={(e) => setSelectedBuyerId(e.target.value)} disabled={!isEditable} required>
            <option value="">-- Choose Existing Buyer --</option>
            {buyers.map(b => <option key={b.id} value={b.id}>{b.name} ({b.ntn})</option>)}
          </select>
        </section>

        {/* Line Items Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            <h2 className="text-lg font-bold text-gray-800">Line Items</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {items.map((item, index) => (
              <div key={index} className="relative bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                {isEditable && <button type="button" onClick={() => removeItem(index)} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-all z-10">✕</button>}

                <div className="flex flex-wrap gap-4">
                  <div className="w-30 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HS Code</label>
                    <input className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={item.hsCode} onChange={(e) => updateItem(index, 'hsCode', e.target.value)} disabled={!isEditable} />
                  </div>
                  <div className="w-30 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prod Code</label>
                    <input className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={item.prodCode} onChange={(e) => updateItem(index, 'prodCode', e.target.value)} disabled={!isEditable} />
                  </div>
                  <div className="flex-1 min-w-62.5 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                    <input className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} disabled={!isEditable} required />
                  </div>
                  <div className="w-20 space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.qty} onChange={(e) => updateItem(index, 'qty', Number(e.target.value))} disabled={!isEditable} />
                  </div>
                  <div className="w-25 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={item.price} onChange={(e) => updateItem(index, 'price', Number(e.target.value))} disabled={!isEditable} />
                  </div>
                  <div className="w-30 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">UOM</label>
                    <select className="w-full border rounded-lg p-2 text-sm outline-none bg-white focus:border-indigo-500" value={item.uoM} onChange={(e) => updateItem(index, 'uoM', e.target.value)} disabled={!isEditable}>
                      <option value="U1000069">Pieces</option>
                      <option value="U1000013">KG</option>
                      <option value="U1000003">MT</option>
                      <option value="U1000009">Liters</option>
                    </select>
                  </div>
                  <div className="w-20 space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tax %</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.tax_rate} onChange={(e) => updateItem(index, 'tax_rate', Number(e.target.value))} disabled={!isEditable} />
                  </div>
                  <div className="w-20 space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Disc</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.discount} onChange={(e) => updateItem(index, 'discount', Number(e.target.value))} disabled={!isEditable} />
                  </div>
                  <div className="w-20 space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Further</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.furtherTax} onChange={(e) => updateItem(index, 'furtherTax', Number(e.target.value))} disabled={!isEditable} />
                  </div>
                  <div className="w-20 space-y-1 text-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Extra</label>
                    <input type="number" className="w-full border rounded-lg p-2 text-sm text-center outline-none focus:border-indigo-500" value={item.extraTax} onChange={(e) => updateItem(index, 'extraTax', Number(e.target.value))} disabled={!isEditable} />
                  </div>
                  <div className="grow flex flex-col justify-end items-end min-w-30">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1">Row Total</label>
                    <div className="text-lg font-bold text-gray-900 font-mono">Rs. {(item.qty * item.price).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
            {isEditable && (
              <button type="button" onClick={addItem} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold hover:border-indigo-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-2">
                + Add New Row
              </button>
            )}
          </div>
        </section>

        <div className="flex flex-col md:flex-row items-end md:items-start justify-end gap-6 pb-20">
          <div className="w-full md:w-96 bg-gray-900 text-white p-8 rounded-3xl shadow-2xl space-y-4">
            <div className="flex justify-between text-gray-400 text-sm"><span>Total Excl. Tax</span><span className="font-mono">Rs. {calculateSubtotal().toLocaleString()}</span></div>
            <div className="flex justify-between text-gray-400 text-sm"><span>Sales Tax Total</span><span className="font-mono">Rs. {calculateTax().toLocaleString()}</span></div>
            <div className="h-px bg-white/10 my-2"></div>
            <div className="flex justify-between items-center"><span className="text-lg font-bold">Total Payable</span><span className="text-2xl font-black text-indigo-400 font-mono">Rs. {(calculateSubtotal() + calculateTax()).toLocaleString()}</span></div>
            
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, true)}
                disabled={submitting || !isEditable} 
                className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold text-sm active:scale-95 disabled:opacity-50"
              >
                {submitting ? "..." : "UPDATE DRAFT"}
              </button>
              <button 
                type="submit" 
                disabled={submitting || !isEditable} 
                className="bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 disabled:opacity-50"
              >
                {submitting ? "..." : "SUBMIT TO FBR"}
              </button>
            </div>
            <button 
              type="button"
              onClick={() => router.push("/dashboard/invoices")} 
              className="w-full text-center text-sm text-gray-500 hover:text-white pt-2 font-bold transition-all"
            >
              ← Back to Invoices
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
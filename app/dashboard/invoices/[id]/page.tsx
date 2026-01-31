"use client";

import { useState, useEffect, use } from "react";
import { toast } from "react-hot-toast";

interface InvoiceItem {
  id: number;
  hs_code: string;
  product_code: string;
  description: string;
  quantity: number;
  price: number;
  uom: string;
  tax_rate: number;
  sales_tax: number;
  total: number;
}

interface Invoice {
  id: number;
  invoice_ref_no: string;
  invoice_date: string;
  invoice_type: string;
  buyer_name: string;
  buyer_ntn: string;
  buyer_address: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  items: InvoiceItem[];
}

export default function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  // Params ko unwrap karna zaroori hai Next.js 15+ mein
  const resolvedParams = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const res = await fetch(`/api/invoices/${resolvedParams.id}`);
        const data = await res.json();
        
        if (res.ok) {
          setInvoice(data);
        } else {
          toast.error(data.error || "Failed to load invoice");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [resolvedParams.id]);

  if (loading) return <div className="p-10 text-center text-black">Loading Details...</div>;
  if (!invoice) return <div className="p-10 text-center text-red-500">Invoice not found.</div>;

  return (
    <div className="max-w-400 mx-auto p-4 md:p-8 bg-white min-h-screen text-black">
      <div className="flex justify-between items-center border-b pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">Invoice Details</h1>
          <p className="text-gray-500 mt-1">Reference: {invoice.invoice_ref_no}</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold text-sm uppercase ${
          invoice.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
        }`}>
          {invoice.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-gray-50 p-6 rounded-2xl border">
          <h2 className="font-bold text-gray-400 uppercase text-[10px] mb-4 tracking-widest">Buyer Information</h2>
          <p className="text-lg font-bold">{invoice.buyer_name}</p>
          <p className="text-sm text-gray-600">NTN: {invoice.buyer_ntn}</p>
          <p className="text-sm text-gray-600 mt-2">{invoice.buyer_address}</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl border">
          <h2 className="font-bold text-gray-400 uppercase text-[10px] mb-4 tracking-widest">Invoice Meta</h2>
          <p className="text-sm">Date: <b>{new Date(invoice.invoice_date).toLocaleDateString()}</b></p>
          <p className="text-sm mt-1">Type: <b>{invoice.invoice_type}</b></p>
        </div>
      </div>

      <div className="border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-white text-[10px] uppercase font-bold tracking-wider">
            <tr>
              <th className="p-4">HS/Prod Code</th>
              <th className="p-4">Description</th>
              <th className="p-4 text-center">Qty/UOM</th>
              <th className="p-4">Price</th>
              <th className="p-4 text-center">Tax %</th>
              <th className="p-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items?.map((item) => (
              <tr key={item.id} className="text-sm hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium">{item.hs_code}</div>
                  <div className="text-[10px] text-gray-400">{item.product_code}</div>
                </td>
                <td className="p-4 font-semibold">{item.description}</td>
                <td className="p-4 text-center">{item.quantity} {item.uom}</td>
                <td className="p-4 font-mono">Rs. {Number(item.price).toLocaleString()}</td>
                <td className="p-4 text-center">{item.tax_rate}%</td>
                <td className="p-4 text-right font-bold">Rs. {Number(item.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-10">
        <div className="w-full md:w-80 bg-gray-900 text-white p-6 rounded-3xl space-y-3 shadow-xl">
          <div className="flex justify-between text-gray-400 text-xs">
            <span>Tax Amount</span>
            <span>Rs. {Number(invoice.tax_amount).toLocaleString()}</span>
          </div>
          <div className="h-px bg-white/10"></div>
          <div className="flex justify-between items-center">
            <span className="font-bold">Total Amount</span>
            <span className="text-2xl font-black text-indigo-400">Rs. {Number(invoice.total_amount).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
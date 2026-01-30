"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// 1. Invoice Item ke liye interface
interface InvoiceItem {
  hs_code: string;
  product_description: string;
  quantity: number;
  rate: number;
}

// 2. Main Invoice data ke liye interface
interface InvoiceData {
  internal_invoice_number: string;
  status: string;
  seller_name: string;
  seller_ntn: string;
  buyer_name: string;
  ntn_cnic: string;
  fbr_invoice_number?: string;
  fbr_qr_payload?: string;
  items: InvoiceItem[];
}

export default function InvoiceDetail() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        const res = await fetch(`/api/invoices/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setInvoice(data);
      } catch (error) {
        // 'error' ko yahan use kiya taake warning khatam ho jaye
        console.error("Failed to fetch invoice:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoiceData();
  }, [id]);

  const handleFBRSubmit = async (env: 'sandbox' | 'production') => {
    setSubmitting(true);
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

    try {
      const res = await fetch(`/api/invoices/${id}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ environment: env })
      });

      const result = await res.json();
      if (res.ok) {
        alert("Success: Invoice Approved by FBR!");
        window.location.reload(); 
      } else {
        alert("FBR Error: " + (result.details || result.error));
      }
    } catch (error) {
      // Catch block mein bhi error use karna behtar hai
      console.error("Submission error:", error);
      alert("Submission failed. Check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-600">Loading Invoice Details...</div>;
  if (!invoice) return <div className="p-10 text-center text-red-500 font-bold">Invoice not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 text-gray-900">
      <div className="bg-white p-6 rounded-xl shadow-sm flex flex-wrap justify-between items-center border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoice #{invoice.internal_invoice_number}</h1>
          <p className="text-gray-500 mt-1">Status: 
            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${
              invoice.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {invoice.status}
            </span>
          </p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          {invoice.status === 'DRAFT' && (
            <>
              <button 
                onClick={() => handleFBRSubmit('sandbox')}
                disabled={submitting}
                className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium transition"
              >
                Test (Sandbox)
              </button>
              <button 
                onClick={() => handleFBRSubmit('production')}
                disabled={submitting}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
              >
                Go Live (Prod)
              </button>
            </>
          )}
          <button onClick={() => router.back()} className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50 transition text-gray-600">
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-700 border-b pb-3 mb-4 flex items-center gap-2">
            🏢 Seller Info
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600"><strong className="text-gray-800">Name:</strong> {invoice.seller_name}</p>
            <p className="text-gray-600"><strong className="text-gray-800">NTN:</strong> {invoice.seller_ntn}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-700 border-b pb-3 mb-4 flex items-center gap-2">
            👤 Buyer Info
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600"><strong className="text-gray-800">Name:</strong> {invoice.buyer_name}</p>
            <p className="text-gray-600"><strong className="text-gray-800">NTN/CNIC:</strong> {invoice.ntn_cnic}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm font-semibold">
              <tr>
                <th className="px-6 py-4">HS Code</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-mono">{item.hs_code}</td>
                  <td className="px-6 py-4 text-sm">{item.product_description}</td>
                  <td className="px-6 py-4 text-sm">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">{item.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {invoice.fbr_invoice_number && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm">
          <h2 className="text-green-800 font-bold mb-3 flex items-center gap-2">
            ✅ FBR Confirmation
          </h2>
          <p className="text-sm text-green-700">
            <strong className="text-green-900">FBR Number:</strong> {invoice.fbr_invoice_number}
          </p>
          {invoice.fbr_qr_payload && (
            <div className="mt-4 p-4 bg-white inline-block rounded-lg border border-green-100 shadow-sm">
              <p className="text-xs text-gray-400 mb-2 text-center">FBR QR Data Available</p>
              <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded text-gray-400 text-[10px] text-center p-2">
                QR Code Logic Goes Here
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
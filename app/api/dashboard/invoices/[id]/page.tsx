"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function InvoiceDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const res = await fetch(`/api/invoices/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setInvoice(data);
      setLoading(false);
    };
    fetchInvoiceData();
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
        window.location.reload(); // Data refresh karne ke liye
      } else {
        alert("FBR Error: " + (result.details || result.error));
      }
    } catch (error) {
      alert("Submission failed. Check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Invoice Details...</div>;
  if (!invoice) return <div className="p-10 text-center text-red-500">Invoice not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Invoice #{invoice.internal_invoice_number}</h1>
          <p className="text-gray-500">Status: 
            <span className={`ml-2 font-bold ${invoice.status === 'APPROVED' ? 'text-green-600' : 'text-orange-500'}`}>
              {invoice.status}
            </span>
          </p>
        </div>
        <div className="space-x-3">
          {invoice.status === 'DRAFT' && (
            <>
              <button 
                onClick={() => handleFBRSubmit('sandbox')}
                disabled={submitting}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                Test (Sandbox)
              </button>
              <button 
                onClick={() => handleFBRSubmit('production')}
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Go Live (Prod)
              </button>
            </>
          )}
          <button onClick={() => router.back()} className="border px-4 py-2 rounded-lg">Back</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="font-bold border-b pb-2 mb-4">Seller Info</h2>
          <p><strong>Name:</strong> {invoice.seller_name}</p>
          <p><strong>NTN:</strong> {invoice.seller_ntn}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="font-bold border-b pb-2 mb-4">Buyer Info</h2>
          <p><strong>Name:</strong> {invoice.buyer_name}</p>
          <p><strong>NTN/CNIC:</strong> {invoice.ntn_cnic}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3">HS Code</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Qty</th>
              <th className="px-6 py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoice.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="px-6 py-4">{item.hs_code}</td>
                <td className="px-6 py-4">{item.product_description}</td>
                <td className="px-6 py-4">{item.quantity}</td>
                <td className="px-6 py-4 text-right">{item.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoice.fbr_invoice_number && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
          <h2 className="text-green-800 font-bold mb-2">FBR Confirmation</h2>
          <p className="text-sm"><strong>FBR Number:</strong> {invoice.fbr_invoice_number}</p>
          {invoice.fbr_qr_payload && (
            <div className="mt-4 p-4 bg-white inline-block rounded border">
              <p className="text-xs text-gray-400 mb-2 text-center">FBR QR Data Available</p>
              {/* QR Code component can be added here */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
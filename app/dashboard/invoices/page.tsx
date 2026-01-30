"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const res = await fetch('/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchInvoices();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading invoices...</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">Recent Invoices</h1>
        <Link href="/dashboard/invoices/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
          + New Invoice
        </Link>
      </div>
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="px-6 py-4">Invoice #</th>
            <th className="px-6 py-4">Buyer</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invoices.map((inv: any) => (
            <tr key={inv.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{inv.internal_invoice_number}</td>
              <td className="px-6 py-4">{inv.buyer_name}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  inv.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {inv.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <Link href={`/dashboard/invoices/${inv.id}`} className="text-indigo-600 hover:underline mr-4">View</Link>
                {inv.status === 'DRAFT' && (
                  <button className="text-green-600 hover:underline">Submit to FBR</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
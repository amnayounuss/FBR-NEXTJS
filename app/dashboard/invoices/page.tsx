"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 1. Invoice ke liye interface define karein taake 'any' khatam ho jaye
interface Invoice {
  id: number;
  internal_invoice_number: string;
  buyer_name: string;
  status: string;
}

export default function InvoicesList() {
  // 2. State ko Invoice array type dein
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        const res = await fetch('/api/invoices', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        // Data check aur state update
        setInvoices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  if (loading) return <p className="text-center mt-10 text-gray-600">Loading invoices...</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="p-6 border-b flex justify-between items-center bg-white">
        <h1 className="text-xl font-bold text-gray-800">Recent Invoices</h1>
        <Link href="/dashboard/invoices/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
          + New Invoice
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Buyer</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No invoices found.</td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.internal_invoice_number}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.buyer_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      inv.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                      inv.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-4">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
                      View Details
                    </Link>
                    {inv.status === 'DRAFT' && (
                      <Link href={`/dashboard/invoices/${inv.id}`} className="text-green-600 hover:text-green-900 font-medium text-sm">
                        Submit
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
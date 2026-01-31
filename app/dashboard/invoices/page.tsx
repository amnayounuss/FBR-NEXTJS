"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Invoice {
  id: number;
  invoice_ref_no: string;
  buyer_name: string;
  invoice_date: string;
  total_amount: number;
  status: string;
}

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoices fetch karne ka function
  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast.error("Could not load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="p-6 max-w-400 mx-auto bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-sm text-gray-500">Manage your drafts and submitted invoices.</p>
        </div>
        <Link 
          href="/dashboard/invoices/create" 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md"
        >
          + Create New Invoice
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-black">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b">
            <tr>
              <th className="p-4">Ref No</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-400">Loading Invoices...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-400">No invoices found. Create your first one!</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-indigo-600">{inv.invoice_ref_no}</td>
                  <td className="p-4">{inv.buyer_name}</td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(inv.invoice_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-mono font-bold">
                    Rs. {Number(inv.total_amount).toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      inv.status === 'Draft' 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                      href={`/dashboard/invoices/${inv.id}`} 
                      className="text-indigo-600 hover:underline font-bold text-sm"
                    >
                      View Details
                    </Link>
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
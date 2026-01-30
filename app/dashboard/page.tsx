"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 1. User ke liye interface define karein
interface UserData {
  business_name: string;
  ntn: string;
  email: string;
}

export default function DashboardPage() {
  // 2. Lazy Initialization: useState ke andar hi function pass karein
  const [user, setUser] = useState<UserData | null>(() => {
    // Server-side rendering (SSR) check: Next.js mein pehle check karein ke window defined hai
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('user');
      if (data) {
        try {
          return JSON.parse(data);
        } catch (error) {
          console.error("Failed to parse user data:", error);
        }
      }
    }
    return null;
  });

  // 3. Optional: Agar aap chahte hain ke data synchronize rahe (Sync across tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const data = localStorage.getItem('user');
      if (data) setUser(JSON.parse(data));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const menuItems = [
    { title: "FBR Setup", desc: "Configure credentials", link: "/dashboard/setup", icon: "⚙️" },
    { title: "Create Invoice", desc: "New FBR submission", link: "/dashboard/invoices/create", icon: "📝" },
    { title: "Invoices", desc: "View all history", link: "/dashboard/invoices", icon: "📊" },
    { title: "Buyers", desc: "Manage customers", link: "/dashboard/buyers", icon: "👥" },
  ];

  return (
    <div>
      <div className="bg-white p-8 rounded-xl shadow-sm mb-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.business_name || "Guest"}! 👋
        </h2>
        <p className="text-gray-600 mt-2">Manage your FBR e-invoicing and business integrations.</p>
        <div className="mt-4 inline-block bg-indigo-50 px-4 py-2 rounded-lg">
          <span className="text-sm font-semibold text-indigo-700">
            NTN: {user?.ntn || "Not Provided"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.link}>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-transparent hover:border-indigo-300 h-full">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
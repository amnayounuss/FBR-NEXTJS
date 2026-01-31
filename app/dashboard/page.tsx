"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// User ke liye interface
interface UserData {
  business_name: string;
  ntn: string;
  email: string;
  logo?: string; 
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(() => {
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

  useEffect(() => {
    const handleStorageChange = () => {
      const data = localStorage.getItem('user');
      if (data) {
        try {
          setUser(JSON.parse(data));
        } catch (error) {
          console.error("Failed to parse data on change:", error);
        }
      }
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
      <div className="bg-white p-8 rounded-xl shadow-sm mb-8 border border-gray-100 flex items-center justify-between">
        <div>
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

        {/* Optimized Logo using next/image with shrink-0 */}
        {user?.logo && (
          <div className="shrink-0 ml-4 bg-gray-50 p-2 rounded-xl border border-gray-100 relative w-24 h-24">
            <Image 
              src={user.logo} 
              alt="Business Logo" 
              fill 
              className="object-contain rounded-lg p-1"
              priority 
              unoptimized 
            />
          </div>
        )}
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
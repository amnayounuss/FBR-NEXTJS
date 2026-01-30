"use client";
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    // Cookie aur localStorage clear karein
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">FBR E-Invoicing</h1>
          <button 
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
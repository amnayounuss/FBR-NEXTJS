"use client";
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Server-side logout call
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (res.ok) {
        // Local state clear karna
        localStorage.removeItem('user');
        
        // Redirect aur full page refresh taake middleware auth check kare
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Updated class: bg-linear-to-r */}
      <nav className="bg-linear-to-r from-indigo-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">FBR E-Invoicing</h1>
          <button 
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition font-medium"
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
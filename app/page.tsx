"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    business_name: '',
    ntn: '',
    province: '',
    address: '',
    contact_mobile: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    const token = document.cookie.includes('token=');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    const payload = isLogin 
      ? { email: formData.email, password: formData.password } 
      : { 
          business_name: formData.business_name,
          ntn: formData.ntn,
          province: formData.province,
          address: formData.address,
          contact_email: formData.email,
          contact_mobile: formData.contact_mobile,
          password: formData.password
        };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        if (isLogin) {
          document.cookie = `token=${result.token}; path=/; max-age=604800; SameSite=Strict`;
          localStorage.setItem('user', JSON.stringify(result.user));
          setAlert({ msg: 'Login successful! Redirecting...', type: 'success' });
          
          setTimeout(() => router.push('/dashboard'), 1000);
        } else {
          setAlert({ msg: 'Registration successful! Please login.', type: 'success' });
          setIsLogin(true);
        }
      } else {
        setAlert({ msg: result.error || 'Something went wrong', type: 'error' });
      }
    } catch (error) {
      // 'error' ko console mein use kiya taake 'defined but never used' error khatam ho jaye
      console.error("Auth error:", error);
      setAlert({ msg: 'Connection error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Updated class: bg-linear-to-br
    <div className="min-h-screen bg-linear-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Login to your FBR E-Invoicing account' : 'Register your business for FBR'}
          </p>
        </div>

        {alert && (
          <div className={`p-4 mb-6 rounded-lg text-sm ${alert.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {alert.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input id="business_name" type="text" placeholder="Business Name" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" onChange={handleInputChange} />
              <input id="ntn" type="text" placeholder="NTN (e.g. 1234567-8)" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" onChange={handleInputChange} />
              <select id="province" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" onChange={handleInputChange}>
                <option value="">Select Province</option>
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                <option value="KPK">KPK</option>
                <option value="Balochistan">Balochistan</option>
                <option value="ICT">Islamabad</option>
              </select>
            </>
          )}
          
          <input id="email" type="email" placeholder="Email Address" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" onChange={handleInputChange} />
          <input id="password" type="password" placeholder="Password" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" onChange={handleInputChange} />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
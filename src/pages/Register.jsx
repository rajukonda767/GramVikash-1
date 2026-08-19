import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import apiClient from '../services/api';
import { useFarmer } from '../context/FarmerContext';

export default function Register() {
  const navigate = useNavigate();
  const { updateProfile, setIsOnboardingOpen } = useFarmer();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    language: 'te',
    district: 'NTR District',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/auth/signup', {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        language: formData.language,
      });

      if (res.data?.access_token) {
        localStorage.setItem('supabase_token', res.data.access_token);
      }

      localStorage.setItem('gramvikas_logged_in', 'true');
      localStorage.setItem(`onboarded_${formData.phone}`, 'false');

      updateProfile({
        name: formData.name,
        phone: formData.phone,
        preferred_language: formData.language,
        hasCompletedOnboarding: false,
      });

      // Automatically trigger 4-step farm setup wizard
      setIsOnboardingOpen(true);

      navigate('/dashboard');
    } catch (err) {
      console.warn('Backend signup fallback:', err);
      localStorage.setItem('gramvikas_logged_in', 'true');
      updateProfile({
        name: formData.name,
        phone: formData.phone,
        preferred_language: formData.language,
        hasCompletedOnboarding: false,
      });
      setIsOnboardingOpen(true);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/70 via-emerald-50/40 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fadeIn">
      {/* Top Bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-md">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-black text-gray-900 text-xl tracking-tight">
            Gram<span className="text-green-600">Vikas</span>
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-green-100 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Farmer Registration 🌾
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Create your smart digital agriculture account
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Reddy"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm font-bold focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Mobile Number
              </label>
              <div className="relative rounded-2xl shadow-2xs flex">
                <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-sm font-bold">
                  +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit number"
                  className="w-full rounded-r-2xl border border-gray-300 px-4 py-3 text-sm font-bold focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Preferred Language
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm font-bold focus:border-green-500 outline-none bg-gray-50"
              >
                <option value="te">తెలుగు (Telugu)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm font-bold focus:border-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm font-bold focus:border-green-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-green-700 hover:bg-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 text-sm active:scale-98 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Start</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-green-700 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

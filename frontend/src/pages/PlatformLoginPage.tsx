import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../contexts/PlatformAuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ShieldAlert, ArrowRight, LockKeyhole } from 'lucide-react';

export const PlatformLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = usePlatformAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      addNotification('Access Granted: Welcome back, Super Owner', 'success');
      navigate('/platform');
    } catch (err: any) {
      addNotification(err.message || 'Access Denied', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Dark Animated Background Elements */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[100px] translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 mask-image-[radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-red-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="h-20 w-20 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl flex items-center justify-center shadow-2xl relative">
              <ShieldAlert className="h-10 w-10 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            </div>
          </div>
        </div>
        <h2 className="mt-2 text-center text-4xl font-black text-white tracking-tight">
          System Core
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-red-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <LockKeyhole className="w-4 h-4" /> Restricted Access
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[440px] relative z-10">
        <div className="bg-gray-900/60 backdrop-blur-xl py-10 px-6 sm:px-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] sm:rounded-3xl border border-gray-800 focus-within:border-gray-700 transition-colors duration-300">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Admin Designation (Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-800 rounded-xl shadow-inner bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:ring-0 focus:border-red-500/50 hover:border-gray-700 transition-colors sm:text-sm font-medium"
                placeholder="super@owner.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Security Clearance (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-800 rounded-xl shadow-inner bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:ring-0 focus:border-red-500/50 hover:border-gray-700 transition-colors sm:text-sm font-medium tracking-widest"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying Credentials...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10 tracking-wide">Initialize Login Sequence</span>
                    <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                {/* Button Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300" />
              </button>
            </div>
          </form>
        </div>
        
        <p className="mt-8 text-center text-xs font-medium text-gray-600 w-full max-w-xs mx-auto">
          Unauthorized access attempts to the platform core are monitored and strictly prohibited.
        </p>
      </div>
    </div>
  );
};

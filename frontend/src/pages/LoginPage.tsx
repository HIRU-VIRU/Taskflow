import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { LoginRequest } from '../types';
import { LogIn, ArrowRight, CheckCircle2, Building2, LayoutDashboard, Zap } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    tenantSlug: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      showSuccess('Logged in successfully! 🚀');
      navigate('/');
    } catch (error: any) {
      showError(error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-gray-900">
      {/* Left Panel - Branding & Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900 flex-col justify-between items-start p-16">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40 opacity-80" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 mix-blend-screen" />

        <div className="relative z-10 w-full mb-12">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">TaskFlow</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
            Manage teams,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">deliver faster.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-md font-medium leading-relaxed">
            The premium platform for multi-tenant project management, designed for modern enterprise workflows.
          </p>
        </div>

        <div className="relative z-10 space-y-6 w-full max-w-md">
          {[
            { icon: Building2, text: 'Isolated workspaces tailored for each tenant' },
            { icon: Zap, text: 'AI-powered insights and task summarization' },
            { icon: CheckCircle2, text: 'Granular permissions and role-based access' }
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl transition-all hover:bg-white/10">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 text-blue-400">
                <feature.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-300">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900">TaskFlow</span>
        </div>

        <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-700">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-6 lg:hidden shadow-sm border border-blue-100">
              <LogIn className="w-8 h-8" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-gray-500 font-medium">Log in to your workspace to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Workspace Slug</label>
              <input
                type="text"
                name="tenantSlug"
                value={formData.tenantSlug}
                onChange={handleChange}
                placeholder="your-company-slug"
                required
                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1 mb-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors">Forgot password?</a>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900 tracking-wider placeholder-gray-400 placeholder:tracking-normal"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 group relative flex items-center justify-center gap-2 bg-gray-900 text-white font-bold text-sm py-4 rounded-2xl hover:bg-black transition-all duration-200 hover:shadow-xl hover:shadow-gray-900/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  Sign in to Workspace
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm font-medium text-gray-500">
              Don't have a workspace?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-bold text-gray-900 hover:text-blue-600 underline decoration-gray-300 hover:decoration-blue-600 underline-offset-4 transition-all"
              >
                Create your company
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

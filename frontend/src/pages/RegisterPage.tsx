import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { RegisterRequest } from '../types';
import { UserPlus, ArrowRight, CheckCircle2, ShieldCheck, LayoutDashboard, Globe } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [formData, setFormData] = useState<RegisterRequest>({
    tenantName: '',
    tenantSlug: '',
    adminEmail: '',
    adminPassword: '',
    adminName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      showSuccess('Company created successfully! 🎉');
      navigate('/');
    } catch (error: any) {
      showError(error.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-gray-900">
      {/* Left Panel - Branding & Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900 flex-col justify-between items-start p-16">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-blue-900/40 opacity-80" />
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/3 mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/3 translate-x-1/4 mix-blend-screen" />

        <div className="relative z-10 w-full mb-12">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">TaskFlow</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
            Start building,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">scale infinitely.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-md font-medium leading-relaxed">
            Create your organization's workspace in seconds. Experience powerful multi-tenant architecture designed for growth.
          </p>
        </div>

        <div className="relative z-10 space-y-6 w-full max-w-md">
          {[
            { icon: Globe, text: 'Custom workspace URL for your organization' },
            { icon: ShieldCheck, text: 'Enterprise-grade security and data isolation' },
            { icon: CheckCircle2, text: 'Unlimited projects and tasks on premium plans' }
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl transition-all hover:bg-white/10">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 text-purple-400">
                <feature.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-300">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 relative overflow-y-auto max-h-screen">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900">TaskFlow</span>
        </div>

        <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-700 py-12">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 lg:hidden shadow-sm border border-indigo-100">
              <UserPlus className="w-8 h-8" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Create Workspace</h2>
            <p className="text-gray-500 font-medium">Set up your company's dedicated environment.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Organization Details Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2">Organization Details</h3>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Company Name</label>
                <input
                  type="text"
                  name="tenantName"
                  value={formData.tenantName}
                  onChange={handleChange}
                  placeholder="Acme Corporation"
                  required
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Workspace Slug</label>
                <input
                  type="text"
                  name="tenantSlug"
                  value={formData.tenantSlug}
                  onChange={handleChange}
                  placeholder="acme-corp"
                  pattern="[a-z0-9-]+"
                  required
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                />
                <p className="text-[11px] font-medium text-gray-400 ml-1 mt-1">Used for login. Lowercase, numbers, hyphens only.</p>
              </div>
            </div>

            {/* Admin Details Section */}
            <div className="space-y-5 pt-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2">Admin Profile</h3>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  required
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Admin Email</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="jane@acme.com"
                  required
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                <input
                  type="password"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900 tracking-wider placeholder-gray-400 placeholder:tracking-normal"
                />
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mt-6">
              <p className="text-sm text-indigo-800 font-medium">
                <span className="mr-2">💡</span>
                <strong>Joining a team?</strong> Ask your admin for an email invitation instead of creating a new workspace.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 group relative flex items-center justify-center gap-2 bg-gray-900 text-white font-bold text-sm py-4 rounded-2xl hover:bg-black transition-all duration-200 hover:shadow-xl hover:shadow-gray-900/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Workspace...
                </span>
              ) : (
                <>
                  Create Organization
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm font-medium text-gray-500">
              Already have a workspace?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-bold text-gray-900 hover:text-indigo-600 underline decoration-gray-300 hover:decoration-indigo-600 underline-offset-4 transition-all"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { RegisterRequest } from '../types';
import { UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [registrationType, setRegistrationType] = useState<'create' | 'join'>('create');
  const [formData, setFormData] = useState<RegisterRequest>({
    tenantName: '',
    tenantSlug: '',
    adminEmail: '',
    adminPassword: '',
    adminName: '',
  });
  const [joinData, setJoinData] = useState({
    companySlug: '',
    email: '',
    password: '',
    name: '',
    joinCode: '', // Optional: for invite codes
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJoinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJoinData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (registrationType === 'create') {
        await register(formData);
        showSuccess('Company created successfully!');
      } else {
        // Handle join company logic
        showError('Join company feature coming soon! For now, ask your admin to invite you.');
        return;
      }
      navigate('/');
    } catch (error: any) {
      showError(error.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-white">
            <div className="flex items-center justify-center mb-4">
              <UserPlus className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-center">TaskFlow</h1>
            <p className="text-blue-100 text-center mt-2">
              {registrationType === 'create' ? 'Create Your Company' : 'Join Your Team'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {/* Registration Type Toggle */}
            <div className="mb-6">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setRegistrationType('create')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                    registrationType === 'create'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  Create New Company
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationType('join')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                    registrationType === 'join'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  Join Existing Company
                </button>
              </div>
            </div>

            {registrationType === 'create' ? (
              // Create Company Form
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="tenantName"
                    value={formData.tenantName}
                    onChange={handleChange}
                    placeholder="Your Company"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Slug
                  </label>
                  <input
                    type="text"
                    name="tenantSlug"
                    value={formData.tenantSlug}
                    onChange={handleChange}
                    placeholder="your-company"
                    pattern="[a-z0-9-]+"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Name
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    placeholder="Your Full Name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
                </div>
              </>
            ) : (
              // Join Company Form
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Joining an existing company?</strong> Ask your admin to invite you via email,
                    or contact them for your company's join information.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Slug
                  </label>
                  <input
                    type="text"
                    name="companySlug"
                    value={joinData.companySlug}
                    onChange={handleJoinChange}
                    placeholder="company-name"
                    pattern="[a-z0-9-]+"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ask your admin for the company slug</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Join Code (Optional)
                  </label>
                  <input
                    type="text"
                    name="joinCode"
                    value={joinData.joinCode}
                    onChange={handleJoinChange}
                    placeholder="ABC123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter join code if provided by admin</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={joinData.name}
                    onChange={handleJoinChange}
                    placeholder="Your Full Name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={joinData.email}
                    onChange={handleJoinChange}
                    placeholder="you@yourcompany.com"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={joinData.password}
                    onChange={handleJoinChange}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? (registrationType === 'create' ? 'Creating Company...' : 'Joining Company...')
                : (registrationType === 'create' ? 'Create Company' : 'Join Company')
              }
            </button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

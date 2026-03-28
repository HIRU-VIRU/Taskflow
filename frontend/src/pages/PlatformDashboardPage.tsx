import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../contexts/PlatformAuthContext';
import { platformApi } from '../api/platform';
import { PlatformStats, TenantSummary, RevenueDataPoint } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, LogOut, DollarSign, Target, Loader2, Search, ArrowUp, ArrowDown, ShieldCheck } from 'lucide-react';

export const PlatformDashboardPage: React.FC = () => {
  const { platformAdmin, logout } = usePlatformAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [revenueHistory, setRevenueHistory] = useState<RevenueDataPoint[]>([]);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  
  // Pagination/Filter State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTenants, setTotalTenants] = useState(0);
  const [sortBy, setSortBy] = useState<'created_at' | 'user_count' | 'name' | 'project_count'>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [page, limit, sortBy, order, search, planFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, revenueData, tenantsData] = await Promise.all([
        platformApi.getStats(),
        platformApi.getRevenueHistory(12),
        platformApi.getTenants({ page, limit, sortBy, order, search, plan: planFilter })
      ]);
      setStats(statsData);
      setRevenueHistory(revenueData);
      setTenants(tenantsData.items || (tenantsData as any).tenants);
      const pagination = tenantsData.pagination || (tenantsData as any).pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages);
        setTotalTenants(pagination.total);
      }
    } catch (err) {
      console.error('Failed to load platform data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/platform/login');
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  if (!stats) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-red-600" /></div>;

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const pieData = Object.entries(stats.subscriptionBreakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Platform Topbar */}
      <nav className="bg-[#0A0A0A] border-b border-gray-900 text-white relative overflow-hidden">
        {/* Topbar background flare */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-full bg-red-600/10 blur-[100px] opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 shadow-lg shadow-red-500/20 flex items-center justify-center border border-white/10">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight leading-none block">System Core</span>
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-widest block mt-0.5">Platform Operations</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Active clearance</p>
                <p className="text-sm font-medium text-white">{platformAdmin?.name}</p>
              </div>
              <div className="h-8 w-px bg-gray-800" />
              <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 bg-gray-900 border border-gray-800 hover:border-red-500/50 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl transition-all duration-300">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-start relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 text-emerald-600"><DollarSign className="w-24 h-24 -mt-8 -mr-8" /></div>
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-sm"><DollarSign className="w-6 h-6" /></div>
             <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Estimated MRR</p>
             <h3 className="text-3xl font-black text-gray-900 mt-1 tracking-tight">${stats.estimatedMRR.toLocaleString()}</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-start relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 text-blue-600"><Building2 className="w-24 h-24 -mt-8 -mr-8" /></div>
             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-sm"><Building2 className="w-6 h-6" /></div>
             <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Tenants</p>
             <div className="flex items-end gap-3 mt-1">
               <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stats.totalTenants.toLocaleString()}</h3>
               <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 mb-1">+{stats.newTenantsThisMonth} new</span>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-start relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 text-purple-600"><Users className="w-24 h-24 -mt-8 -mr-8" /></div>
             <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-sm"><Users className="w-6 h-6" /></div>
             <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Platform Users</p>
             <h3 className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{stats.totalUsers.toLocaleString()}</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-start relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 text-orange-600"><Target className="w-24 h-24 -mt-8 -mr-8" /></div>
             <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-sm"><Target className="w-6 h-6" /></div>
             <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Global Assets</p>
             <h3 className="text-3xl font-black text-gray-900 mt-1 tracking-tight">
                {stats.totalProjects.toLocaleString()}<span className="text-lg text-gray-300 font-medium mx-1">/</span>{stats.totalTasks.toLocaleString()}
             </h3>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Projects / Tasks</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-lg font-black text-gray-900">Revenue Trajectory</h2>
              <p className="text-sm font-medium text-gray-500">Trailing 12 months performance</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueHistory}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-10} tickFormatter={(val) => `$${val}`}/>
                  <Tooltip 
                    contentStyle={{borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', fontWeight: 'bold'}} 
                    cursor={{stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4'}} 
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6, strokeWidth: 0, fill: '#10b981'}} fill="url(#colorRevenue)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-lg font-black text-gray-900">Plan Distribution</h2>
              <p className="text-sm font-medium text-gray-500">Active tenant mix by tier</p>
            </div>
            <div className="h-64 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-6">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                    <span className="text-xs font-bold text-gray-700">{entry.name}</span>
                    <span className="text-xs font-medium text-gray-400">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h2 className="text-lg font-black text-gray-900">Tenant Directory</h2>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by name or slug..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:font-normal"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="relative">
                <select 
                  className="appearance-none py-2 pl-4 pr-10 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                  value={planFilter}
                  onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All Plans</option>
                  <option value="Free">Free</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto relative">
            {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div></div>}
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100 group transition-colors" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-2">Tenant Profile {sortBy === 'name' ? (order === 'asc' ? <ArrowUp className="w-3 text-gray-600" /> : <ArrowDown className="w-3 text-gray-600" />) : <ArrowDown className="w-3 opacity-0 group-hover:opacity-30" />}</div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Plan</th>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100 group transition-colors" onClick={() => toggleSort('user_count')}>
                    <div className="flex items-center gap-2">Users {sortBy === 'user_count' ? (order === 'asc' ? <ArrowUp className="w-3 text-gray-600" /> : <ArrowDown className="w-3 text-gray-600" />) : <ArrowDown className="w-3 opacity-0 group-hover:opacity-30" />}</div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100 group transition-colors" onClick={() => toggleSort('project_count')}>
                    <div className="flex items-center gap-2">Projects {sortBy === 'project_count' ? (order === 'asc' ? <ArrowUp className="w-3 text-gray-600" /> : <ArrowDown className="w-3 text-gray-600" />) : <ArrowDown className="w-3 opacity-0 group-hover:opacity-30" />}</div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100 group transition-colors" onClick={() => toggleSort('created_at')}>
                    <div className="flex items-center gap-2">Date Joined {sortBy === 'created_at' ? (order === 'asc' ? <ArrowUp className="w-3 text-gray-600" /> : <ArrowDown className="w-3 text-gray-600" />) : <ArrowDown className="w-3 opacity-0 group-hover:opacity-30" />}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-black text-gray-500 shadow-sm">
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{tenant.name}</div>
                          <div className="text-xs font-medium text-gray-500 mt-0.5">{tenant.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                        tenant.plan === 'Enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                        tenant.plan === 'Pro' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{tenant.userCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{tenant.projectCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex justify-center mb-4"><Search className="w-12 h-12 text-gray-200" /></div>
                      <p className="text-gray-500 font-bold text-lg">No tenants found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total directory: {totalTenants} items</span>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-gray-700 transition-all bg-white" 
                disabled={page <= 1} onClick={() => setPage(page - 1)}
              >
                Prev
              </button>
              <div className="px-4 py-2 font-black text-gray-900 flex items-center bg-white rounded-xl border border-gray-200 shadow-sm text-sm">
                {page} <span className="text-gray-300 mx-2 font-medium">/</span> {totalPages || 1}
              </div>
              <button 
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-gray-700 transition-all bg-white" 
                disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

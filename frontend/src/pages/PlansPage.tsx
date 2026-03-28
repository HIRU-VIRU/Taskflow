import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useNotification } from '../contexts/NotificationContext';
import { LoadingSpinner, ErrorMessage } from '../components/common/StatusMessages';
import { subscriptionsApi } from '../api/subscriptions';
import { plansApi } from '../api/plans';
import { Plan, BillingEvent, UsageSnapshot } from '../types';
import { Check, HelpCircle, Receipt, Activity as ActivityIcon } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';
import { DowngradeGuide } from '../components/DowngradeGuide';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export const PlansPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { subscription, refreshSubscription } = useTenant();
  const { addNotification } = useNotification();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDowngradeGuide, setShowDowngradeGuide] = useState(false);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [usageSnapshots, setUsageSnapshots] = useState<UsageSnapshot[]>([]);
  const [activeUsageKey, setActiveUsageKey] = useState('user_count');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    console.log('PlansPage: Component mounted, fetching plans...');
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    console.log('🔍 Starting fetchPlans...');
    setIsLoading(true);
    setError(null);
    try {
      console.log('📡 Making API call to fetch plans and history...');
      const [fetchedPlans, fetchedBilling, fetchedUsage] = await Promise.all([
        plansApi.getPlans(),
        isAdmin() ? subscriptionsApi.getBillingHistory().catch(() => []) : Promise.resolve([]),
        subscriptionsApi.getUsageHistory('user_count', 30).catch(() => [])
      ]);
      console.log('✅ API calls successful', fetchedPlans.length);

      setPlans(fetchedPlans);
      setBillingEvents(fetchedBilling);
      setUsageSnapshots(fetchedUsage);
      console.log('✅ Plans state updated successfully');
    } catch (err: any) {
      console.error('❌ Failed to fetch plans:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
      setError(err.message || 'Failed to load plans');
    } finally {
      console.log('🏁 fetchPlans completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const fetchUsageData = async (usageKey: string) => {
    setActiveUsageKey(usageKey);
    try {
      const data = await subscriptionsApi.getUsageHistory(usageKey, 30);
      setUsageSnapshots(data);
    } catch (e) {
      console.error('Failed to fetch usage history', e);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!isAdmin()) {
      addNotification('Only admins can change plans', 'error');
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;

    console.log('Starting payment confirmation for plan:', selectedPlan.name);
    try {
      console.log('Calling subscriptionsApi.assignPlan with planId:', selectedPlan.id, 'billingCycle:', billingCycle);
      await subscriptionsApi.assignPlan(selectedPlan.id, billingCycle);

      console.log('Plan assigned successfully, refreshing subscription...');
      await refreshSubscription();

      console.log('Subscription refreshed, showing success notification...');
      addNotification(`Plan updated to ${selectedPlan.name} successfully! 🎉`, 'success');

      console.log('Closing payment modal...');
      setShowPaymentModal(false);
      setSelectedPlan(null);

      console.log('Payment confirmation completed successfully');
    } catch (err: any) {
      console.error('Payment confirmation error:', err);

      // Enhanced error handling for downgrade issues
      if (err.message && err.message.includes('Cannot downgrade')) {
        // Show detailed error with instructions
        addNotification(err.message, 'error');
      } else {
        addNotification(err.message || 'Failed to update plan', 'error');
      }
      // Don't throw - let the PaymentModal handle state
    }
  };

  console.log('🎯 PlansPage render - isLoading:', isLoading, 'error:', error, 'plans length:', plans?.length);
  console.log('🔐 Auth status - isAdmin():', isAdmin());
  console.log('📋 Subscription:', subscription);
  console.log('📋 Subscription.plan_id:', subscription?.plan_id);
  console.log('📋 Subscription.subscription?.plan_id:', (subscription as any)?.subscription?.plan_id);
  console.log('📦 Plans data:', plans);

  if (isLoading) {
    console.log('🔄 Showing loading state...');
    return (
      <div className="p-8">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-600 mt-4">Loading plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage message={error} />
        <button
          onClick={fetchPlans}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Pricing Plans</h1>
          <p className="text-gray-500 font-medium mt-1">Choose the perfect plan to power your team's productivity.</p>
        </div>

        {subscription && subscription.plan_name !== 'Free' && (
          <button
            onClick={() => setShowDowngradeGuide(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all text-sm font-bold border border-blue-100 active:scale-95"
          >
            <HelpCircle className="w-4 h-4" />
            Need Help Downgrading?
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {subscription && (
        <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-lg">
          {/* Gradient accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
          
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Subscription</p>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{subscription.plan_name}</h2>
                </div>
              </div>

              {subscription.expires_at && (
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Next Billing</p>
                  <p className="text-lg font-bold text-gray-900">{new Date(subscription.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              )}
            </div>

            {/* Plan Limits Grid */}
            {subscription.limits && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(subscription.limits).map(([key, limit]) => {
                  const displayName = key.replace('max_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <div key={key} className="group flex items-center gap-4 p-4 bg-gray-50/80 rounded-xl border border-gray-100 hover:bg-blue-50/50 hover:border-blue-100 transition-all duration-300">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500 mb-0.5">{displayName}</p>
                        <p className="text-xl font-black text-gray-900 tracking-tight">
                          {limit === -1 ? (
                            <span className="text-green-600">Unlimited</span>
                          ) : (
                            <>{limit}<span className="text-sm font-medium text-gray-400 ml-1">limit</span></>
                          )}
                        </p>
                      </div>
                      {limit === -1 ? (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-600">
                          {limit}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {subscription.plan_name !== 'Free' && (
              <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                <span className="text-lg">💡</span>
                <p className="text-sm text-amber-800">
                  <span className="font-bold">Thinking of switching?</span>{' '}
                  Ensure your current usage stays within the new plan's limits. Archive projects or adjust your team size before downgrading.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative flex items-center bg-gray-100/80 p-1.5 rounded-2xl w-full max-w-[320px] shadow-inner border border-gray-200/50">
          {/* Sliding highlight background */}
          <div 
            className={`absolute h-[calc(100%-12px)] w-[calc(50%-6px)] bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out border border-gray-100
              ${billingCycle === 'monthly' ? 'translate-x-0' : 'translate-x-full'}`}
          />
          
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-all duration-300 transform active:scale-95
              ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Monthly
          </button>
          
          <button
            onClick={() => setBillingCycle('annual')}
            className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2
              ${billingCycle === 'annual' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Annual
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300
              ${billingCycle === 'annual' 
                ? 'bg-green-600 text-white shadow-sm shadow-green-500/20' 
                : 'bg-gray-200 text-gray-400'}`}>
              -5%
            </span>
          </button>
        </div>
        
        {billingCycle === 'annual' && (
          <div className="flex items-center gap-2 bg-green-50 px-4 py-1.5 rounded-full border border-green-100 animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="text-sm font-bold text-green-700 flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              ✨ You're saving 5% with annual billing!
            </span>
          </div>
        )}
      </div>

      {!plans || plans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No plans available</p>
          <button
            onClick={fetchPlans}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            return (
          <div
            key={plan.id}
            className={`
              relative bg-white border-2 rounded-2xl shadow-sm flex flex-col p-8
              ${selectedPlan?.id === plan.id ? 'border-amber-500 ring-2 ring-amber-500 ring-opacity-50' : 'border-gray-200'}
              ${plan.name === 'Pro' ? 'transform scale-105 border-blue-500 shadow-xl z-10' : ''}
              hover:border-blue-400 transition-all duration-200 cursor-pointer
            `}
            onClick={() => handleSelectPlan(plan)}
          >
            {plan.name === 'Pro' && (
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-gray-500 text-sm h-10">{plan.description}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-gray-900 tracking-tight">
                  ${billingCycle === 'monthly'
                    ? ((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0)
                    : ((plan as any).priceAnnual ?? (((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0) * 12 * 0.95).toFixed(2))}
                </span>
                <span className="text-lg font-medium text-gray-400">
                  {billingCycle === 'monthly' ? '/mo' : '/year'}
                </span>
              </div>
              {billingCycle === 'annual' && ((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0) > 0 && (
                <p className="text-xs text-gray-400 mt-1 font-medium italic">
                  Equivalent to ${(Number((plan as any).priceAnnual ?? (((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0) * 12 * 0.95)) / 12).toFixed(2)}/mo
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6 flex-grow">
                {plan.features?.map((feature) => {
                  const labelMap: Record<string, string> = {
                    'CREATE_PROJECT': 'Create Projects',
                    'CREATE_TASK': 'Create Tasks',
                    'INVITE_USERS': 'Invite Team Members',
                    'AI_SUMMARIZER': 'AI Task Summarizer',
                    'PRIORITY_SUPPORT': 'Priority Support',
                    'ADVANCED_ANALYTICS': 'Advanced Analytics',
                    'CUSTOM_ROLES': 'Custom Roles',
                    'SSO_LOGIN': 'SSO Integration'
                  };
                  
                  const formatFallback = (str: string) => str.replace(/_/g, ' ').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  const displayLabel = labelMap[feature] || formatFallback(feature);
                  
                  return (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-green-50/80 border border-green-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Check className="w-3 h-3 text-green-600 stroke-[3]" />
                      </div>
                      <span className="text-gray-700 text-sm font-semibold">{displayLabel}</span>
                    </div>
                  );
                })}
                {subscription?.plan_id !== plan.id && subscription?.limits && plan.limits && Object.entries(plan.limits).some(([key, limit]) => {
                  const currentLimit = subscription.limits?.[key];
                  return currentLimit !== undefined && limit !== -1 && (currentLimit === -1 || limit < currentLimit);
                }) && (
                  <div className="mt-6 p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                    <p className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-orange-600" /> Downgrade Notice</p>
                    <ul className="space-y-1.5">
                      {Object.entries(plan.limits).filter(([key, limit]) => {
                        const currentLimit = subscription.limits?.[key];
                        return currentLimit !== undefined && limit !== -1 && (currentLimit === -1 || limit < currentLimit);
                      }).map(([key, limit]) => (
                        <li key={key} className="text-xs font-medium text-orange-700/90 flex items-start gap-1">
                          <span className="mt-0.5">•</span>
                          <span>Limit for <strong>{key.replace('max_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong> will reduce to <strong className="text-orange-800">{limit}</strong>. Verify usage beforehand.</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {isAdmin() && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={subscription?.plan_id === plan.id}
                    className={`
                      mt-8 block w-full py-3 px-6 border border-transparent rounded-lg text-center font-medium transition-colors
                      ${subscription?.plan_id === plan.id
                        ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                        : ((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0) === 0
                        ? 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                      }
                    `}
                  >
                    {subscription?.plan_id === plan.id ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              )}
            {/* Active plan ribbon logic moved inside the button text or as a badge above */}
          </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && subscription && (
        <PaymentModal
          plan={selectedPlan}
          currentPlanPrice={plans.find(p => p.id === subscription.plan_id)?.price_monthly || 0}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          onConfirmPayment={handleConfirmPayment}
        />
      )}
      {/* Usage History Chart */}
      {subscription && usageSnapshots.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-blue-600" /> 30-Day Usage History
            </h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => fetchUsageData('user_count')} 
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition ${activeUsageKey === 'user_count' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >Users</button>
              <button 
                onClick={() => fetchUsageData('project_count')} 
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition ${activeUsageKey === 'project_count' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >Projects</button>
            </div>
          </div>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageSnapshots} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="snapshot_date" tickFormatter={(val: string) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} allowDecimals={false} />
                <RechartsTooltip 
                  labelFormatter={(val: string) => new Date(val).toLocaleDateString(undefined, {weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'})}
                  contentStyle={{borderRadius: '0.5rem', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                />
                <Line type="monotone" name={activeUsageKey === 'user_count' ? 'Users' : 'Projects'} dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r: 6}} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Billing History Ledger */}
      {isAdmin() && billingEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6 border-b pb-4">
            <Receipt className="w-5 h-5 text-indigo-600" /> Billing History
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billingEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {Number(event.amount) > 0 ? `$${Number(event.amount).toFixed(2)}` : 'Free'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Downgrade Guide Modal */}
      <DowngradeGuide
        isVisible={showDowngradeGuide}
        onClose={() => setShowDowngradeGuide(false)}
      />
    </div>
  );
};

export default PlansPage;

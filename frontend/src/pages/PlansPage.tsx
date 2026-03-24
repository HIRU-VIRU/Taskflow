import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useNotification } from '../contexts/NotificationContext';
import { LoadingSpinner, ErrorMessage } from '../components/common/StatusMessages';
import { subscriptionsApi } from '../api/subscriptions';
import { Plan,Subscription } from '../types';
import { Check } from 'lucide-react';

export const PlansPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { subscription, refreshSubscription } = useTenant();
  const { addNotification } = useNotification();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await subscriptionsApi.listPlans();
      setPlans(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeDowngrade = async (planId: string) => {
    if (!isAdmin()) {
      addNotification({ type: 'error', message: 'Only admins can change plans' });
      return;
    }

    try {
      await subscriptionsApi.assignPlan(planId);
      await refreshSubscription();
      addNotification({ type: 'success', message: 'Plan updated successfully!' });
    } catch (err: any) {
      addNotification({ type: 'error', message: err.message });
    }
  };

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pricing Plans</h1>
        <p className="text-gray-600 mt-2">Choose the perfect plan for your team</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {subscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 font-medium">
            Current Plan: <span className="font-bold">{subscription.plan_name}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
              subscription?.plan_id === plan.id
                ? 'ring-2 ring-blue-600 bg-blue-50'
                : 'bg-white'
            }`}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price_monthly}
                </span>
                <span className="text-gray-600">/month</span>
              </div>

              <p className="text-gray-600 mb-6">{plan.description}</p>

              <div className="space-y-3 mb-6">
                {plan.features?.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6 text-sm">
                {plan.limits && Object.entries(plan.limits).map(([key, value]) => (
                  <div key={key} className="text-gray-600">
                    <span className="font-medium">{key.replace(/_/g, ' ')}: </span>
                    <span>{value === -1 ? 'Unlimited' : value}</span>
                  </div>
                ))}
              </div>

              {isAdmin() && (
                <button
                  onClick={() => handleUpgradeDowngrade(plan.id)}
                  disabled={subscription?.plan_id === plan.id}
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    subscription?.plan_id === plan.id
                      ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {subscription?.plan_id === plan.id ? 'Current Plan' : 'Select Plan'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

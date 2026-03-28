import React, { useState } from 'react';
import { X, CreditCard, Lock } from 'lucide-react';
import { Plan } from '../types';

interface PaymentModalProps {
  plan: Plan;
  currentPlanPrice: number;
  onClose: () => void;
  onConfirmPayment: () => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  plan,
  currentPlanPrice,
  onClose,
  onConfirmPayment,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const priceDifference = ((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0) - currentPlanPrice;
  const isUpgrade = priceDifference > 0;
  const isDowngrade = priceDifference < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call the payment confirmation
      await onConfirmPayment();

      // Success - modal should close automatically via onConfirmPayment
    } catch (error) {
      console.error('Payment processing error:', error);
      // Error handling is done in the parent component
      // Keep modal open so user can try again
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Billing Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Selected Plan:</span>
              <span className="font-semibold text-gray-900">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Billing Cycle:</span>
              <span className="font-semibold text-gray-900">Monthly</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-900">${((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0).toFixed(2)}/mo</span>
            </div>

            {isUpgrade && (
              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-medium">Upgrade Cost:</span>
                  <span className="text-green-600 font-bold">+${priceDifference.toFixed(2)}/mo</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Prorated charges will be applied for the current billing period
                </p>
              </div>
            )}

            {isDowngrade && (
              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium">New Cost:</span>
                  <span className="text-blue-600 font-bold">${((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0).toFixed(2)}/mo</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Changes will take effect immediately. Credit will be applied to next billing cycle.
                </p>
              </div>
            )}

            {((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0) === 0 && (
              <div className="pt-3 border-t border-gray-300">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <p className="text-blue-800 text-sm font-medium">
                    This is a free plan - no payment required!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Plan Features */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">What's Included:</h4>
            <ul className="space-y-1">
              {plan.features?.map((feature) => (
                <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  {feature.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment Form (only for paid plans) */}
        {((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0) > 0 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg transition ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Credit Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-4 border-2 rounded-lg transition ${
                    paymentMethod === 'bank'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Lock className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={19}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Demo: Use 4242 4242 4242 4242 for testing
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Bank transfer details will be sent to your email after confirmation.
                  Your plan will be activated once payment is received (typically 1-2 business days).
                </p>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure Payment</p>
                  <p className="text-xs text-gray-600 mt-1">
                    This is a demo environment. No real charges will be made.
                    In production, all transactions are encrypted and secure.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Confirm Payment - $${((plan as any).priceMonthly ?? (plan as any).price_monthly ?? 0).toFixed(2)}`
                )}
              </button>
            </div>
          </form>
        )}

        {/* Free Plan - No Payment Form */}
        {plan.price_monthly === 0 && (
          <div className="p-6">
            <button
              onClick={async () => {
                setIsProcessing(true);
                try {
                  console.log('Processing free plan confirmation...');
                  await onConfirmPayment();
                  console.log('Free plan confirmation successful');
                } catch (error) {
                  console.error('Free plan confirmation error:', error);
                  // Error handling is done in parent component
                } finally {
                  setIsProcessing(false);
                }
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? 'Switching Plan...' : 'Confirm Plan Change'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

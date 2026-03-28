import React, { useState } from 'react';
import { Sparkles, Loader2, TrendingUp, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';
import { aiApi } from '../api/ai';
import { useTenant } from '../contexts/TenantContext';
import { useNotification } from '../hooks/useNotification';

interface AISummarizerProps {
  projectId: string;
}

export const AISummarizer: React.FC<AISummarizerProps> = ({ projectId }) => {
  const { subscription } = useTenant();
  const { showError, showSuccess } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  const hasPaidPlan = subscription?.plan_name !== 'Free';

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      const result = await aiApi.summarizeProject(projectId);
      setSummary(result);
      setShowModal(true);
      showSuccess('AI summary generated successfully!');
    } catch (error: any) {
      if (error.code === 'USAGE_LIMIT_EXCEEDED') {
        showError('You\'ve used your free AI summary demo. Upgrade to Pro or Enterprise for unlimited access!');
      } else if (error.code === 'FEATURE_NOT_AVAILABLE') {
        showError('AI summarizer is available on Pro and Enterprise plans');
      } else {
        showError(error.message || 'Failed to generate summary');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFreeUser = !hasPaidPlan;

  return (
    <>
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Project Summary</h3>
              {isFreeUser && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                  1 Free Demo
                </span>
              )}
              {hasPaidPlan && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                  Unlimited
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Get AI-powered insights about your project progress, health, and actionable recommendations.
            </p>
            {isFreeUser && (
              <p className="text-xs text-purple-700 bg-purple-100 rounded px-2 py-1 inline-block">
                💎 Upgrade to Pro or Enterprise for unlimited AI summaries
              </p>
            )}
          </div>
          <button
            onClick={handleGenerateSummary}
            disabled={isLoading}
            className="ml-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Summary
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Modal */}
      {showModal && summary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">AI Project Summary</h2>
                  </div>
                  <p className="text-purple-100">{summary.project.name}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="mt-4 grid grid-cols-2 gap-4 bg-white bg-opacity-20 rounded-lg p-4">
                <div>
                  <div className="text-sm text-purple-100">Total Tasks</div>
                  <div className="text-2xl font-bold">{summary.taskCount}</div>
                </div>
                <div>
                  <div className="text-sm text-purple-100">Completion Rate</div>
                  <div className="text-2xl font-bold">{summary.completionRate}%</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                </div>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {summary.summary}
                </p>
              </div>

              {/* Insights */}
              {summary.insights && summary.insights.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
                  </div>
                  <ul className="space-y-2">
                    {summary.insights.map((insight: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 flex-1">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {summary.recommendations && summary.recommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
                  </div>
                  <ul className="space-y-2">
                    {summary.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <Lightbulb className="flex-shrink-0 w-5 h-5 text-yellow-600 mt-0.5" />
                        <span className="text-gray-700 flex-1">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer Info */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Powered by AWS Bedrock & Claude AI</span>
                </div>
                <span>{new Date(summary.generatedAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

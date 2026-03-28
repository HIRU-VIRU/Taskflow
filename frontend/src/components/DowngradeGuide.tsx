import React, { } from 'react';
import { AlertTriangle, Users, FolderMinus } from 'lucide-react';

interface DowngradeGuideProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DowngradeGuide: React.FC<DowngradeGuideProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-gray-900">Downgrade Requirements</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-700">
            To downgrade your plan, your current usage must not exceed the new plan's limits.
            Here's what you need to do:
          </p>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <FolderMinus className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Reduce Projects</h3>
              </div>
              <p className="text-gray-700 text-sm mb-3">
                If you have too many projects, archive or delete some:
              </p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Go to the Projects page</li>
                <li>Click on projects you no longer need</li>
                <li>Choose "Archive Project" to preserve data but reduce count</li>
                <li>Or "Delete Project" to permanently remove (be careful!)</li>
              </ol>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Remove Users</h3>
              </div>
              <p className="text-gray-700 text-sm mb-3">
                If you have too many team members:
              </p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Go to the Team Members page</li>
                <li>Remove users who no longer need access</li>
                <li>Note: You cannot remove yourself as admin</li>
                <li>Users can be re-invited later if needed</li>
              </ol>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              <strong>💡 Tip:</strong> Check your current usage on this page before selecting a new plan.
              The system will prevent downgrades that would exceed limits to protect your data.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// src/pages/HealthBot.tsx
import React from 'react';
import { HealthBotChat } from './HealthBotChat';
import { HealthBotStatus } from './HealthBotStatus';

export const HealthBot: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Health Assistant</h1>
          <p className="text-gray-600 mt-2">
            Get 24/7 guidance on medications, post-visit instructions, and general health questions
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <HealthBotChat />
          </div>
          
          {/* Status Panel */}
          <div className="lg:col-span-1 space-y-6">
            <HealthBotStatus />
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  💊 Medication Information
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  📋 Post-Visit Instructions
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  🩺 General Health Guidance
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  🚨 Emergency Information
                </button>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Important Notice</h4>
              <p className="text-sm text-yellow-700">
                This health assistant provides general information only and should not replace professional medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
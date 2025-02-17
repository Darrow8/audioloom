import React from 'react';
import { Button } from 'react-native';
import { Check } from 'lucide-react';

export default function PremiumSales() {
  return (
    <div className="w-full max-w-3xl mx-auto p-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg">
      <div className="text-center mb-10">
        {/* <span className="bg-purple-100 text-purple-800 text-sm font-medium px-4 py-1 rounded-full">
          Limited Time Offer
        </span> */}
        <h2 className="text-4xl font-bold text-gray-900 mt-4 mb-4">
          Upgrade to Audioloom Premium
        </h2>
        <p className="text-gray-600 text-xl">
          Transform your podcast creation journey with professional tools
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="text-center">
            <span className="text-4xl font-bold text-gray-900">$19</span>
            <span className="text-gray-500">/month</span>
          </div>
          <div className="text-center">
            <span className="text-lg text-gray-500 line-through">$29</span>
            <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              Save 35%
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <div className="space-y-4">
          <FeatureItem text="Unlimited access to all Audioloom services" />
          <FeatureItem text="Highest quality audio processing" />
          <FeatureItem text="Priority podcast generation" />
          <FeatureItem text="Advanced editing tools" />
        </div>
        <div className="space-y-4">
          <FeatureItem text="24/7 premium support" />
          <FeatureItem text="Custom branding options" />
          <FeatureItem text="Batch processing capabilities" />
          <FeatureItem text="Early access to new features" />
        </div>
      </div>

      <div className="text-center space-y-6">
        <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-medium rounded-lg transition-colors duration-200">
          Start Your Free 14-Day Trial
        </button>
        <div className="flex flex-col items-center space-y-2">
          <p className="text-sm text-gray-500">
            No credit card required • Cancel anytime
          </p>
          <p className="text-sm text-gray-500">
            30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center space-x-3">
      <Check className="h-5 w-5 text-green-500" />
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

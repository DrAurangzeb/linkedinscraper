import React, { useState } from 'react';
import { MessageSquare, Send, ExternalLink, Star, Heart, Lightbulb } from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  const [feedbackType, setFeedbackType] = useState<'general' | 'bug' | 'feature'>('general');
  
  // This will be updated with the actual Google Form URL
  const GOOGLE_FORM_URL = 'https://forms.google.com/your-form-url-here';

  const openGoogleForm = () => {
    window.open(GOOGLE_FORM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">We Value Your Feedback</h2>
          <p className="text-lg text-gray-600">
            Help us improve the LinkedIn Scraper by sharing your thoughts, reporting bugs, or suggesting new features.
          </p>
        </div>

        {/* Feedback Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-3">
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-900 mb-2">General Feedback</h3>
            <p className="text-sm text-blue-700">
              Share your overall experience and suggestions for improvement
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-3">
              <MessageSquare className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-semibold text-red-900 mb-2">Bug Reports</h3>
            <p className="text-sm text-red-700">
              Report issues, errors, or unexpected behavior you've encountered
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-3">
              <Lightbulb className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-900 mb-2">Feature Requests</h3>
            <p className="text-sm text-green-700">
              Suggest new features or enhancements you'd like to see
            </p>
          </div>
        </div>

        {/* Main CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white text-center mb-6">
          <h3 className="text-2xl font-bold mb-4">Ready to Share Your Feedback?</h3>
          <p className="text-blue-100 mb-6">
            Click the button below to open our feedback form. It only takes a few minutes and helps us make the tool better for everyone.
          </p>
          
          <button
            onClick={openGoogleForm}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            <Send className="w-5 h-5" />
            Open Feedback Form
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">What to Include in Your Feedback:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span><strong>For Bugs:</strong> Describe what you were doing when the issue occurred and what you expected to happen</span>
            </li>
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span><strong>For Features:</strong> Explain how the new feature would help you and why it would be valuable</span>
            </li>
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span><strong>For General Feedback:</strong> Share what you like, what could be improved, and your overall experience</span>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Your feedback is anonymous and helps us prioritize improvements. Thank you for taking the time to help us improve!
          </p>
        </div>
      </div>
    </div>
  );
};
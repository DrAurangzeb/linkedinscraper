import React, { useState } from 'react';
import { Search, Users, UserCheck, Loader2, AlertTriangle, Plus, X } from 'lucide-react';

interface ScrapingFormProps {
  onScrape: (type: 'post_comments' | 'profile_details' | 'mixed', urls: string[]) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export const ScrapingForm: React.FC<ScrapingFormProps> = ({ onScrape, isLoading, disabled = false }) => {
  const [scrapingType, setScrapingType] = useState<'post_comments' | 'profile_details' | 'mixed'>('post_comments');
  const [urls, setUrls] = useState<string[]>(['']);
  const [showMultipleUrls, setShowMultipleUrls] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    // Filter out empty URLs and trim whitespace
    const validUrls = urls
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (validUrls.length === 0) return;
    
    await onScrape(scrapingType, validUrls);
    setUrls(['']);
    setShowMultipleUrls(false);
  };

  const addUrlField = () => {
    setUrls(prev => [...prev, '']);
  };

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      setUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    // Check if the pasted content contains multiple lines
    if (value.includes('\n')) {
      const lines = value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (lines.length > 1) {
        // Multiple URLs detected - replace current URLs with the new ones
        setUrls(lines);
        setShowMultipleUrls(true);
        return;
      }
    }
    
    // Single URL update (original behavior)
    setUrls(prev => prev.map((url, i) => i === index ? value : url));
  };

  const getPlaceholder = (index: number = 0) => {
    switch (scrapingType) {
      case 'post_comments':
        return index === 0 
          ? 'https://www.linkedin.com/posts/... (paste multiple URLs, one per line)' 
          : `Post URL ${index + 1}`;
      case 'profile_details':
        return index === 0 
          ? 'https://www.linkedin.com/in/username (paste multiple URLs, one per line)' 
          : `Profile URL ${index + 1}`;
      case 'mixed':
        return index === 0 
          ? 'https://www.linkedin.com/posts/... (paste multiple URLs, one per line)' 
          : `Post URL ${index + 1}`;
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (scrapingType) {
      case 'post_comments':
        return <Search className="w-5 h-5" />;
      case 'profile_details':
        return <UserCheck className="w-5 h-5" />;
      case 'mixed':
        return <Users className="w-5 h-5" />;
      default:
        return <Search className="w-5 h-5" />;
    }
  };

  const getDescription = () => {
    switch (scrapingType) {
      case 'post_comments':
        return 'Extract commenters from LinkedIn posts. You can scrape multiple posts at once or paste multiple URLs separated by new lines.';
      case 'profile_details':
        return 'Extract detailed information from LinkedIn profiles. Add multiple profile URLs or paste multiple URLs separated by new lines.';
      case 'mixed':
        return 'Extract commenters from posts and their full profile details. Process multiple posts simultaneously or paste multiple URLs separated by new lines.';
      default:
        return '';
    }
  };

  const validUrls = urls.filter(url => url.trim().length > 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          {getIcon()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">LinkedIn Scraper</h2>
          <p className="text-gray-600 text-sm mt-1">{getDescription()}</p>
        </div>
      </div>

      {disabled && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Setup Required</p>
            <p>Please select a user and configure an Apify API key before starting to scrape.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Scraping Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setScrapingType('post_comments')}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all ${
                scrapingType === 'post_comments'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Search className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Post Comments</div>
              <div className="text-sm text-gray-500">Scrape post engagers</div>
            </button>

            <button
              type="button"
              onClick={() => setScrapingType('profile_details')}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all ${
                scrapingType === 'profile_details'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <UserCheck className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Profile Details</div>
              <div className="text-sm text-gray-500">Scrape profile info</div>
            </button>

            <button
              type="button"
              onClick={() => setScrapingType('mixed')}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all ${
                scrapingType === 'mixed'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Mixed</div>
              <div className="text-sm text-gray-500">Post + Profiles</div>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="urls" className="block text-sm font-medium text-gray-700">
              LinkedIn URL{urls.length > 1 ? 's' : ''}
            </label>
            <div className="flex items-center gap-2">
              {!showMultipleUrls && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMultipleUrls(true);
                    if (urls.length === 1 && !urls[0]) {
                      setUrls(['', '']);
                    }
                  }}
                  disabled={disabled}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  + Add multiple URLs
                </button>
              )}
              {validUrls.length > 0 && (
                <span className="text-sm text-gray-500">
                  {validUrls.length} URL{validUrls.length !== 1 ? 's' : ''} ready
                </span>
              )}
            </div>
          </div>

          {/* Multi-line paste hint */}
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>💡 Pro Tip:</strong> You can paste multiple URLs at once! Just copy multiple LinkedIn URLs and paste them into any input field - each URL should be on a separate line. The form will automatically create individual input fields for each URL.
            </div>
          </div>

          <div className="space-y-3">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder={getPlaceholder(index)}
                  disabled={disabled}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrlField(index)}
                    disabled={disabled}
                    className="px-3 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {showMultipleUrls && (
            <button
              type="button"
              onClick={addUrlField}
              disabled={disabled}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add another URL
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || validUrls.length === 0 || disabled}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scraping {validUrls.length} URL{validUrls.length !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              {getIcon()}
              Start Scraping {validUrls.length > 1 ? `${validUrls.length} URLs` : ''}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
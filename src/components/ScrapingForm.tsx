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
  const [bulkInput, setBulkInput] = useState('');
  const [useBulkInput, setUseBulkInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    let validUrls: string[] = [];
    
    if (useBulkInput) {
      // Parse bulk input
      validUrls = bulkInput
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    } else {
      // Filter out empty URLs and trim whitespace
      validUrls = urls
        .map(url => url.trim())
        .filter(url => url.length > 0);
    }
    
    if (validUrls.length === 0) return;
    
    await onScrape(scrapingType, validUrls);
    
    // Reset form
    setUrls(['']);
    setBulkInput('');
    setShowMultipleUrls(false);
    setUseBulkInput(false);
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
    setUrls(prev => prev.map((url, i) => i === index ? value : url));
  };

  const handleBulkInputChange = (value: string) => {
    setBulkInput(value);
  };

  const switchToBulkInput = () => {
    // Convert current URLs to bulk input
    const currentUrls = urls.filter(url => url.trim().length > 0);
    setBulkInput(currentUrls.join('\n'));
    setUseBulkInput(true);
  };

  const switchToIndividualInputs = () => {
    // Convert bulk input to individual URLs
    const urlsFromBulk = bulkInput
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (urlsFromBulk.length > 0) {
      setUrls(urlsFromBulk);
      setShowMultipleUrls(urlsFromBulk.length > 1);
    } else {
      setUrls(['']);
      setShowMultipleUrls(false);
    }
    setUseBulkInput(false);
  };

  const getPlaceholder = (index: number = 0) => {
    switch (scrapingType) {
      case 'post_comments':
        return index === 0 
          ? 'https://www.linkedin.com/posts/...' 
          : `Post URL ${index + 1}`;
      case 'profile_details':
        return index === 0 
          ? 'https://www.linkedin.com/in/username' 
          : `Profile URL ${index + 1}`;
      case 'mixed':
        return index === 0 
          ? 'https://www.linkedin.com/posts/... (will scrape post + profiles)' 
          : `Post URL ${index + 1}`;
      default:
        return '';
    }
  };

  const getBulkPlaceholder = () => {
    switch (scrapingType) {
      case 'post_comments':
        return `Paste multiple LinkedIn post URLs, one per line:

https://www.linkedin.com/posts/example1
https://www.linkedin.com/posts/example2
https://www.linkedin.com/posts/example3`;
      case 'profile_details':
        return `Paste multiple LinkedIn profile URLs, one per line:

https://www.linkedin.com/in/username1
https://www.linkedin.com/in/username2
https://www.linkedin.com/in/username3`;
      case 'mixed':
        return `Paste multiple LinkedIn post URLs, one per line:

https://www.linkedin.com/posts/example1
https://www.linkedin.com/posts/example2
https://www.linkedin.com/posts/example3`;
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
        return 'Extract commenters from LinkedIn posts. You can scrape multiple posts at once.';
      case 'profile_details':
        return 'Extract detailed information from LinkedIn profiles. Add multiple profile URLs to scrape them all.';
      case 'mixed':
        return 'Extract commenters from posts and their full profile details. Process multiple posts simultaneously.';
      default:
        return '';
    }
  };

  const getValidUrlCount = () => {
    if (useBulkInput) {
      return bulkInput.split('\n').filter(url => url.trim().length > 0).length;
    }
    return urls.filter(url => url.trim().length > 0).length;
  };

  const validUrlCount = getValidUrlCount();

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
              LinkedIn URL{validUrlCount > 1 ? 's' : ''}
            </label>
            <div className="flex items-center gap-2">
              {!useBulkInput && !showMultipleUrls && (
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
              
              {!useBulkInput && (
                <button
                  type="button"
                  onClick={switchToBulkInput}
                  disabled={disabled}
                  className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50"
                >
                  📋 Bulk paste
                </button>
              )}
              
              {useBulkInput && (
                <button
                  type="button"
                  onClick={switchToIndividualInputs}
                  disabled={disabled}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  📝 Individual inputs
                </button>
              )}
              
              {validUrlCount > 0 && (
                <span className="text-sm text-gray-500">
                  {validUrlCount} URL{validUrlCount !== 1 ? 's' : ''} ready
                </span>
              )}
            </div>
          </div>

          {useBulkInput ? (
            // Bulk input mode - textarea for multiple URLs
            <div className="space-y-3">
              <textarea
                value={bulkInput}
                onChange={(e) => handleBulkInputChange(e.target.value)}
                placeholder={getBulkPlaceholder()}
                disabled={disabled}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none font-mono text-sm"
              />
              <div className="text-xs text-gray-500">
                💡 Paste one URL per line. Empty lines will be ignored.
              </div>
            </div>
          ) : (
            // Individual input mode
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
          )}

          {!useBulkInput && showMultipleUrls && (
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
          disabled={isLoading || validUrlCount === 0 || disabled}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scraping {validUrlCount} URL{validUrlCount !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              {getIcon()}
              Start Scraping {validUrlCount > 1 ? `${validUrlCount} URLs` : ''}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
import React, { useState } from 'react';
import { MessageSquare, User, CheckSquare, Square, Users, ArrowLeft, Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { LoadingProgress } from './LoadingProgress';
import { exportData } from '../utils/export';

interface CommentData {
  type: string;
  id: string;
  linkedinUrl: string;
  commentary: string;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    linkedinUrl: string;
    position: string;
    pictureUrl: string;
  };
}

interface CommentResultsProps {
  comments: CommentData[];
  onScrapeSelectedProfiles: (profileUrls: string[]) => Promise<void>;
  isLoading: boolean;
  onBack: () => void;
  loadingStage?: 'starting' | 'scraping_comments' | 'extracting_profiles' | 'scraping_profiles' | 'saving_data' | 'completed' | 'error';
  loadingProgress?: number;
  loadingMessage?: string;
  loadingError?: string;
}

export const CommentResults: React.FC<CommentResultsProps> = ({
  comments,
  onScrapeSelectedProfiles,
  isLoading,
  onBack,
  loadingStage = 'starting',
  loadingProgress = 0,
  loadingMessage = '',
  loadingError = ''
}) => {
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(comments.length);
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const toggleComment = (commentId: string) => {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(commentId)) {
      newSelected.delete(commentId);
    } else {
      newSelected.add(commentId);
    }
    setSelectedComments(newSelected);
  };

  const toggleAll = () => {
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map(c => c.id)));
    }
  };

  const selectRange = () => {
    const start = Math.max(1, Math.min(rangeStart, comments.length));
    const end = Math.max(start, Math.min(rangeEnd, comments.length));
    
    const rangeIds = comments.slice(start - 1, end).map(c => c.id);
    setSelectedComments(new Set(rangeIds));
    setShowRangeSelector(false);
  };

  const handleScrapeSelected = async () => {
    const selectedProfileUrls = comments
      .filter(comment => selectedComments.has(comment.id))
      .map(comment => comment.actor.linkedinUrl)
      .filter(Boolean);
    
    if (selectedProfileUrls.length > 0) {
      await onScrapeSelectedProfiles(selectedProfileUrls);
    }
  };

  const handleExportComments = (format: string) => {
    const exportComments = comments.map(comment => ({
      id: comment.id,
      commenter_name: comment.actor.name,
      commenter_position: comment.actor.position,
      commenter_linkedin_url: comment.actor.linkedinUrl,
      comment_text: comment.commentary,
      comment_date: comment.createdAt,
      post_url: comment.linkedinUrl
    }));

    exportData(exportComments, format, 'linkedin_commenters');
    setShowExportMenu(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays <= 7) {
      return 'This week';
    } else if (diffDays <= 30) {
      return 'This month';
    } else {
      return date.toLocaleDateString('en-GB');
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading Progress */}
      {isLoading && (
        <LoadingProgress
          type="profile_details"
          stage={loadingStage}
          progress={loadingProgress}
          message={loadingMessage}
          error={loadingError}
        />
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Post Comments ({comments.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Select commenters to scrape their profile details
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Scraper
              </button>

              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Comments
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2">
                      <button
                        onClick={() => handleExportComments('csv')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExportComments('json')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <FileJson className="w-4 h-4" />
                        Export as JSON
                      </button>
                      <button
                        onClick={() => handleExportComments('xlsx')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <FileText className="w-4 h-4" />
                        Export as Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleScrapeSelected}
                disabled={selectedComments.size === 0 || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                {isLoading ? 'Scraping...' : `Scrape Selected Profiles (${selectedComments.size})`}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <button
              onClick={toggleAll}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {selectedComments.size === comments.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedComments.size === comments.length ? 'Deselect All' : 'Select All'}
            </button>

            <button
              onClick={() => setShowRangeSelector(!showRangeSelector)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Select Range
            </button>
            
            <span className="text-sm text-gray-600">
              {selectedComments.size} of {comments.length} selected
            </span>
          </div>

          {/* Range Selector */}
          {showRangeSelector && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-blue-900">From:</label>
                  <input
                    type="number"
                    min="1"
                    max={comments.length}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 border border-blue-300 rounded text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-blue-900">To:</label>
                  <input
                    type="number"
                    min="1"
                    max={comments.length}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(parseInt(e.target.value) || comments.length)}
                    className="w-20 px-2 py-1 border border-blue-300 rounded text-sm"
                  />
                </div>
                
                <button
                  onClick={selectRange}
                  className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Select Range
                </button>
                
                <button
                  onClick={() => setShowRangeSelector(false)}
                  className="px-4 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <div className="mt-2 text-xs text-blue-700">
                This will select comments {Math.max(1, Math.min(rangeStart, comments.length))} to {Math.max(rangeStart, Math.min(rangeEnd, comments.length))} ({Math.max(0, Math.min(rangeEnd, comments.length) - Math.max(1, Math.min(rangeStart, comments.length)) + 1)} comments)
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commenter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comments.map((comment, index) => (
                <tr key={comment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleComment(comment.id)}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {selectedComments.has(comment.id) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        {comment.actor.pictureUrl ? (
                          <img 
                            src={comment.actor.pictureUrl} 
                            alt={comment.actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {comment.actor.name}
                        </div>
                        <div className="text-sm text-blue-600 hover:underline">
                          <a 
                            href={comment.actor.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {comment.actor.position || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md">
                      <div className="line-clamp-3" title={comment.commentary}>
                        {comment.commentary}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comments.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">No comments found</div>
          </div>
        )}
      </div>
    </div>
  );
};
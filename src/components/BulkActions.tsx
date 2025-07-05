import React, { useState } from 'react';
import { 
  Upload, 
  Download, 
  Trash2, 
  Tag, 
  Mail, 
  FileText, 
  Users,
  CheckSquare,
  Square,
  X,
  Plus,
  Loader2
} from 'lucide-react';

interface BulkActionsProps {
  selectedProfiles: Set<string>;
  totalProfiles: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onUpdateSelected: () => Promise<void>;
  onDeleteSelected: () => Promise<void>;
  onExportSelected: (format: string) => void;
  onTagSelected: (tags: string[]) => Promise<void>;
  onEmailSelected: () => void;
  isLoading?: boolean;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedProfiles,
  totalProfiles,
  onSelectAll,
  onDeselectAll,
  onUpdateSelected,
  onDeleteSelected,
  onExportSelected,
  onTagSelected,
  onEmailSelected,
  isLoading = false
}) => {
  const [showTagModal, setShowTagModal] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleApplyTags = async () => {
    if (tags.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onTagSelected(tags);
      setShowTagModal(false);
      setTags([]);
    } catch (error) {
      console.error('Error applying tags:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateSelected = async () => {
    setIsProcessing(true);
    try {
      await onUpdateSelected();
    } catch (error) {
      console.error('Error updating profiles:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProfiles.size} selected profiles? This action cannot be undone.`)) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await onDeleteSelected();
    } catch (error) {
      console.error('Error deleting profiles:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedProfiles.size === 0) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={onSelectAll}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Square className="w-4 h-4" />
          Select All ({totalProfiles})
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedProfiles.size} profile{selectedProfiles.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={selectedProfiles.size === totalProfiles ? onDeselectAll : onSelectAll}
              className="flex items-center gap-1 px-2 py-1 text-sm text-blue-700 hover:text-blue-900 transition-colors"
            >
              {selectedProfiles.size === totalProfiles ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Select All
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Update Selected */}
            <button
              onClick={handleUpdateSelected}
              disabled={isLoading || isProcessing}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Update
            </button>

            {/* Tag Selected */}
            <button
              onClick={() => setShowTagModal(true)}
              disabled={isLoading || isProcessing}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Tag className="w-4 h-4" />
              Tag
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onExportSelected(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={isLoading || isProcessing}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                defaultValue=""
              >
                <option value="" disabled>Export...</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xlsx">Excel</option>
              </select>
            </div>

            {/* Email Selected */}
            <button
              onClick={onEmailSelected}
              disabled={isLoading || isProcessing}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>

            {/* Delete Selected */}
            <button
              onClick={handleDeleteSelected}
              disabled={isLoading || isProcessing}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>

            {/* Clear Selection */}
            <button
              onClick={onDeselectAll}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Tags to {selectedProfiles.size} Profiles
              </h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Enter tag name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowTagModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyTags}
                  disabled={tags.length === 0 || isProcessing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Applying...' : `Apply Tags`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
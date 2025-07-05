import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  MapPin, 
  Building, 
  Mail, 
  Phone, 
  Globe,
  Award,
  GraduationCap,
  Briefcase,
  Users,
  Calendar,
  Tag
} from 'lucide-react';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasWebsite: boolean;
    hasSkills: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasCertifications: boolean;
    hasAbout: boolean;
    hasLocation: boolean;
    hasCurrentJob: boolean;
    companies: string[];
    locations: string[];
    tags: string[];
    dateRange: string;
    completenessMin: number;
  };
  onFiltersChange: (filters: any) => void;
  availableCompanies: string[];
  availableLocations: string[];
  availableTags: string[];
  totalProfiles: number;
  filteredCount: number;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  availableCompanies,
  availableLocations,
  availableTags,
  totalProfiles,
  filteredCount
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const getActiveFiltersCount = () => {
    let count = 0;
    
    // Data presence filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key.startsWith('has') && value) count++;
    });
    
    // Selection filters
    if (filters.companies.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.completenessMin > 0) count++;
    
    return count;
  };

  const clearAllFilters = () => {
    onFiltersChange({
      hasEmail: false,
      hasPhone: false,
      hasWebsite: false,
      hasSkills: false,
      hasExperience: false,
      hasEducation: false,
      hasCertifications: false,
      hasAbout: false,
      hasLocation: false,
      hasCurrentJob: false,
      companies: [],
      locations: [],
      tags: [],
      dateRange: 'all',
      completenessMin: 0
    });
  };

  const toggleDataFilter = (filterKey: string) => {
    onFiltersChange({
      ...filters,
      [filterKey]: !filters[filterKey]
    });
  };

  const toggleCompany = (company: string) => {
    const newCompanies = filters.companies.includes(company)
      ? filters.companies.filter(c => c !== company)
      : [...filters.companies, company];
    
    onFiltersChange({
      ...filters,
      companies: newCompanies
    });
  };

  const toggleLocation = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter(l => l !== location)
      : [...filters.locations, location];
    
    onFiltersChange({
      ...filters,
      locations: newLocations
    });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFiltersChange({
      ...filters,
      tags: newTags
    });
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search profiles by name, headline, company, or location..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
            activeFiltersCount > 0 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredCount.toLocaleString()} of {totalProfiles.toLocaleString()} profiles
        </span>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-6">
          {/* Data Presence Filters */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Show profiles with:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { key: 'hasEmail', label: 'Email', icon: Mail },
                { key: 'hasPhone', label: 'Phone', icon: Phone },
                { key: 'hasWebsite', label: 'Website', icon: Globe },
                { key: 'hasLocation', label: 'Location', icon: MapPin },
                { key: 'hasCurrentJob', label: 'Current Job', icon: Briefcase },
                { key: 'hasAbout', label: 'About Section', icon: Users },
                { key: 'hasSkills', label: 'Skills', icon: Award },
                { key: 'hasExperience', label: 'Experience', icon: Briefcase },
                { key: 'hasEducation', label: 'Education', icon: GraduationCap },
                { key: 'hasCertifications', label: 'Certifications', icon: Award }
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={filters[key as keyof typeof filters] as boolean}
                    onChange={() => toggleDataFilter(key)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Company Filter */}
          {availableCompanies.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Companies:</h4>
              <div className="relative">
                <button
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {filters.companies.length === 0 
                      ? 'Select companies...' 
                      : `${filters.companies.length} selected`
                    }
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showCompanyDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {availableCompanies.slice(0, 20).map(company => (
                      <label key={company} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.companies.includes(company)}
                          onChange={() => toggleCompany(company)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 truncate">{company}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {filters.companies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.companies.map(company => (
                    <span key={company} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {company}
                      <button onClick={() => toggleCompany(company)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Location Filter */}
          {availableLocations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Locations:</h4>
              <div className="relative">
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {filters.locations.length === 0 
                      ? 'Select locations...' 
                      : `${filters.locations.length} selected`
                    }
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showLocationDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {availableLocations.slice(0, 20).map(location => (
                      <label key={location} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.locations.includes(location)}
                          onChange={() => toggleLocation(location)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 truncate">{location}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {filters.locations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.locations.map(location => (
                    <span key={location} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {location}
                      <button onClick={() => toggleLocation(location)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Tags:</h4>
              <div className="relative">
                <button
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {filters.tags.length === 0 
                      ? 'Select tags...' 
                      : `${filters.tags.length} selected`
                    }
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showTagDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {availableTags.map(tag => (
                      <label key={tag} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.tags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 truncate">#{tag}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                      #{tag}
                      <button onClick={() => toggleTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date Range Filter */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Last Updated:</h4>
            <select
              value={filters.dateRange}
              onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="quarter">Last 3 months</option>
              <option value="year">This year</option>
            </select>
          </div>

          {/* Completeness Filter */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Profile Completeness: {filters.completenessMin}%+
            </h4>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={filters.completenessMin}
              onChange={(e) => onFiltersChange({ ...filters, completenessMin: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
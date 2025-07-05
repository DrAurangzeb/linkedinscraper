import { useMemo } from 'react';

interface FilterOptions {
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
}

export const useProfileFilters = (profiles: any[], searchTerm: string, filters: FilterOptions) => {
  const filteredProfiles = useMemo(() => {
    let filtered = profiles;

    // Text search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(profile => {
        const data = profile.profile_data || {};
        const tags = profile.tags || [];
        
        const searchableText = [
          data.fullName,
          data.firstName,
          data.lastName,
          data.headline,
          data.companyName,
          data.jobTitle,
          data.addressWithCountry,
          data.addressCountryOnly,
          data.addressWithoutCountry,
          ...tags
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchLower);
      });
    }

    // Data presence filters
    if (filters.hasEmail) {
      filtered = filtered.filter(p => p.profile_data?.email);
    }
    if (filters.hasPhone) {
      filtered = filtered.filter(p => p.profile_data?.mobileNumber);
    }
    if (filters.hasWebsite) {
      filtered = filtered.filter(p => p.profile_data?.creatorWebsite?.link);
    }
    if (filters.hasSkills) {
      filtered = filtered.filter(p => p.profile_data?.skills?.length > 0);
    }
    if (filters.hasExperience) {
      filtered = filtered.filter(p => p.profile_data?.experiences?.length > 0);
    }
    if (filters.hasEducation) {
      filtered = filtered.filter(p => p.profile_data?.educations?.length > 0);
    }
    if (filters.hasCertifications) {
      filtered = filtered.filter(p => p.profile_data?.licenseAndCertificates?.length > 0);
    }
    if (filters.hasAbout) {
      filtered = filtered.filter(p => p.profile_data?.about);
    }
    if (filters.hasLocation) {
      filtered = filtered.filter(p => 
        p.profile_data?.addressWithCountry || 
        p.profile_data?.addressCountryOnly || 
        p.profile_data?.addressWithoutCountry
      );
    }
    if (filters.hasCurrentJob) {
      filtered = filtered.filter(p => 
        p.profile_data?.jobTitle || p.profile_data?.companyName
      );
    }

    // Company filter
    if (filters.companies.length > 0) {
      filtered = filtered.filter(p => 
        filters.companies.includes(p.profile_data?.companyName)
      );
    }

    // Location filter
    if (filters.locations.length > 0) {
      filtered = filtered.filter(p => {
        const location = p.profile_data?.addressWithCountry || 
                         p.profile_data?.addressCountryOnly || 
                         p.profile_data?.addressWithoutCountry;
        return location && filters.locations.includes(location);
      });
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(p => {
        const profileTags = p.tags || [];
        return filters.tags.some(tag => profileTags.includes(tag));
      });
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(p => {
        const lastUpdated = p.last_updated || p.created_at;
        return lastUpdated && new Date(lastUpdated) >= filterDate;
      });
    }

    // Completeness filter
    if (filters.completenessMin > 0) {
      filtered = filtered.filter(p => {
        const completeness = calculateProfileCompleteness(p.profile_data || {});
        return completeness >= filters.completenessMin;
      });
    }

    return filtered;
  }, [profiles, searchTerm, filters]);

  // Extract available filter options
  const availableOptions = useMemo(() => {
    const companies = new Set<string>();
    const locations = new Set<string>();
    const tags = new Set<string>();

    profiles.forEach(profile => {
      const data = profile.profile_data || {};
      
      if (data.companyName) companies.add(data.companyName);
      
      const location = data.addressWithCountry || data.addressCountryOnly || data.addressWithoutCountry;
      if (location) locations.add(location);
      
      if (profile.tags) {
        profile.tags.forEach((tag: string) => tags.add(tag));
      }
    });

    return {
      companies: Array.from(companies).sort(),
      locations: Array.from(locations).sort(),
      tags: Array.from(tags).sort()
    };
  }, [profiles]);

  return {
    filteredProfiles,
    availableCompanies: availableOptions.companies,
    availableLocations: availableOptions.locations,
    availableTags: availableOptions.tags
  };
};

const calculateProfileCompleteness = (data: any): number => {
  let score = 0;
  const maxScore = 100;

  // Basic info (40 points)
  if (data.fullName || (data.firstName && data.lastName)) score += 10;
  if (data.headline) score += 10;
  if (data.about) score += 10;
  if (data.profilePic) score += 10;

  // Contact info (20 points)
  if (data.email) score += 10;
  if (data.mobileNumber) score += 10;

  // Professional info (30 points)
  if (data.jobTitle) score += 10;
  if (data.companyName) score += 10;
  if (data.experiences && data.experiences.length > 0) score += 10;

  // Additional info (10 points)
  if (data.skills && data.skills.length > 0) score += 5;
  if (data.educations && data.educations.length > 0) score += 5;

  return Math.round((score / maxScore) * 100);
};
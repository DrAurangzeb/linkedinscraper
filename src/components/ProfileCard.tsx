import React from 'react';
import { 
  User, 
  MapPin, 
  Users, 
  Briefcase, 
  Mail, 
  Phone, 
  ExternalLink,
  Building,
  Calendar,
  Award,
  GraduationCap,
  Globe,
  Star
} from 'lucide-react';

interface ProfileCardProps {
  profile: any;
  onViewDetails: (profile: any) => void;
  onUpdate?: (profileUrl: string) => void;
  showActions?: boolean;
  isSelected?: boolean;
  onSelect?: (profileUrl: string) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onViewDetails,
  onUpdate,
  showActions = true,
  isSelected = false,
  onSelect
}) => {
  const data = profile.profile_data || {};

  const getProfileCompleteness = () => {
    let score = 0;
    let maxScore = 100;

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

  const completeness = getProfileCompleteness();

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {data.profilePicHighQuality || data.profilePic ? (
                <img 
                  src={data.profilePicHighQuality || data.profilePic} 
                  alt={data.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Selection Checkbox */}
            {onSelect && (
              <button
                onClick={() => onSelect(profile.linkedin_url || data.linkedinUrl)}
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 hover:border-blue-400'
                }`}
              >
                {isSelected && <span className="text-xs">✓</span>}
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim()}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
              {data.headline || 'No headline available'}
            </p>
            
            {/* Location & Connections */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {(data.addressWithCountry || data.addressCountryOnly) && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">
                    {data.addressWithCountry || data.addressCountryOnly}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{data.connections?.toLocaleString() || '0'} connections</span>
              </div>
            </div>
          </div>

          {/* Completeness Score */}
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCompletenessColor(completeness)}`}>
              {completeness}% complete
            </span>
            
            {/* Quality Indicators */}
            <div className="flex gap-1">
              {data.email && (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Has email" />
              )}
              {data.mobileNumber && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" title="Has phone" />
              )}
              {data.creatorWebsite?.link && (
                <div className="w-2 h-2 bg-purple-500 rounded-full" title="Has website" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Current Job */}
        {(data.jobTitle || data.companyName) && (
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900">{data.jobTitle || 'Position not specified'}</div>
              {data.companyName && (
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {data.companyName}
                </div>
              )}
              {data.currentJobDuration && (
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {data.currentJobDuration}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="space-y-2">
          {data.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <a 
                href={`mailto:${data.email}`}
                className="text-blue-600 hover:underline truncate"
              >
                {data.email}
              </a>
            </div>
          )}
          
          {data.mobileNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <a 
                href={`tel:${data.mobileNumber}`}
                className="text-blue-600 hover:underline"
              >
                {data.mobileNumber}
              </a>
            </div>
          )}
          
          {data.creatorWebsite?.link && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-gray-400" />
              <a 
                href={data.creatorWebsite.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                {data.creatorWebsite.name || 'Website'}
              </a>
            </div>
          )}
        </div>

        {/* Skills Preview */}
        {data.skills && data.skills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Top Skills</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {data.skills.slice(0, 3).map((skill: any, idx: number) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {skill.title}
                </span>
              ))}
              {data.skills.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{data.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Experience & Education Count */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {data.experiences && data.experiences.length > 0 && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{data.experiences.length} experience{data.experiences.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {data.educations && data.educations.length > 0 && (
            <div className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              <span>{data.educations.length} education{data.educations.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.tags.map((tag: string, idx: number) => (
              <span 
                key={idx}
                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <a
              href={profile.linkedin_url || data.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              LinkedIn Profile
            </a>
            
            <div className="flex gap-2">
              <button
                onClick={() => onViewDetails(data)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
              
              {onUpdate && (
                <button
                  onClick={() => onUpdate(profile.linkedin_url || data.linkedinUrl)}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Update
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
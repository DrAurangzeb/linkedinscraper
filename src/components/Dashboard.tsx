import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Database, 
  TrendingUp, 
  Calendar,
  MapPin,
  Building,
  Award,
  Mail,
  Phone
} from 'lucide-react';
import { LocalStorageService } from '../lib/localStorage';

interface DashboardProps {
  userId: string;
  profiles: any[];
  jobs: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({ userId, profiles, jobs }) => {
  const [analytics, setAnalytics] = useState({
    totalProfiles: 0,
    profilesWithEmail: 0,
    profilesWithPhone: 0,
    topCompanies: [] as { name: string; count: number }[],
    topLocations: [] as { name: string; count: number }[],
    recentActivity: [] as any[],
    completionRate: 0
  });

  useEffect(() => {
    calculateAnalytics();
  }, [profiles, jobs]);

  const calculateAnalytics = () => {
    const totalProfiles = profiles.length;
    const profilesWithEmail = profiles.filter(p => p.profile_data?.email).length;
    const profilesWithPhone = profiles.filter(p => p.profile_data?.mobileNumber).length;

    // Top companies
    const companyCount = new Map<string, number>();
    profiles.forEach(p => {
      const company = p.profile_data?.companyName;
      if (company) {
        companyCount.set(company, (companyCount.get(company) || 0) + 1);
      }
    });
    const topCompanies = Array.from(companyCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top locations
    const locationCount = new Map<string, number>();
    profiles.forEach(p => {
      const location = p.profile_data?.addressWithCountry || p.profile_data?.addressCountryOnly;
      if (location) {
        locationCount.set(location, (locationCount.get(location) || 0) + 1);
      }
    });
    const topLocations = Array.from(locationCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = jobs
      .filter(j => new Date(j.createdAt) > sevenDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Completion rate
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const completionRate = jobs.length > 0 ? (completedJobs / jobs.length) * 100 : 0;

    setAnalytics({
      totalProfiles,
      profilesWithEmail,
      profilesWithPhone,
      topCompanies,
      topLocations,
      recentActivity,
      completionRate
    });
  };

  const getProfileCompleteness = (profile: any) => {
    const data = profile.profile_data || {};
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

  const averageCompleteness = profiles.length > 0 
    ? Math.round(profiles.reduce((sum, p) => sum + getProfileCompleteness(p), 0) / profiles.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600">Overview of your LinkedIn scraping activity</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">{analytics.totalProfiles}</div>
                <div className="text-sm text-blue-700">Total Profiles</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">{analytics.profilesWithEmail}</div>
                <div className="text-sm text-green-700">With Email</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">{analytics.profilesWithPhone}</div>
                <div className="text-sm text-purple-700">With Phone</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-900">{averageCompleteness}%</div>
                <div className="text-sm text-amber-700">Avg Completeness</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Building className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Top Companies</h3>
          </div>
          
          <div className="space-y-3">
            {analytics.topCompanies.map((company, index) => (
              <div key={company.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{company.name}</span>
                </div>
                <span className="text-sm text-gray-600">{company.count} profiles</span>
              </div>
            ))}
            {analytics.topCompanies.length === 0 && (
              <div className="text-center py-4 text-gray-500">No company data available</div>
            )}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Top Locations</h3>
          </div>
          
          <div className="space-y-3">
            {analytics.topLocations.map((location, index) => (
              <div key={location.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-medium text-emerald-600">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{location.name}</span>
                </div>
                <span className="text-sm text-gray-600">{location.count} profiles</span>
              </div>
            ))}
            {analytics.topLocations.length === 0 && (
              <div className="text-center py-4 text-gray-500">No location data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-100 rounded-lg">
            <Calendar className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        
        <div className="space-y-3">
          {analytics.recentActivity.map((job, index) => (
            <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  job.status === 'completed' ? 'bg-green-500' :
                  job.status === 'failed' ? 'bg-red-500' :
                  job.status === 'running' ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                <div>
                  <div className="font-medium text-gray-900">
                    {job.jobType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                  <div className="text-sm text-gray-600">
                    {job.resultsCount} results • {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                job.status === 'completed' ? 'bg-green-100 text-green-800' :
                job.status === 'failed' ? 'bg-red-100 text-red-800' :
                job.status === 'running' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {job.status}
              </span>
            </div>
          ))}
          {analytics.recentActivity.length === 0 && (
            <div className="text-center py-8 text-gray-500">No recent activity</div>
          )}
        </div>
      </div>

      {/* Job Success Rate */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Award className="w-5 h-5 text-cyan-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{analytics.completionRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Job Success Rate</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${analytics.completionRate}%` }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{jobs.length}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
            <div className="text-xs text-gray-500 mt-1">
              {jobs.filter(j => j.status === 'completed').length} completed
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {analytics.profilesWithEmail > 0 ? Math.round((analytics.profilesWithEmail / analytics.totalProfiles) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Contact Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              Profiles with contact info
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
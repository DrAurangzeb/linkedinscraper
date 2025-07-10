import React, { useState, useEffect } from 'react';
import { LocalAuth } from './components/LocalAuth';
import { ScrapingForm } from './components/ScrapingForm';
import { CommentResults } from './components/CommentResults';
import { ProfileDetailsDisplay } from './components/ProfileDetailsDisplay';
import { LoadingProgress } from './components/LoadingProgress';
import { ProfileResultsTable } from './components/ProfileResultsTable';
import { LocalApifyKeyManager } from './components/LocalApifyKeyManager';
import { LocalJobsTable } from './components/LocalJobsTable';
import { DataTable } from './components/DataTable';
import { FeedbackPage } from './components/FeedbackPage';
import { createApifyService } from './lib/apify';
import { SupabaseProfilesService } from './lib/supabaseProfiles';
import { LocalStorageService, type LocalUser, type LocalApifyKey, type LocalJob } from './lib/localStorage';
import { exportData } from './utils/export';
import { 
  Linkedin, Database, Activity, Clock, Loader2, AlertCircle, 
  User, LogOut, ChevronDown, MessageCircle
} from 'lucide-react';

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

function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // App state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [commentersData, setCommentersData] = useState<CommentData[]>([]);
  const [profileDetails, setProfileDetails] = useState<any[]>([]);
  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<any>(null);
  const [scrapingJobs, setScrapingJobs] = useState<LocalJob[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'scraper' | 'profiles' | 'jobs' | 'feedback'>('scraper');
  const [currentView, setCurrentView] = useState<'form' | 'comments' | 'profile-details' | 'profile-table' | 'profiles-list' | 'single-profile-details' | 'feedback'>('form');
  const [previousView, setPreviousView] = useState<'form' | 'comments' | 'profile-details' | 'profile-table' | 'profiles-list'>('form');
  
  // Scraping state
  const [isScraping, setIsScraping] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [loadingStage, setLoadingStage] = useState<'starting' | 'scraping_comments' | 'extracting_profiles' | 'scraping_profiles' | 'saving_data' | 'completed' | 'error'>('starting');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingError, setLoadingError] = useState('');
  const [scrapingType, setScrapingType] = useState<'post_comments' | 'profile_details' | 'mixed'>('post_comments');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Progress tracking
  const [currentProfileCount, setCurrentProfileCount] = useState(0);
  const [totalProfileCount, setTotalProfileCount] = useState(0);
  const [canCancelScraping, setCanCancelScraping] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  // Multiple URL tracking
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [totalUrls, setTotalUrls] = useState(0);
  const [urlResults, setUrlResults] = useState<{url: string; status: 'pending' | 'processing' | 'completed' | 'failed'; results?: any[]; error?: string}[]>([]);

  // Initialize app
  useEffect(() => {
    const initApp = () => {
      const user = LocalStorageService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        loadUserData(user.id);
      }
      setIsLoading(false);
    };

    initApp();
  }, []);

  const loadUserData = async (userId: string) => {
    const jobs = LocalStorageService.getJobs(userId);
    setScrapingJobs(jobs);
    
    try {
      console.log('📊 Loading data for user:', userId);
      
      const localProfiles = LocalStorageService.getUserProfiles(userId);
      console.log('📱 Local profiles for user:', localProfiles.length);
      
      const supabaseProfiles = await SupabaseProfilesService.getUserProfiles(userId);
      console.log('☁️ Supabase profiles for user:', supabaseProfiles.length);
      
      const mergedProfiles = mergeProfiles(localProfiles, supabaseProfiles);
      
      LocalStorageService.saveUserProfiles(userId, mergedProfiles);
      setProfiles(mergedProfiles);
      
      console.log(`✅ Loaded ${localProfiles.length} local + ${supabaseProfiles.length} Supabase = ${mergedProfiles.length} merged profiles for user ${userId}`);
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      const localProfiles = LocalStorageService.getUserProfiles(userId);
      setProfiles(localProfiles);
      console.log('⚠️ Fallback: Using local profiles only:', localProfiles.length);
    }
  };

  const mergeProfiles = (localProfiles: any[], supabaseProfiles: any[]): any[] => {
    const profileMap = new Map();
    
    localProfiles.forEach(profile => {
      profileMap.set(profile.linkedin_url, profile);
    });
    
    supabaseProfiles.forEach(supabaseProfile => {
      const url = supabaseProfile.linkedin_url;
      const existing = profileMap.get(url);
      
      if (!existing || new Date(supabaseProfile.last_updated) > new Date(existing.last_updated)) {
        profileMap.set(url, supabaseProfile);
      }
    });
    
    return Array.from(profileMap.values());
  };

  const updateLoadingProgress = (stage: typeof loadingStage, progress: number = 0, message: string = '') => {
    setLoadingStage(stage);
    setLoadingProgress(progress);
    setLoadingMessage(message);
  };

  const handleKeySelect = (key: LocalApifyKey) => {
    console.log('🔑 API key selected:', key.keyName);
    setSelectedKeyId(key.id);
  };

  const handleAuthSuccess = (user: LocalUser) => {
    setCurrentUser(user);
    loadUserData(user.id);
  };

  const handleLogout = () => {
    LocalStorageService.logout();
    setCurrentUser(null);
    setProfiles([]);
    setScrapingJobs([]);
    setShowUserMenu(false);
  };

  const handleCancelScraping = () => {
    if (currentJobId) {
      const job = scrapingJobs.find(j => j.id === currentJobId);
      if (job) {
        const cancelledJob: LocalJob = {
          ...job,
          status: 'failed',
          errorMessage: 'Cancelled by user',
          completedAt: new Date().toISOString()
        };
        LocalStorageService.saveJob(cancelledJob);
        setScrapingJobs(prev => prev.map(j => j.id === currentJobId ? cancelledJob : j));
      }
    }
    
    setIsScraping(false);
    setCanCancelScraping(false);
    setCurrentJobId(null);
    setCurrentProfileCount(0);
    setTotalProfileCount(0);
    setCurrentUrlIndex(0);
    setTotalUrls(0);
    setUrlResults([]);
    updateLoadingProgress('error', 0, 'Scraping cancelled by user');
  };

  const handleScrape = async (type: 'post_comments' | 'profile_details' | 'mixed', urls: string[]) => {
    console.log('🚀 handleScrape called with:', { type, urlCount: urls.length, urls });
    console.log('🚀 Starting scrape with:', { type, urls: urls.length });
    
    if (!currentUser) {
      console.error('❌ No current user found');
      alert('Please select a user first');
      return;
    }

    if (!selectedKeyId) {
      console.error('❌ No API key selected');
      alert('Please select an Apify API key first');
      return;
    }

    const keys = LocalStorageService.getApifyKeys(currentUser.id);
    console.log('🔑 Retrieved keys from localStorage:', keys.length);
    const allUserKeys = keys.filter(k => k.isActive);
    console.log('🔑 Active keys found:', allUserKeys.length);

    if (allUserKeys.length === 0) {
      console.error('❌ No active API keys found');
      alert('No active API keys found');
      return;
    }

    // Create array of API keys for rotation
    const apiKeys = allUserKeys.map(k => k.apiKey);
    console.log(`🔑 Using ${apiKeys.length} API key(s) for rotation:`, apiKeys.map(k => k.substring(0, 10) + '...'));
    setIsScraping(true);
    setScrapingType(type);
    setLoadingError('');
    setCanCancelScraping(true);
    setTotalUrls(urls.length);
    setCurrentUrlIndex(0);
    
    // Initialize URL results tracking
    const initialResults = urls.map(url => ({
      url,
      status: 'pending' as const
    }));
    setUrlResults(initialResults);
    
    updateLoadingProgress('starting', 0, `Initializing scraping for ${urls.length} URL${urls.length > 1 ? 's' : ''}...`);
    
    const job = LocalStorageService.createJob(currentUser.id, type, urls.join('\n'));
    setCurrentJobId(job.id);
    setScrapingJobs(prev => [job, ...prev]);
    
    try {
      console.log('🔧 Creating Apify service with', apiKeys.length, 'API key(s)');
      const apifyService = createApifyService(apiKeys);
      console.log('✅ Apify service created successfully');
      let allResults: any[] = [];
      let totalResultsCount = 0;

      for (let i = 0; i < urls.length; i++) {
        if (!isScraping) break; // Check if cancelled
        
        const url = urls[i];
        setCurrentUrlIndex(i);
        
        console.log(`🔄 Processing URL ${i + 1}/${urls.length}:`, url);
        console.log(`📊 Current scraping state - isScraping: ${isScraping}, type: ${type}`);
        
        // Update URL status to processing
        setUrlResults(prev => prev.map((result, index) => 
          index === i ? { ...result, status: 'processing' } : result
        ));

        try {
          updateLoadingProgress('starting', (i / urls.length) * 100, `Processing URL ${i + 1}/${urls.length}: ${url.substring(0, 50)}...`);

          if (type === 'post_comments') {
            console.log('📝 Scraping post comments for:', url);
            updateLoadingProgress('scraping_comments', (i / urls.length) * 100, `Extracting comments from post ${i + 1}/${urls.length}...`);
            
            const datasetId = await apifyService.scrapePostComments(url);
            console.log('✅ Got dataset ID:', datasetId);
            
            const commentsData = await apifyService.getDatasetItems(datasetId);
            console.log('✅ Got comments data:', commentsData.length, 'items');
            
            allResults.push(...commentsData);
            totalResultsCount += commentsData.length;
            
            // Update URL status to completed
            setUrlResults(prev => prev.map((result, index) => 
              index === i ? { ...result, status: 'completed', results: commentsData } : result
            ));

          } else if (type === 'profile_details') {
            console.log('👤 Scraping profile details for:', url);
            console.log('🔧 About to call scrapeProfilesDirectly with URL:', url);
            updateLoadingProgress('scraping_profiles', (i / urls.length) * 100, `Scraping profile ${i + 1}/${urls.length}...`);
            
            const profilesData = await scrapeProfilesDirectly([url], apifyService, (current, total) => {
              setCurrentProfileCount(current);
              setTotalProfileCount(total);
              const urlProgress = (i / urls.length) * 100;
              const profileProgress = total > 0 ? (current / total) * (100 / urls.length) : 0;
              updateLoadingProgress('scraping_profiles', urlProgress + profileProgress, `Scraping profile ${i + 1}/${urls.length}: ${current}/${total}`);
            });
            
            console.log('✅ scrapeProfilesDirectly returned:', profilesData.length, 'items');
            console.log('📋 Profile data sample:', profilesData.slice(0, 2));
            allResults.push(...profilesData);
            totalResultsCount += profilesData.length;
            
            setUrlResults(prev => prev.map((result, index) => 
              index === i ? { ...result, status: 'completed', results: profilesData } : result
            ));

          } else if (type === 'mixed') {
            console.log('🔄 Mixed scraping for:', url);
            updateLoadingProgress('scraping_comments', (i / urls.length) * 50, `Extracting comments from post ${i + 1}/${urls.length}...`);
            
            const datasetId = await apifyService.scrapePostComments(url);
            const commentsData = await apifyService.getDatasetItems(datasetId);
            
            updateLoadingProgress('extracting_profiles', (i / urls.length) * 50 + 25, `Extracting profile URLs from post ${i + 1}/${urls.length}...`);
            
            const profileUrls = commentsData
              .map(comment => comment.actor?.linkedinUrl)
              .filter(Boolean)
              .slice(0, 50);
            
            console.log('🔗 Extracted profile URLs:', profileUrls.length);
            
            if (profileUrls.length > 0) {
              setTotalProfileCount(profileUrls.length);
              updateLoadingProgress('scraping_profiles', (i / urls.length) * 50 + 50, `Scraping ${profileUrls.length} profiles from post ${i + 1}/${urls.length}...`);
              
              const profilesData = await scrapeProfilesDirectly(profileUrls, apifyService, (current, total) => {
                setCurrentProfileCount(current);
                const urlProgress = (i / urls.length) * 50 + 50;
                const profileProgress = total > 0 ? (current / total) * (50 / urls.length) : 0;
                updateLoadingProgress('scraping_profiles', urlProgress + profileProgress, `Post ${i + 1}/${urls.length}: Scraping profiles ${current}/${total}`);
              });
              
              allResults.push(...profilesData);
              totalResultsCount += profilesData.length;
            }
            
            setUrlResults(prev => prev.map((result, index) => 
              index === i ? { ...result, status: 'completed', results: profileUrls } : result
            ));
          }

        } catch (urlError) {
          console.error(`❌ Error processing URL ${i + 1}:`, urlError);
          
          setUrlResults(prev => prev.map((result, index) => 
            index === i ? { 
              ...result, 
              status: 'failed', 
              error: urlError instanceof Error ? urlError.message : 'Unknown error'
            } : result
          ));
        }
      }

      updateLoadingProgress('saving_data', 90, 'Saving all scraped data...');

      console.log('💾 Processing results:', { type, totalResults: allResults.length });

      // Set results based on scraping type
      if (type === 'post_comments') {
        console.log('📝 Setting comments data:', allResults.length);
        setCommentersData(allResults);
        setCurrentView('comments');
      } else {
        console.log('👤 Setting profile details:', allResults.length);
        setProfileDetails(allResults);
        setPreviousView('form');
        setCurrentView('profile-table');
      }

      updateLoadingProgress('completed', 100, `Successfully processed ${urls.length} URL${urls.length > 1 ? 's' : ''} with ${totalResultsCount} total results!`);
      
      const completedJob: LocalJob = {
        ...job,
        status: 'completed',
        resultsCount: totalResultsCount,
        completedAt: new Date().toISOString()
      };
      LocalStorageService.saveJob(completedJob);
      setScrapingJobs(prev => prev.map(j => j.id === job.id ? completedJob : j));

      // Log final API usage stats
      console.log('📊 Final API usage statistics:', apifyService.getUsageStats());
    } catch (error) {
      console.error('❌ Scraping error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setLoadingError(errorMessage);
      updateLoadingProgress('error', 0, 'Scraping failed: ' + errorMessage);
      
      const failedJob: LocalJob = {
        ...job,
        status: 'failed',
        errorMessage,
        completedAt: new Date().toISOString()
      };
      LocalStorageService.saveJob(failedJob);
      setScrapingJobs(prev => prev.map(j => j.id === job.id ? failedJob : j));
      
    } finally {
      setIsScraping(false);
      setCanCancelScraping(false);
      setCurrentJobId(null);
      setCurrentProfileCount(0);
      setTotalProfileCount(0);
      setCurrentUrlIndex(0);
      setTotalUrls(0);
    }
  };

  // New function that always calls Apify API directly without checking database first
  const scrapeProfilesDirectly = async (
    profileUrls: string[], 
    apifyService: any, 
    onProgress?: (current: number, total: number) => void
  ): Promise<any[]> => {
    console.log('🚀 scrapeProfilesDirectly called');
    console.log('📋 Input parameters:', { 
      profileUrlsCount: profileUrls.length, 
      profileUrls, 
      hasApifyService: !!apifyService,
      hasOnProgress: !!onProgress 
    });
    console.log('🚀 DIRECT APIFY SCRAPING - Bypassing database check');
    
    updateLoadingProgress('scraping_profiles', 10, 'Starting direct Apify scraping...');
    
    try {
      // Always call Apify API directly
      console.log('🔥 About to call apifyService.scrapeProfiles with:', profileUrls.length, 'profiles');
      console.log('🔥 ApifyService methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(apifyService)));
      const datasetId = await apifyService.scrapeProfiles(profileUrls, onProgress);
      console.log('✅ apifyService.scrapeProfiles returned dataset ID:', datasetId);

      updateLoadingProgress('scraping_profiles', 70, 'Retrieving scraped data...');
      const newProfilesData = await apifyService.getDatasetItems(datasetId);
      console.log('📊 apifyService.getDatasetItems returned:', newProfilesData.length, 'profiles');
      console.log('📋 Sample profile data:', newProfilesData.slice(0, 1));

      updateLoadingProgress('scraping_profiles', 85, 'Saving scraped profiles...');
      
      // Save to database and local storage
      for (const profileData of newProfilesData) {
        if (profileData.linkedinUrl) {
          try {
            // Save to Supabase
            await SupabaseProfilesService.saveProfile(profileData, currentUser!.id);
            
            // Save to local storage
            LocalStorageService.addUserProfile(currentUser!.id, {
              linkedin_url: profileData.linkedinUrl,
              profile_data: profileData,
              last_updated: new Date().toISOString()
            });
            
            console.log('✅ Saved profile to DB and localStorage:', profileData.linkedinUrl);
          } catch (saveError) {
            console.error('❌ Error saving profile:', profileData.linkedinUrl, 'Error:', saveError);
          }
        }
      }
      
      // Update local profiles state
      const updatedProfiles = LocalStorageService.getUserProfiles(currentUser!.id);
      setProfiles(updatedProfiles);
      
      console.log('🎉 scrapeProfilesDirectly completed successfully with', newProfilesData.length, 'profiles');
      return newProfilesData;
    } catch (error) {
      console.error('❌ scrapeProfilesDirectly failed with error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  };

  const getProfilesWithOptimization = async (
    profileUrls: string[], 
    apifyService: any, 
    onProgress?: (current: number, total: number) => void
  ): Promise<any[]> => {
    const results: any[] = [];
    const urlsToScrape: string[] = [];
    let savedCost = 0;
    
    updateLoadingProgress('scraping_profiles', 30, 'Checking for existing profiles...');
    
    console.log('🔍 Starting profile optimization check for', profileUrls.length, 'URLs');
    
    for (const url of profileUrls) {
      try {
        const existingProfile = await SupabaseProfilesService.checkProfileExists(url);
        console.log('🔍 Checking profile existence for:', url, 'Found:', !!existingProfile);
        
        if (existingProfile) {
          // Add existing profile to user's collection
          await SupabaseProfilesService.addProfileToUser(url, currentUser!.id);
          results.push(existingProfile.profile_data);
          savedCost++;
          console.log('✅ Using existing profile for:', url);
        } else {
          urlsToScrape.push(url);
          console.log('📝 Added to scrape queue:', url);
        }
      } catch (error) {
        console.error('❌ Error checking profile existence for', url, ':', error);
        urlsToScrape.push(url);
        console.log('📝 Added to scrape queue (due to error):', url);
      }
    }
    
    console.log('📊 Optimization results:', {
      totalUrls: profileUrls.length,
      existingProfiles: savedCost,
      urlsToScrape: urlsToScrape.length,
      urlsToScrapeList: urlsToScrape
    });
    
    if (urlsToScrape.length > 0) {
      updateLoadingProgress('scraping_profiles', 50, `Scraping ${urlsToScrape.length} new profiles (saved ${savedCost} API calls)...`);
      
      console.log('🚀 Starting Apify scraping for', urlsToScrape.length, 'URLs:', urlsToScrape);
      const datasetId = await apifyService.scrapeProfiles(urlsToScrape, onProgress);
      console.log('Dataset ID received from Apify scrapeProfiles:', datasetId);

      const newProfilesData = await apifyService.getDatasetItems(datasetId);
      console.log('New profiles data received from Apify dataset:', newProfilesData);

      updateLoadingProgress('scraping_profiles', 70, 'Saving new profiles to database...');
      
      for (const profileData of newProfilesData) {
        if (profileData.linkedinUrl) {
          try {
            await SupabaseProfilesService.saveProfile(profileData, currentUser!.id);
            
            LocalStorageService.addUserProfile(currentUser!.id, {
              linkedin_url: profileData.linkedinUrl,
              profile_data: profileData,
              last_updated: new Date().toISOString()
            });
            
            results.push(profileData);
            console.log('✅ Saved new profile:', profileData.linkedinUrl);
          } catch (saveError) {
            console.error('❌ Error saving profile:', profileData.linkedinUrl, saveError);
            results.push(profileData);
          }
        }
      }
    } else {
      console.log('ℹ️ No new profiles to scrape - all profiles already exist in database');
    }
    
    updateLoadingProgress('scraping_profiles', 90, `Completed! Saved ${savedCost} API calls by using cached profiles.`);
    
    const updatedProfiles = LocalStorageService.getUserProfiles(currentUser!.id);
    setProfiles(updatedProfiles);
    
    console.log('📊 Final results:', {
      totalResults: results.length,
      savedCost,
      newlyScraped: urlsToScrape.length
    });
    
    return results;
  };

  const handleScrapeSelectedCommenterProfiles = async (profileUrls: string[]) => {
    if (!currentUser || !selectedKeyId) {
      alert('Please ensure you are signed in and have selected an API key');
      return;
    }

    const keys = LocalStorageService.getApifyKeys(currentUser.id);
    const allUserKeys = keys.filter(k => k.isActive);

    if (allUserKeys.length === 0) {
      alert('No active API keys found');
      return;
    }
    
    const apiKeys = allUserKeys.map(k => k.apiKey);
    
    setIsScraping(true);
    setScrapingType('profile_details');
    setLoadingError('');
    setCanCancelScraping(true);
    setTotalProfileCount(profileUrls.length);
    updateLoadingProgress('scraping_profiles', 25, `Checking and scraping ${profileUrls.length} selected profiles...`);
    
    const job = LocalStorageService.createJob(currentUser.id, 'profile_details', profileUrls.join(','));
    setCurrentJobId(job.id);
    setScrapingJobs(prev => [job, ...prev]);
    
    try {
      const apifyService = createApifyService(apiKeys);
      const profilesData = await scrapeProfilesDirectly(profileUrls, apifyService, (current, total) => {
        setCurrentProfileCount(current);
        const progressPercent = total > 0 ? (current / total) * 100 : 0;
        updateLoadingProgress('scraping_profiles', 25 + (progressPercent * 0.5), `Scraping profiles: ${current}/${total}`);
      });
      
      updateLoadingProgress('saving_data', 75, 'Processing profile data...');
      setProfileDetails(profilesData);
      setPreviousView('comments');
      setCurrentView('profile-table');
      updateLoadingProgress('completed', 100, 'Selected profiles scraped successfully!');
      
      const completedJob: LocalJob = {
        ...job,
        status: 'completed',
        resultsCount: profilesData.length,
        completedAt: new Date().toISOString()
      };
      LocalStorageService.saveJob(completedJob);
      setScrapingJobs(prev => prev.map(j => j.id === job.id ? completedJob : j));
      
    } catch (error) {
      console.error('❌ Error scraping selected profiles:', error);
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setLoadingError(errorMessage);
      updateLoadingProgress('error', 0, 'Failed to scrape selected profiles');
      
      const failedJob: LocalJob = {
        ...job,
        status: 'failed',
        errorMessage,
        completedAt: new Date().toISOString()
      };
      LocalStorageService.saveJob(failedJob);
      setScrapingJobs(prev => prev.map(j => j.id === job.id ? failedJob : j));
    } finally {
      setIsScraping(false);
      setCanCancelScraping(false);
      setCurrentJobId(null);
      setCurrentProfileCount(0);
      setTotalProfileCount(0);
    }
  };

  const handleStoreSelectedProfiles = async (profilesToStore: any[], tags: string[]) => {
    if (!currentUser) return;
    
    try {
      console.log('💾 Storing', profilesToStore.length, 'profiles with tags:', tags, 'for user:', currentUser.id);
      
      for (const profile of profilesToStore) {
        if (profile.linkedinUrl) {
          await SupabaseProfilesService.saveProfile(profile, currentUser.id);
          
          LocalStorageService.addUserProfile(currentUser.id, {
            linkedin_url: profile.linkedinUrl,
            profile_data: profile,
            tags,
            last_updated: new Date().toISOString()
          });
        }
      }
      
      const updatedProfiles = LocalStorageService.getUserProfiles(currentUser.id);
      setProfiles(updatedProfiles);
      
      alert(`Successfully stored ${profilesToStore.length} profiles${tags.length > 0 ? ` with tags: ${tags.join(', ')}` : ''}`);
      
    } catch (error) {
      console.error('❌ Error storing profiles:', error);
      alert('Error storing profiles. Please try again.');
    }
  };

  const handleUpdateProfile = async (profileUrl: string) => {
    if (!currentUser || !selectedKeyId) {
      alert('Please ensure you are signed in and have selected an API key');
      return;
    }

    const keys = LocalStorageService.getApifyKeys(currentUser.id);
    const allUserKeys = keys.filter(k => k.isActive);

    if (allUserKeys.length === 0) {
      alert('No active API keys found');
      return;
    }

    const apiKeys = allUserKeys.map(k => k.apiKey);

    try {
      const apifyService = createApifyService(apiKeys);
      const profilesData = await scrapeProfilesDirectly([profileUrl], apifyService);
      
      if (profilesData.length > 0) {
        await loadUserData(currentUser.id);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleUpdateSelectedProfiles = async (profileUrls: string[]) => {
    if (!currentUser || !selectedKeyId) {
      alert('Please ensure you are signed in and have selected an API key');
      return;
    }

    const keys = LocalStorageService.getApifyKeys(currentUser.id);
    const allUserKeys = keys.filter(k => k.isActive);

    if (allUserKeys.length === 0) {
      alert('No active API keys found');
      return;
    }

    const apiKeys = allUserKeys.map(k => k.apiKey);

    try {
      const apifyService = createApifyService(apiKeys);
      await scrapeProfilesDirectly(profileUrls, apifyService);
      
      await loadUserData(currentUser.id);
      alert(`Successfully updated ${profileUrls.length} profiles!`);
    } catch (error) {
      console.error('❌ Error updating profiles:', error);
      alert('Error updating profiles. Please try again.');
    }
  };

  const handleDeleteSelectedProfiles = async (profileIds: string[]) => {
    if (!currentUser) return;
    
    try {
      const currentProfiles = LocalStorageService.getUserProfiles(currentUser.id);
      const filteredProfiles = currentProfiles.filter(p => !profileIds.includes(p.id));
      LocalStorageService.saveUserProfiles(currentUser.id, filteredProfiles);
      
      try {
        await SupabaseProfilesService.deleteProfiles(profileIds, currentUser.id);
      } catch (supabaseError) {
        console.warn('⚠️ Could not delete from Supabase, but removed from local storage:', supabaseError);
      }
      
      setProfiles(filteredProfiles);
      
      alert(`Successfully deleted ${profileIds.length} profiles`);
    } catch (error) {
      console.error('❌ Error deleting profiles:', error);
      alert('Error deleting profiles. Please try again.');
    }
  };

  const handleTabChange = async (tab: 'scraper' | 'profiles' | 'jobs' | 'feedback') => {
    setActiveTab(tab);
    
    if (tab === 'profiles') {
      setCurrentView('profiles-list');
      if (currentUser) {
        const userProfiles = LocalStorageService.getUserProfiles(currentUser.id);
        setProfiles(userProfiles);
        console.log('📱 Profiles tab: Loaded', userProfiles.length, 'profiles for user', currentUser.id);
      }
    } else if (tab === 'scraper') {
      setCurrentView('form');
      if (currentUser) {
        const userProfiles = LocalStorageService.getUserProfiles(currentUser.id);
        setProfiles(userProfiles);
      }
    } else if (tab === 'jobs') {
      setCurrentView('form');
    } else if (tab === 'feedback') {
      setCurrentView('feedback');
    }
  };

  const handleExport = (format: string, selectedOnly: boolean = false) => {
    exportData(profiles, format, 'linkedin_profiles');
  };

  const handleExportProfileResults = (format: string) => {
    exportData(profileDetails.map(profile => ({ profile_data: profile })), format, 'profile_results');
  };

  const handleBackToForm = () => {
    setCurrentView('form');
    setCommentersData([]);
    setProfileDetails([]);
    setSelectedProfileForDetails(null);
    setPreviousView('form');
    setLoadingStage('starting');
    setLoadingProgress(0);
    setLoadingMessage('');
    setLoadingError('');
    setUrlResults([]);
  };

  const handleBackToPrevious = () => {
    if (previousView === 'comments') {
      setCurrentView('comments');
    } else if (previousView === 'profiles-list') {
      setCurrentView('profiles-list');
      setActiveTab('profiles');
    } else if (previousView === 'profile-table') {
      setCurrentView('profile-table');
    } else {
      setCurrentView('form');
    }
  };

  const handleViewProfileDetails = (profile: any) => {
    if (activeTab === 'profiles') {
      setPreviousView('profiles-list');
      setSelectedProfileForDetails(profile);
      setCurrentView('single-profile-details');
    } else {
      setPreviousView(currentView);
      setProfileDetails([profile]);
      setCurrentView('profile-details');
    }
  };

  const handleBackToProfilesList = () => {
    setCurrentView('profiles-list');
    setSelectedProfileForDetails(null);
  };

  const isScrapingDisabled = () => {
    return !selectedKeyId;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 text-lg font-medium">Loading Application...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LocalAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Linkedin className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">LinkedIn Scraper</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <nav className="flex space-x-1">
                <button
                  onClick={() => handleTabChange('scraper')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'scraper'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-2" />
                  Scraper
                </button>
                <button
                  onClick={() => handleTabChange('profiles')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'profiles'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Database className="w-4 h-4 inline mr-2" />
                  My Profiles ({profiles.length})
                </button>
                <button
                  onClick={() => handleTabChange('jobs')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'jobs'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Jobs ({scrapingJobs.length})
                </button>
                <button
                  onClick={() => handleTabChange('feedback')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'feedback'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  Feedback
                </button>
              </nav>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {currentUser.fullName ? currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : currentUser.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">{currentUser.fullName || currentUser.username}</div>
                    <div className="text-xs text-gray-500">{currentUser.email}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                          {currentUser.fullName ? currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : currentUser.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {currentUser.fullName || currentUser.username}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{currentUser.email}</div>
                          <div className="text-xs text-blue-600 truncate">User ID: {currentUser.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Switch User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'feedback' ? (
          <FeedbackPage />
        ) : (
          <>
            {/* API Key Management */}
            {(activeTab === 'scraper' && currentView === 'form') && (
              <div className="mb-8">
                <LocalApifyKeyManager
                  userId={currentUser.id}
                  selectedKeyId={selectedKeyId}
                  onKeySelect={handleKeySelect}
                />
              </div>
            )}

            {activeTab === 'scraper' && (
              <div className="space-y-8">
                {currentView === 'form' && (
                  <>
                    <ScrapingForm 
                      onScrape={handleScrape} 
                      isLoading={isScraping}
                      disabled={isScrapingDisabled()}
                    />
                    
                    {isScraping && (
                      <LoadingProgress
                        type={scrapingType}
                        stage={loadingStage}
                        progress={loadingProgress}
                        message={loadingMessage}
                        error={loadingError}
                        currentCount={currentProfileCount}
                        totalCount={totalProfileCount}
                        onCancel={handleCancelScraping}
                        canCancel={canCancelScraping}
                      />
                    )}

                    {/* URL Results Progress */}
                    {urlResults.length > 0 && (
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Processing Progress ({currentUrlIndex + 1}/{totalUrls})
                        </h3>
                        <div className="space-y-3">
                          {urlResults.map((result, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className={`w-3 h-3 rounded-full ${
                                result.status === 'completed' ? 'bg-green-500' :
                                result.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                                result.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {result.url}
                                </div>
                                {result.status === 'completed' && result.results && (
                                  <div className="text-xs text-green-600">
                                    ✓ {result.results.length} results
                                  </div>
                                )}
                                {result.status === 'failed' && result.error && (
                                  <div className="text-xs text-red-600">
                                    ✗ {result.error}
                                  </div>
                                )}
                                {result.status === 'processing' && (
                                  <div className="text-xs text-blue-600">
                                    Processing...
                                  </div>
                                )}
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                result.status === 'completed' ? 'bg-green-100 text-green-800' :
                                result.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                result.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {result.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Database className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{profiles.length}</div>
                            <div className="text-sm text-gray-600">My Profiles</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Activity className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{scrapingJobs.filter(j => j.status === 'completed').length}</div>
                            <div className="text-sm text-gray-600">Completed Jobs</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Linkedin className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{commentersData.length}</div>
                            <div className="text-sm text-gray-600">Last Comments</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {currentView === 'comments' && (
                  <CommentResults
                    comments={commentersData}
                    onScrapeSelectedProfiles={handleScrapeSelectedCommenterProfiles}
                    isLoading={isScraping}
                    onBack={handleBackToForm}
                    loadingStage={loadingStage}
                    loadingProgress={loadingProgress}
                    loadingMessage={loadingMessage}
                    loadingError={loadingError}
                  />
                )}

                {currentView === 'profile-table' && (
                  <div className="space-y-6">
                    <ProfileResultsTable
                      profiles={profileDetails}
                      onViewDetails={handleViewProfileDetails}
                      onExport={handleExportProfileResults}
                      onStoreSelectedProfiles={handleStoreSelectedProfiles}
                      showActions={false}
                      showStoreOption={true}
                    />
                    
                    <div className="flex justify-center">
                      <button
                        onClick={handleBackToPrevious}
                        className="px-6 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {previousView === 'comments' ? 'Back to Comments' : 'Back to Scraper'}
                      </button>
                    </div>
                  </div>
                )}

                {currentView === 'profile-details' && (
                  <ProfileDetailsDisplay
                    profiles={profileDetails}
                    onBack={handleBackToPrevious}
                  />
                )}
              </div>
            )}

            {activeTab === 'profiles' && (
              <>
                {currentView === 'single-profile-details' ? (
                  <ProfileDetailsDisplay
                    profiles={selectedProfileForDetails ? [selectedProfileForDetails.profile_data] : []}
                    onBack={handleBackToProfilesList}
                  />
                ) : (
                  <DataTable
                    profiles={profiles}
                    onUpdateProfile={handleUpdateProfile}
                    onUpdateSelectedProfiles={handleUpdateSelectedProfiles}
                    onDeleteSelectedProfiles={handleDeleteSelectedProfiles}
                    onExport={handleExport}
                    onViewDetails={(profile) => handleViewProfileDetails(profile)}
                    isUpdating={false}
                  />
                )}
              </>
            )}

            {activeTab === 'jobs' && (
              <LocalJobsTable 
                jobs={scrapingJobs} 
                onCancelJob={(jobId) => {
                  const updatedJobs = LocalStorageService.getJobs(currentUser.id);
                  setScrapingJobs(updatedJobs);
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
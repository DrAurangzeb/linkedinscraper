import { supabase } from './supabase';
import { ImageStorageService } from '../utils/imageStorage';

// Enhanced Supabase service with many-to-many relationship support
export class SupabaseProfilesService {
  static async saveProfile(profileData: any, userId: string): Promise<boolean> {
    try {
      console.log('💾 Saving profile to Supabase for user:', userId, 'URL:', profileData.linkedinUrl);
      
      // Optimize images before saving
      let optimizedProfileData = profileData;
      try {
        console.log('🖼️ Starting image optimization...');
        optimizedProfileData = await ImageStorageService.optimizeProfileImages(
          profileData, 
          `${userId}-${Date.now()}`
        );
        console.log('✅ Image optimization completed');
      } catch (imageError) {
        console.error('❌ Image optimization failed:', imageError);
        optimizedProfileData = profileData;
      }
      
      const linkedinUrl = optimizedProfileData.linkedinUrl || optimizedProfileData.linkedin_url;
      
      // First, upsert the profile in the main table (without user_id)
      const { data: profileResult, error: profileError } = await supabase
        .from('linkedin_profiles')
        .upsert({
          linkedin_url: linkedinUrl,
          profile_data: optimizedProfileData,
          last_updated: new Date().toISOString(),
          tags: [] // Keep empty, user-specific tags go in junction table
        }, {
          onConflict: 'linkedin_url'
        })
        .select('id')
        .single();

      if (profileError) {
        console.error('❌ Error saving profile to Supabase:', profileError);
        return false;
      }

      // Then, create the user-profile relationship
      const { error: relationError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          profile_id: profileResult.id,
          added_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,profile_id'
        });

      if (relationError) {
        console.error('❌ Error creating user-profile relationship:', relationError);
        return false;
      }

      console.log('✅ Profile and relationship saved successfully for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Critical error saving profile to Supabase:', error);
      return false;
    }
  }

  static async updateProfile(profileData: any, userId: string): Promise<boolean> {
    try {
      console.log('🔄 Updating profile in Supabase for user:', userId, 'URL:', profileData.linkedinUrl);
      
      // Optimize images before updating
      let optimizedProfileData = profileData;
      try {
        console.log('🖼️ Starting image optimization for update...');
        optimizedProfileData = await ImageStorageService.optimizeProfileImages(
          profileData, 
          `${userId}-${Date.now()}`
        );
        console.log('✅ Image optimization completed for update');
      } catch (imageError) {
        console.error('❌ Image optimization failed for update:', imageError);
        optimizedProfileData = profileData;
      }
      
      const linkedinUrl = optimizedProfileData.linkedinUrl || optimizedProfileData.linkedin_url;
      
      // Update the main profile data
      const { error } = await supabase
        .from('linkedin_profiles')
        .update({
          profile_data: optimizedProfileData,
          last_updated: new Date().toISOString()
        })
        .eq('linkedin_url', linkedinUrl);

      if (error) {
        console.error('❌ Error updating profile in Supabase:', error);
        return false;
      }

      console.log('✅ Profile updated in Supabase successfully');
      return true;
    } catch (error) {
      console.error('❌ Critical error updating profile in Supabase:', error);
      return false;
    }
  }

  static async saveMultipleProfiles(profiles: any[], userId: string): Promise<number> {
    let savedCount = 0;
    
    for (const profile of profiles) {
      const success = await this.saveProfile(profile, userId);
      if (success) savedCount++;
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return savedCount;
  }

  static async getUserProfiles(userId: string): Promise<any[]> {
    try {
      console.log('🔍 Fetching profiles for user from Supabase:', userId);
      
      const { data, error } = await supabase
        .from('user_profile_details')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user profiles from Supabase:', error);
        return [];
      }

      // Transform the data to match the expected format
      const transformedData = (data || []).map(item => ({
        id: item.profile_id,
        linkedin_url: item.linkedin_url,
        profile_data: item.profile_data,
        last_updated: item.last_updated,
        created_at: item.created_at,
        tags: item.user_tags || [],
        notes: item.notes || '',
        is_favorite: item.is_favorite || false,
        added_at: item.added_at
      }));

      console.log('✅ Fetched', transformedData.length, 'profiles for user from Supabase');
      return transformedData;
    } catch (error) {
      console.error('❌ Critical error fetching user profiles from Supabase:', error);
      return [];
    }
  }

  static async checkProfileExists(linkedinUrl: string, userId?: string): Promise<any | null> {
    try {
      const cleanUrl = linkedinUrl.trim();
      
      if (userId) {
        // Check if user has access to this profile
        const { data, error } = await supabase
          .from('user_profile_details')
          .select('*')
          .eq('linkedin_url', cleanUrl)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('❌ Error checking user profile existence:', error);
          return null;
        }

        return data ? {
          id: data.profile_id,
          linkedin_url: data.linkedin_url,
          profile_data: data.profile_data,
          last_updated: data.last_updated,
          created_at: data.created_at
        } : null;
      } else {
        // Check if profile exists in the main table
        const { data, error } = await supabase
          .from('linkedin_profiles')
          .select('*')
          .eq('linkedin_url', cleanUrl)
          .maybeSingle();

        if (error) {
          console.error('❌ Error checking profile existence:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('❌ Critical error checking profile existence:', error);
      return null;
    }
  }

  static async addProfileToUser(linkedinUrl: string, userId: string, tags: string[] = []): Promise<boolean> {
    try {
      console.log('🔗 Adding existing profile to user:', userId, 'URL:', linkedinUrl);
      
      // First, get the profile ID
      const { data: profile, error: profileError } = await supabase
        .from('linkedin_profiles')
        .select('id')
        .eq('linkedin_url', linkedinUrl)
        .single();

      if (profileError || !profile) {
        console.error('❌ Profile not found:', profileError);
        return false;
      }

      // Create the user-profile relationship
      const { error: relationError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          profile_id: profile.id,
          tags: tags,
          added_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,profile_id'
        });

      if (relationError) {
        console.error('❌ Error creating user-profile relationship:', relationError);
        return false;
      }

      console.log('✅ Profile added to user successfully');
      return true;
    } catch (error) {
      console.error('❌ Critical error adding profile to user:', error);
      return false;
    }
  }

  static async removeProfileFromUser(profileId: string, userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Removing profile from user:', userId, 'Profile ID:', profileId);
      
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)
        .eq('profile_id', profileId);

      if (error) {
        console.error('❌ Error removing profile from user:', error);
        return false;
      }

      console.log('✅ Profile removed from user successfully');
      return true;
    } catch (error) {
      console.error('❌ Critical error removing profile from user:', error);
      return false;
    }
  }

  static async updateUserProfileTags(profileId: string, userId: string, tags: string[]): Promise<boolean> {
    try {
      console.log('🏷️ Updating profile tags for user:', userId, 'Profile ID:', profileId);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ tags: tags })
        .eq('user_id', userId)
        .eq('profile_id', profileId);

      if (error) {
        console.error('❌ Error updating profile tags:', error);
        return false;
      }

      console.log('✅ Profile tags updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Critical error updating profile tags:', error);
      return false;
    }
  }

  static async deleteProfiles(profileIds: string[], userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Removing profiles from user:', userId, 'IDs:', profileIds);
      
      // Remove user-profile relationships (not the actual profiles)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .in('profile_id', profileIds)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error removing profiles from user:', error);
        return false;
      }

      console.log('✅ Profiles removed from user successfully');
      return true;
    } catch (error) {
      console.error('❌ Critical error removing profiles from user:', error);
      return false;
    }
  }

  // Search for profiles that exist in the system but user doesn't have access to
  static async searchAvailableProfiles(searchTerm: string, userId: string, limit: number = 20): Promise<any[]> {
    try {
      console.log('🔍 Searching available profiles for user:', userId, 'Term:', searchTerm);
      
      const { data, error } = await supabase
        .from('linkedin_profiles')
        .select(`
          id,
          linkedin_url,
          profile_data,
          last_updated,
          created_at
        `)
        .not('id', 'in', `(
          SELECT profile_id 
          FROM user_profiles 
          WHERE user_id = '${userId}'
        )`)
        .or(`
          profile_data->'fullName' ILIKE '%${searchTerm}%',
          profile_data->'headline' ILIKE '%${searchTerm}%',
          profile_data->'companyName' ILIKE '%${searchTerm}%'
        `)
        .limit(limit);

      if (error) {
        console.error('❌ Error searching available profiles:', error);
        return [];
      }

      console.log('✅ Found', data?.length || 0, 'available profiles');
      return data || [];
    } catch (error) {
      console.error('❌ Critical error searching available profiles:', error);
      return [];
    }
  }
}
export interface ApifyRunResponse {
  data: {
    id: string;
    defaultDatasetId: string;
    status: string;
  };
}

export interface LinkedInComment {
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

// Enhanced fetch function with retry logic for Apify API calls
async function apifyFetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔍 Apify API call attempt ${i + 1}/${retries}:`, url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
      
      const startTime = Date.now();
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      console.log(`⏱️ Apify API call took ${endTime - startTime}ms`);
      
      if (response.ok) {
        console.log('✅ Apify API call successful');
        return response;
      }
      
      console.error(`❌ Apify API error ${response.status}: ${response.statusText}`);
      
      // Check if it's a quota/limit error
      if (response.status === 402 || response.status === 429) {
        const errorText = await response.text();
        if (errorText.includes('quota') || errorText.includes('limit') || errorText.includes('usage')) {
          throw new Error('QUOTA_EXCEEDED');
        }
      }
      
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Apify API error ${response.status}: ${response.statusText}`);
      }
      
      if (i === retries - 1) {
        throw new Error(`Apify API error ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error(`❌ Apify API call attempt ${i + 1} failed:`, error);
      
      if (error instanceof Error) {
        if (error.message === 'QUOTA_EXCEEDED') {
          throw error; // Don't retry quota errors
        }
        if (error.name === 'AbortError') {
          if (i === retries - 1) {
            throw new Error(`Apify API request timeout. The service may be slow to respond. Please try again.`);
          }
        } else if (error.message.includes('Failed to fetch')) {
          if (i === retries - 1) {
            throw new Error(`Cannot reach Apify API. Please check your internet connection and try again.`);
          }
        } else {
          throw error;
        }
      }
      
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error('Max retries exceeded for Apify API call');
}

export class ApifyService {
  private apiKeys: string[];
  private currentKeyIndex: number;
  private keyUsageStats: Map<string, { used: number; failed: number; lastUsed: Date }>;
  private _combinedResults?: any[];

  constructor(apiKeys: string | string[]) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    this.currentKeyIndex = 0;
    this.keyUsageStats = new Map();
    
    // Initialize usage stats for all keys
    this.apiKeys.forEach(key => {
      this.keyUsageStats.set(key, { used: 0, failed: 0, lastUsed: new Date() });
    });
    
    console.log(`🔑 ApifyService constructor called`);
    console.log(`🔑 Initialized ApifyService with ${this.apiKeys.length} API key(s):`, this.apiKeys.map(k => k.substring(0, 10) + '...'));
    console.log(`🔑 Initial key index: ${this.currentKeyIndex}`);
    console.log(`🔑 Usage stats initialized:`, Object.fromEntries(this.keyUsageStats));
  }

  private getCurrentApiKey(): string {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    console.log(`🔑 getCurrentApiKey() returning key ${this.currentKeyIndex + 1}/${this.apiKeys.length}: ${currentKey.substring(0, 10)}...`);
    return currentKey;
  }

  private switchToNextApiKey(): boolean {
    const originalIndex = this.currentKeyIndex;
    
    // Try to find the next working key
    do {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      const currentKey = this.getCurrentApiKey();
      const stats = this.keyUsageStats.get(currentKey);
      
      console.log(`🔄 Switching to API key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`);
      console.log(`📊 Key stats:`, stats);
      
      // If we've cycled through all keys, return false
      if (this.currentKeyIndex === originalIndex) {
        console.error('❌ All API keys have been exhausted or failed');
        return false;
      }
      
      return true;
    } while (this.currentKeyIndex !== originalIndex);
    
    return false;
  }

  private updateKeyStats(apiKey: string, success: boolean): void {
    const stats = this.keyUsageStats.get(apiKey);
    if (stats) {
      stats.lastUsed = new Date();
      if (success) {
        stats.used++;
      } else {
        stats.failed++;
      }
      this.keyUsageStats.set(apiKey, stats);
    }
  }

  private async makeApifyRequest(url: string, options: RequestInit = {}, canSwitchKey: boolean = true): Promise<Response> {
    const currentKey = this.getCurrentApiKey();
    console.log(`🌐 makeApifyRequest called:`, {
      url,
      method: options.method || 'GET',
      currentKeyIndex: this.currentKeyIndex,
      canSwitchKey,
      keyPreview: currentKey.substring(0, 10) + '...'
    });
    
    try {
      console.log(`📡 Making HTTP request to Apify API...`);
      const response = await apifyFetchWithRetry(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${currentKey}`,
        },
      });
      
      console.log(`✅ Apify API request successful:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      this.updateKeyStats(currentKey, true);
      return response;
      
    } catch (error) {
      console.error(`❌ Apify API request failed:`, {
        error: error instanceof Error ? error.message : error,
        currentKeyIndex: this.currentKeyIndex,
        canSwitchKey
      });
      
      this.updateKeyStats(currentKey, false);
      
      if (error instanceof Error && error.message === 'QUOTA_EXCEEDED' && canSwitchKey) {
        console.warn(`⚠️ API key ${this.currentKeyIndex + 1} quota exceeded, attempting to switch to next key...`);
        
        if (this.switchToNextApiKey()) {
          console.log(`🔄 Successfully switched to new key, retrying request...`);
          return this.makeApifyRequest(url, options, false); // Don't switch again on retry
        } else {
          console.error(`❌ All API keys exhausted`);
          throw new Error('All API keys have reached their quota limits. Please wait for quota reset or add more API keys.');
        }
      }
      
      console.error(`❌ Re-throwing error from makeApifyRequest`);
      throw error;
    }
  }

  async scrapePostComments(postUrl: string): Promise<string> {
    try {
      console.log('🔍 Starting post comments scraping for:', postUrl);
      console.log(`🔑 Using API key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`);
      
      const response = await this.makeApifyRequest(`https://api.apify.com/v2/acts/ZI6ykbLlGS3APaPE8/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          posts: [postUrl]
        }),
      });

      const result: ApifyRunResponse = await response.json();
      console.log('✅ Post comments scraping started, run ID:', result.data.id);
      
      await this.waitForRunCompletion(result.data.id);
      
      console.log('✅ Post comments scraping completed, dataset ID:', result.data.defaultDatasetId);
      return result.data.defaultDatasetId;
    } catch (error) {
      console.error('❌ Error scraping post comments:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to scrape post comments: ${error.message}`);
      }
      throw new Error('Failed to scrape post comments: Unknown error');
    }
  }

  async scrapeProfiles(profileUrls: string[], onProgress?: (current: number, total: number) => void): Promise<string> {
    console.log('🚀 ApifyService.scrapeProfiles called');
    console.log('📋 Input parameters:', {
      profileUrlsCount: profileUrls.length,
      profileUrls: profileUrls,
      hasOnProgress: !!onProgress,
      currentKeyIndex: this.currentKeyIndex,
      totalKeys: this.apiKeys.length
    });
    
    try {
      console.log('🔍 Starting profile scraping for', profileUrls.length, 'profiles');
      
      // Optimized batch size for better performance and quota management
      const BATCH_SIZE = 25; // Reduced for better quota management
      const batches = [];
      
      for (let i = 0; i < profileUrls.length; i += BATCH_SIZE) {
        batches.push(profileUrls.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Created ${batches.length} batches from ${profileUrls.length} profiles (batch size: ${BATCH_SIZE})`);
      console.log(`📦 Batches:`, batches.map((batch, i) => `Batch ${i + 1}: ${batch.length} URLs`));
      
      const allResults: any[] = [];
      let processedProfiles = 0;
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`🔄 Starting batch ${batchIndex + 1}/${batches.length}`);
        console.log(`📋 Batch ${batchIndex + 1} details:`, {
          batchSize: batch.length,
          urls: batch,
          currentKeyIndex: this.currentKeyIndex,
          processedSoFar: processedProfiles
        });
        
        if (onProgress) {
          console.log(`📊 Calling onProgress(${processedProfiles}, ${profileUrls.length})`);
          onProgress(processedProfiles, profileUrls.length);
        }
        
        try {
          console.log(`🌐 About to make Apify API request for batch ${batchIndex + 1}`);
          console.log(`🔑 Current API key: ${this.getCurrentApiKey().substring(0, 10)}...`);
          
          const response = await this.makeApifyRequest(`https://api.apify.com/v2/acts/2SyF0bVxmgGr8IVCZ/runs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profileUrls: batch
            }),
          });

          console.log(`✅ Apify API request successful for batch ${batchIndex + 1}`);
          const result: ApifyRunResponse = await response.json();
          console.log(`✅ Batch ${batchIndex + 1} response:`, {
            runId: result.data.id,
            datasetId: result.data.defaultDatasetId,
            status: result.data.status
          });
          
          console.log(`⏳ Waiting for batch ${batchIndex + 1} completion...`);
          await this.waitForRunCompletion(result.data.id);
          console.log(`✅ Batch ${batchIndex + 1} run completed`);
          
          console.log(`📥 Fetching data for batch ${batchIndex + 1}...`);
          const batchData = await this.getDatasetItems(result.data.defaultDatasetId);
          console.log(`📥 Batch ${batchIndex + 1} data retrieved:`, {
            itemCount: batchData.length,
            sampleItem: batchData[0] ? Object.keys(batchData[0]) : 'No items'
          });
          
          allResults.push(...batchData);
          processedProfiles += batch.length;
          
          console.log(`✅ Batch ${batchIndex + 1} completed successfully:`, {
            profilesReturned: batchData.length,
            totalProcessed: processedProfiles,
            totalResults: allResults.length
          });
          
          if (onProgress) {
            console.log(`📊 Calling onProgress(${processedProfiles}, ${profileUrls.length}) after batch completion`);
            onProgress(processedProfiles, profileUrls.length);
          }
          
          // Delay between batches to avoid overwhelming the API and manage quotas
          if (batchIndex < batches.length - 1) {
            const delay = 3000; // 3 seconds between batches
            console.log(`⏳ Waiting ${delay}ms before processing batch ${batchIndex + 2}...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (error) {
          console.error(`❌ Error processing batch ${batchIndex + 1}:`, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : 'No stack',
            batchUrls: batch
          });
          
          if (error instanceof Error && error.message.includes('quota')) {
            console.log(`⚠️ Quota issue detected for batch ${batchIndex + 1}, continuing with remaining batches...`);
            continue; // Skip this batch and continue with next
          }
          
          console.error(`❌ Re-throwing error for batch ${batchIndex + 1}`);
          throw error;
        }
      }
      
      console.log(`🎉 All batches completed successfully!`);
      console.log(`📊 Final results:`, {
        totalProfilesScraped: allResults.length,
        totalBatchesProcessed: batches.length,
        finalKeyUsageStats: Object.fromEntries(this.keyUsageStats)
      });
      
      // Create a combined dataset ID
      const mockDatasetId = `combined-${Date.now()}`;
      console.log(`💾 Storing combined results with dataset ID: ${mockDatasetId}`);
      this._combinedResults = allResults;
      
      return mockDatasetId;
    } catch (error) {
      console.error('❌ ApifyService.scrapeProfiles failed:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : 'No stack',
        inputUrls: profileUrls
      });
      if (error instanceof Error) {
        throw new Error(`Failed to scrape profiles: ${error.message}`);
      }
      throw new Error('Failed to scrape profiles: Unknown error');
    }
  }

  async waitForRunCompletion(runId: string): Promise<void> {
    const maxWaitTime = 15 * 60 * 1000; // 15 minutes
    const pollInterval = 8000; // 8 seconds
    const startTime = Date.now();

    console.log('⏳ Waiting for Apify run completion:', runId);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.checkRunStatus(runId);
        console.log('📊 Run status:', status);
        
        if (status === 'SUCCEEDED') {
          console.log('✅ Apify run completed successfully');
          return;
        } else if (status === 'FAILED' || status === 'ABORTED') {
          throw new Error(`Apify run ${status.toLowerCase()}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('❌ Error checking run status:', error);
        if (Date.now() - startTime >= maxWaitTime - pollInterval) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error('Apify run timed out after 15 minutes');
  }

  async getDatasetItems(datasetId: string): Promise<any[]> {
    console.log(`📥 getDatasetItems called with dataset ID: ${datasetId}`);
    
    try {
      // Handle combined results from batch processing
      if (datasetId.startsWith('combined-') && this._combinedResults) {
        const results = this._combinedResults;
        console.log(`✅ Returning ${results.length} combined dataset items from memory`);
        return results;
      }
      
      console.log(`🌐 Fetching dataset items from Apify API for dataset: ${datasetId}`);
      const response = await this.makeApifyRequest(`https://api.apify.com/v2/datasets/${datasetId}/items`);

      const data = await response.json();
      console.log(`✅ Retrieved ${data?.length || 0} dataset items from Apify API`);
      console.log(`📋 Sample dataset item:`, data?.[0] ? Object.keys(data[0]) : 'No items');
      return data || [];
    } catch (error) {
      console.error(`❌ getDatasetItems failed:`, {
        datasetId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      if (error instanceof Error) {
        throw new Error(`Failed to fetch dataset items: ${error.message}`);
      }
      throw new Error('Failed to fetch dataset items: Unknown error');
    }
  }

  async checkRunStatus(runId: string): Promise<string> {
    try {
      const response = await this.makeApifyRequest(`https://api.apify.com/v2/actor-runs/${runId}`);

      const result = await response.json();
      return result.data.status;
    } catch (error) {
      console.error('❌ Error checking run status:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to check run status: ${error.message}`);
      }
      throw new Error('Failed to check run status: Unknown error');
    }
  }

  // Get current API key usage statistics
  getUsageStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.keyUsageStats.forEach((value, key) => {
      const keyIndex = this.apiKeys.indexOf(key) + 1;
      stats[`Key ${keyIndex}`] = {
        ...value,
        isActive: key === this.getCurrentApiKey()
      };
    });
    return stats;
  }

  // Manually switch to next API key
  forceKeySwitch(): boolean {
    return this.switchToNextApiKey();
  }
}

// Updated factory function to support multiple API keys
export const createApifyService = (apiKeys: string | string[]) => new ApifyService(apiKeys);
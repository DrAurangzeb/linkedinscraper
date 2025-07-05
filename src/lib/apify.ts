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
      const timeoutId = setTimeout(() => controller.abort(), 120000); // Increased to 2 minutes
      
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
      
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Apify API error ${response.status}: ${response.statusText}`);
      }
      
      if (i === retries - 1) {
        throw new Error(`Apify API error ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error(`❌ Apify API call attempt ${i + 1} failed:`, error);
      
      if (error instanceof Error) {
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

export const createApifyService = (apiKey: string) => ({
  async scrapePostComments(postUrl: string): Promise<string> {
    try {
      console.log('🔍 Starting post comments scraping for:', postUrl);
      
      const response = await apifyFetchWithRetry(`https://api.apify.com/v2/acts/ZI6ykbLlGS3APaPE8/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
  },

  async scrapeProfiles(profileUrls: string[], onProgress?: (current: number, total: number) => void): Promise<string> {
    try {
      console.log('🔍 Starting profile scraping for', profileUrls.length, 'profiles');
      
      // For large batches, process in smaller chunks to avoid timeouts
      const BATCH_SIZE = 50; // Reduced batch size
      const batches = [];
      
      for (let i = 0; i < profileUrls.length; i += BATCH_SIZE) {
        batches.push(profileUrls.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Processing ${profileUrls.length} profiles in ${batches.length} batches of ${BATCH_SIZE}`);
      
      const allResults: any[] = [];
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} profiles)`);
        
        if (onProgress) {
          onProgress(batchIndex * BATCH_SIZE, profileUrls.length);
        }
        
        const response = await apifyFetchWithRetry(`https://api.apify.com/v2/acts/2SyF0bVxmgGr8IVCZ/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileUrls: batch
          }),
        });

        const result: ApifyRunResponse = await response.json();
        console.log(`✅ Batch ${batchIndex + 1} scraping started, run ID:`, result.data.id);
        
        await this.waitForRunCompletion(result.data.id);
        
        const batchData = await this.getDatasetItems(result.data.defaultDatasetId);
        allResults.push(...batchData);
        
        console.log(`✅ Batch ${batchIndex + 1} completed with ${batchData.length} profiles`);
        
        // Small delay between batches to avoid overwhelming the API
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (onProgress) {
        onProgress(profileUrls.length, profileUrls.length);
      }
      
      // Create a combined dataset (this is a simplified approach)
      // In a real implementation, you might want to create a new dataset and upload the combined results
      console.log(`✅ All batches completed. Total profiles scraped: ${allResults.length}`);
      
      // For now, we'll return a mock dataset ID and store results in memory
      // In production, you'd want to properly handle this
      const mockDatasetId = `combined-${Date.now()}`;
      (this as any)._combinedResults = allResults;
      
      return mockDatasetId;
    } catch (error) {
      console.error('❌ Error scraping profiles:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to scrape profiles: ${error.message}`);
      }
      throw new Error('Failed to scrape profiles: Unknown error');
    }
  },

  async waitForRunCompletion(runId: string): Promise<void> {
    const maxWaitTime = 20 * 60 * 1000; // Increased to 20 minutes
    const pollInterval = 10000; // Increased to 10 seconds
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
    
    throw new Error('Apify run timed out after 20 minutes');
  },

  async getDatasetItems(datasetId: string): Promise<any[]> {
    try {
      console.log('🔍 Fetching dataset items for:', datasetId);
      
      // Handle combined results from batch processing
      if (datasetId.startsWith('combined-') && (this as any)._combinedResults) {
        const results = (this as any)._combinedResults;
        console.log('✅ Retrieved', results.length, 'combined dataset items');
        return results;
      }
      
      const response = await apifyFetchWithRetry(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const data = await response.json();
      console.log('✅ Retrieved', data?.length || 0, 'dataset items');
      return data;
    } catch (error) {
      console.error('❌ Error fetching dataset items:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch dataset items: ${error.message}`);
      }
      throw new Error('Failed to fetch dataset items: Unknown error');
    }
  },

  async checkRunStatus(runId: string): Promise<string> {
    try {
      const response = await apifyFetchWithRetry(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

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
});
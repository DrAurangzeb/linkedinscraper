// Types
interface ApifyRunResponse {
  data: {
    id: string;
    defaultDatasetId: string;
  };
}

// Placeholder function - needs proper implementation
async function apifyFetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  return fetch(url, options);
}

export class ApifyService {
  private apiKey: string;
  private _combinedResults?: any[];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

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
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileUrls: batch
          }),
        });

        const result: ApifyRunResponse = await response.json();
        // Added the requested log
        console.log('Apify run initiated. Run ID:', result.data.id, 'Default Dataset ID:', result.data.defaultDatasetId);
        
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
      
      console.log(`✅ All batches completed. Total profiles scraped: ${allResults.length}`);
      
      const mockDatasetId = `combined-${Date.now()}`;
      this._combinedResults = allResults;
      
      return mockDatasetId;
    } catch (error) {
      console.error('❌ Error scraping profiles:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to scrape profiles: ${error.message}`);
      }
      throw new Error('Failed to scrape profiles: Unknown error');
    }
  }

  async getDatasetItems(datasetId: string): Promise<any[]> {
    try {
      console.log('🔍 Fetching dataset items for:', datasetId);
      
      if (datasetId.startsWith('combined-') && this._combinedResults) {
        const results = this._combinedResults;
        console.log('✅ Retrieved', results.length, 'combined dataset items');
        return results;
      }
      
      const response = await apifyFetchWithRetry(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      // Added the requested log
      console.log('Raw data from Apify dataset items:', data);  
      
      console.log('✅ Retrieved', data?.length || 0, 'dataset items');
      return data;
    } catch (error) {
      console.error('❌ Error fetching dataset items:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch dataset items: ${error.message}`);
      }
      throw new Error('Failed to fetch dataset items: Unknown error');
    }
  }

  // Placeholder method - needs proper implementation
  private async waitForRunCompletion(runId: string): Promise<void> {
    // Mock implementation - would need to poll Apify API for run status
    console.log('Waiting for run completion:', runId);
  }

  // Placeholder method - needs proper implementation
  async scrapePostComments(): Promise<any> {
    // Mock implementation
    console.log('Scraping post comments - not implemented');
    return [];
  }
}

// Factory function to create ApifyService instance
export function createApifyService(apiKey: string): ApifyService {
  return new ApifyService(apiKey);
}
import { config } from '@/lib/config';

class ApiService {
  private getAuthHeaders(jwt?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    
    return headers;
  }

  private getApiUrl(): string {
    return config.api.baseUrl;
  }

  async authenticatedFetch(
    endpoint: string, 
    options: RequestInit = {}, 
    jwt?: string | null
  ): Promise<Response> {
    const url = `${this.getApiUrl()}${endpoint}`;
    
    console.log(`🔐 JWT for request:`, jwt ? 'Present' : 'Missing');
    if (jwt) {
      console.log(`🔑 JWT preview:`, jwt.substring(0, 50) + '...');
    }
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(jwt),
        ...options.headers,
      },
    };

    console.log(`Making authenticated request to: ${url}`);
    console.log(`📤 Request headers:`, JSON.stringify(config.headers, null, 2));
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`API Error [${response.status}]: ${errorText}`);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  // Research API methods
  async createResearch(data: any, jwt: string): Promise<any> {
    const response = await this.authenticatedFetch('/api/research/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }, jwt);
    
    return response.json();
  }

  async createResearchVersion(researchId: string, data: any, jwt: string): Promise<any> {
    const response = await this.authenticatedFetch(`/api/research/${researchId}/version`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, jwt);
    
    return response.json();
  }

  async getResearchVersions(researchId: string, jwt: string): Promise<any> {
    const response = await this.authenticatedFetch(`/api/research/${researchId}/versions`, {
      method: 'GET',
    }, jwt);
    
    return response.json();
  }

  async acquireLock(researchId: string, jwt: string): Promise<any> {
    const response = await this.authenticatedFetch(`/api/research/${researchId}/lock`, {
      method: 'POST',
    }, jwt);
    
    return response.json();
  }

  async releaseLock(researchId: string, jwt: string): Promise<any> {
    const response = await this.authenticatedFetch(`/api/research/${researchId}/lock`, {
      method: 'DELETE',
    }, jwt);
    
    return response.json();
  }

  // SEC Filing API
  async parseSecFiling(data: { ticker: string; formType: string; year: string }, jwt?: string): Promise<any> {
    const response = await this.authenticatedFetch('/api/sec-filing', {
      method: 'POST',
      body: JSON.stringify(data),
    }, jwt);
    
    return response.json();
  }

  // Corporate Events API - These endpoints don't require authentication
  async getHistoricalAnalysis(ticker: string, year: number, quarter: number, jwt?: string): Promise<any> {
    // Don't send auth headers for historical analysis - endpoint doesn't require auth
    const response = await fetch(
      `${this.getApiUrl()}/api/historical?ticker=${ticker}&year=${year}&quarter=${quarter}`, 
      { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Historical analysis failed [${response.status}]: ${errorText}`);
      throw new Error(`Historical analysis failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async transcribeAudio(formData: FormData, jwt?: string): Promise<any> {
    // Don't send auth headers for transcription - endpoint doesn't require auth
    const url = `${this.getApiUrl()}/api/transcribe`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // Don't set Content-Type for FormData
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Audio transcription failed [${response.status}]: ${errorText}`);
      throw new Error(`Audio transcription failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async analyzeBulk(data: { tickers: string[]; year: number; quarter: number }, jwt?: string): Promise<any> {
    // Don't send auth headers for bulk analysis - endpoint doesn't require auth
    const response = await fetch(`${this.getApiUrl()}/api/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Bulk analysis failed [${response.status}]: ${errorText}`);
      throw new Error(`Bulk analysis failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // File upload
  async uploadFile(file: File, jwt?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${this.getApiUrl()}/api/upload`;
    
    console.log('📤 Uploading file to:', url);
    console.log('📄 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Don't send auth headers for file upload - endpoint doesn't require auth
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    console.log('📥 Upload response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `File upload failed: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (e2) {
          // Use default message
        }
      }
      console.error('❌ File upload error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('✅ File uploaded successfully:', data.url);
    return data.url;
  }
}

export const apiService = new ApiService(); 
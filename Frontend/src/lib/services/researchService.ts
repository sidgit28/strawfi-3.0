import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { config } from '@/lib/config';
export interface ResearchItem {
  id: string;
  title: string;
  type: string;
  content: string;
  tags: string[];
  insights: string[];
  confidence: number;
  created_at: string;
  updated_at: string;
  collaborators: string[];
  last_updated_by: string;
}

export const researchService = {
 async getResearchItems() {
  const jwt = localStorage.getItem('jwt');

  const response = await fetch(`${config.api.baseUrl}/api/research`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      '❌ Failed to fetch research:',
      response.status,
      errorText
    );

    throw new Error(`Failed to fetch research items (${response.status})`);
  }

  const data = await response.json();

  console.log('📚 Research items received:', data);

  return data.data || [];
},
 async createResearchItem(item: Partial<ResearchItem>) {
  const jwt = localStorage.getItem('jwt');

  const response = await fetch('/api/research/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      '❌ Failed to create research:',
      response.status,
      errorText
    );
    throw new Error(`Failed to create research item (${response.status})`);
  }

  const data = await response.json();

  console.log('✅ Research created:', data);

  return data;
},

  async semanticSearch(query: string, filters?: any) {
    const response = await fetch(`/api/research/search?query=${encodeURIComponent(query)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters }),
    });
    if (!response.ok) {
      throw new Error('Failed to perform semantic search');
    }
    return response.json();
  },

  async getTrendingTopics(limit = 5) {
    const response = await fetch(`/api/research/trending?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trending topics');
    }
    return response.json();
  },
};
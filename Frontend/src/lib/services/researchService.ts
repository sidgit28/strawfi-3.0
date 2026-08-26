import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
    const response = await fetch('/api/research/items');
    if (!response.ok) {
      throw new Error('Failed to fetch research items');
    }
    const data = await response.json();
    return data.items;
  },

  async createResearchItem(item: Partial<ResearchItem>) {
    const response = await fetch('/api/research/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Failed to create research item');
    }
    return response.json();
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
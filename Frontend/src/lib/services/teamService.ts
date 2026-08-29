import { config } from '@/lib/config';

const API_BASE_URL = config.api.baseUrl;

export interface TeamLoginRequest {
  team_id: string;
  password: string;
}

export interface TeamCreateRequest {
  team_id: string;
  team_name: string;
  password: string;
}

export interface TeamLoginResponse {
  token: string;
  team_id: string;
  team_name: string;
}

export interface TeamCreateResponse {
  success: boolean;
  team_id: string;
  team_name: string;
}

export const teamService = {
  async login(credentials: TeamLoginRequest): Promise<TeamLoginResponse> {
    console.log('🔐 Team login request:', { team_id: credentials.team_id });
    console.log('📡 API URL:', `${API_BASE_URL}/api/team-login`);
    
    const response = await fetch(`${API_BASE_URL}/api/team-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Team login failed:', error);
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

console.log('✅ Team login response:', data);

if (data.token) {
  localStorage.setItem('teamJwt', data.token);
  localStorage.setItem('teamId', data.team_id);
  localStorage.setItem('teamName', data.team_name);

  console.log('✅ Team JWT saved successfully');
}

return data;
  },

  async createTeam(teamData: TeamCreateRequest): Promise<TeamCreateResponse> {
    console.log('🏗️ Team creation request:', { team_id: teamData.team_id, team_name: teamData.team_name });
    console.log('📡 API URL:', `${API_BASE_URL}/api/team-create`);
    
    const response = await fetch(`${API_BASE_URL}/api/team-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Team creation failed:', error);
      throw new Error(error.error || 'Failed to create team');
    }

    const data = await response.json();
    console.log('✅ Team creation response:', data);
    return data;
  },

  async checkTeamsExist(): Promise<{ exists: boolean }> {
    console.log('🔍 Checking if teams exist...');
    console.log('📡 API URL:', `${API_BASE_URL}/api/teams-exist`);
    
    const response = await fetch(`${API_BASE_URL}/api/teams-exist`);
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Teams exist check failed');
      throw new Error('Failed to check if teams exist');
    }

    const data = await response.json();
    console.log('✅ Teams exist response:', data);
    return data;
  },
}; 
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Brain, 
  Users, 
  FileText, 
  TrendingUp, 
  Clock, 
  Filter, 
  Plus, 
  Star, 
  MessageCircle, 
  Eye,
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Target,
  Lightbulb,
  Archive,
  Tag,
  Calendar,
  User,
  Bell,
  Settings,
  Activity,
  ExternalLink
} from 'lucide-react';
import CreateResearchModal from './research/create-research-modal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { apiService } from '@/lib/services/apiService';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

interface KnowledgeRepositoryProps {
  user: User;
}

const KnowledgeRepository: React.FC<KnowledgeRepositoryProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState(['All']);
  const [notifications, setNotifications] = useState(3);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [researchItems, setResearchItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        // Get user's full name from your user profile table
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          setUserName(profile.full_name);
          // Generate initials from full name
          const initials = profile.full_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
          setUserInitials(initials);
        }
      }
    };

    fetchUserInfo();
  }, []);

  // Mock data
  const researchMemories = [
    {
      id: 1,
      title: 'Tesla Q3 2024 Analysis',
      type: 'Company Research',
      lastUpdated: '2 hours ago',
      confidence: 92,
      tags: ['TSLA', 'EV', 'Growth'],
      insights: 15,
      collaborators: ['Sarah Chen', 'Mike Rodriguez']
    },
    {
      id: 2,
      title: 'Fed Rate Decision Impact',
      type: 'Macro Analysis',
      lastUpdated: '1 day ago',
      confidence: 88,
      tags: ['Fed', 'Rates', 'Fixed Income'],
      insights: 23,
      collaborators: ['David Kim', 'Lisa Wang']
    },
    {
      id: 3,
      title: 'Renewable Energy Sector Thesis',
      type: 'Sector Analysis',
      lastUpdated: '3 days ago',
      confidence: 95,
      tags: ['Clean Energy', 'ESG', 'Long-term'],
      insights: 31,
      collaborators: ['Emma Johnson', 'Alex Turner']
    }
  ];

  const investmentTheses = [
    {
      id: 1,
      name: 'AI Infrastructure Play',
      status: 'Active',
      conviction: 'High',
      allocation: '$2.5M',
      performance: '+18.2%',
      lastReview: '1 week ago',
      keyStocks: ['NVDA', 'AMD', 'AVGO']
    },
    {
      id: 2,
      name: 'Value Recovery Bet',
      status: 'Under Review',
      conviction: 'Medium',
      allocation: '$1.8M',
      performance: '+5.7%',
      lastReview: '3 days ago',
      keyStocks: ['JPM', 'BAC', 'WFC']
    }
  ];

  const auditTrail = [
    {
      id: 1,
      action: 'Investment Decision',
      details: 'Increased NVDA position by 2%',
      analyst: 'Sarah Chen',
      timestamp: '2024-05-30 14:30',
      rationale: 'Strong Q1 earnings and AI demand outlook',
      impact: 'High'
    },
    {
      id: 2,
      action: 'Research Update',
      details: 'Updated Tesla price target to $200',
      analyst: 'Mike Rodriguez',
      timestamp: '2024-05-30 11:15',
      rationale: 'Revised production estimates post earnings call',
      impact: 'Medium'
    }
  ];

  const Sidebar = () => (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">InvestIQ</h1>
        <p className="text-sm text-slate-400 mt-1">Knowledge Repository</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <BarChart3 size={20} />
          <span>Dashboard</span>
        </button>
        <Link href="/research-memory" legacyBehavior>
          <a className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-slate-300 hover:bg-slate-800">
            <Brain size={20} />
            <span>Research Memory</span>
          </a>
        </Link>
        <button
          onClick={() => setActiveTab('collaboration')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'collaboration' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <Users size={20} />
          <span>Collaboration</span>
        </button>
        <button
          onClick={() => setActiveTab('retrieval')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'retrieval' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <Search size={20} />
          <span>Smart Search</span>
        </button>
        <button
          onClick={() => setActiveTab('thesis')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'thesis' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <Target size={20} />
          <span>Investment Thesis</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <FileText size={20} />
          <span>Decision Audit</span>
        </button>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">{userInitials}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-slate-400">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <div className="bg-white border-b border-slate-200 p-4 ml-64">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'memory' && 'Persistent Research Memory'}
            {activeTab === 'collaboration' && 'Collaborative Intelligence'}
            {activeTab === 'retrieval' && 'Smart Retrieval System'}
            {activeTab === 'thesis' && 'Investment Thesis Tracking'}
            {activeTab === 'audit' && 'Decision Audit Trail'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search across all knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="relative">
            <Bell className="text-slate-600 hover:text-blue-600 cursor-pointer" size={24} />
            {notifications > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </div>
          
          <Settings className="text-slate-600 hover:text-blue-600 cursor-pointer" size={24} />
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Research Items</p>
                <p className="text-3xl font-bold">2,847</p>
              </div>
              <Brain className="text-blue-200" size={32} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Collaborations</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <Users className="text-green-200" size={32} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Investment Theses</p>
                <p className="text-3xl font-bold">8</p>
              </div>
              <Target className="text-purple-200" size={32} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2 text-blue-600" size={20} />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {auditTrail.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{item.action}</p>
                  <p className="text-sm text-slate-600">{item.details}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                    <span>{item.analyst}</span>
                    <span>{item.timestamp}</span>
                    <span className={`px-2 py-1 rounded ${
                      item.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.impact} Impact
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Lightbulb className="mr-2 text-yellow-600" size={20} />
            AI Insights
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">High correlation detected between your Tesla research and recent EV sector moves</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">3 team members researching similar Fed policy impacts - suggest collaboration</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">Your AI Infrastructure thesis aligns with 5 recent market developments</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-2 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <Plus className="text-blue-600" size={16} />
              <span>New Research Note</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <Users className="text-green-600" size={16} />
              <span>Start Collaboration</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <Target className="text-purple-600" size={16} />
              <span>Create Investment Thesis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Collaboration = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="mr-2 text-blue-600" size={20} />
            Active Collaborations
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  SC
                </div>
                <div>
                  <p className="font-medium text-slate-800">Sarah Chen</p>
                  <p className="text-sm text-slate-600">Working on Tesla Analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-sm text-green-600">Online</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                  MR
                </div>
                <div>
                  <p className="font-medium text-slate-800">Mike Rodriguez</p>
                  <p className="text-sm text-slate-600">Fed Rate Decision Impact</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="text-sm text-yellow-600">Away</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">Team Intelligence Feed</h3>
          <div className="space-y-4">
            <div className="flex space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600 mt-1" size={16} />
              <div>
                <p className="text-sm"><strong>Sarah Chen</strong> validated your Tesla production estimates</p>
                <p className="text-xs text-slate-500">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Lightbulb className="text-blue-600 mt-1" size={16} />
              <div>
                <p className="text-sm"><strong>AI Assistant</strong> suggests connecting Fed analysis with your banking thesis</p>
                <p className="text-xs text-slate-500">15 minutes ago</p>
              </div>
            </div>
            
            <div className="flex space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <MessageCircle className="text-purple-600 mt-1" size={16} />
              <div>
                <p className="text-sm"><strong>David Kim</strong> added insights to renewable energy sector analysis</p>
                <p className="text-xs text-slate-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">Team Members</h3>
          <div className="space-y-3">
            {['Sarah Chen', 'Mike Rodriguez', 'David Kim', 'Lisa Wang', 'Emma Johnson'].map((name, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${idx < 2 ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                  <span className="text-xs text-slate-500">{idx < 2 ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">Collaboration Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Knowledge Sharing</span>
                <span>92%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cross-validation</span>
                <span>78%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Team Alignment</span>
                <span>85%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SmartRetrieval = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Ask anything about your research... (e.g., 'What are the key risks for Tesla in Q4?')"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
            Search
          </button>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <span className="text-sm text-slate-600">Suggested queries:</span>
          {['EV market trends', 'Fed rate impact on REITs', 'AI chip demand'].map(query => (
            <button key={query} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-slate-200">
              {query}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold">AI Analysis Results</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    AI
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 mb-2">
                      Based on your research, here are the key Tesla risks for Q4 2024:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1 ml-4">
                      <li>• Production capacity constraints in Shanghai (Confidence: 92%)</li>
                      <li>• Increased competition from BYD and other Chinese EV makers (Confidence: 88%)</li>
                      <li>• Potential impact of reduced EV incentives (Confidence: 75%)</li>
                    </ul>
                    <div className="flex space-x-2 mt-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Production</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Competition</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Policy</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="text-slate-600" size={16} />
                    <span className="font-medium text-slate-800">Tesla Q3 Analysis</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">Production guidance revision highlights capacity constraints...</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Relevance: 95%</span>
                    <span>2 hours ago</span>
                  </div>
                </div>
                
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="text-slate-600" size={16} />
                    <span className="font-medium text-slate-800">EV Market Dynamics</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">Chinese EV manufacturers gaining market share rapidly...</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Relevance: 87%</span>
                    <span>1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <h4 className="font-semibold mb-3">Search Filters</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Content Type</label>
                <select className="w-full p-2 border border-slate-300 rounded text-sm">
                  <option>All Types</option>
                  <option>Research Notes</option>
                  <option>Market Analysis</option>
                  <option>Investment Thesis</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Time Range</label>
                <select className="w-full p-2 border border-slate-300 rounded text-sm">
                  <option>All Time</option>
                  <option>Past Week</option>
                  <option>Past Month</option>
                  <option>Past Quarter</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Confidence</label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">50%</span>
                  <input type="range" min="50" max="100" className="flex-1" />
                  <span className="text-xs">100%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <h4 className="font-semibold mb-3">Related Topics</h4>
            <div className="space-y-2">
              {['Electric Vehicles', 'Automotive Industry', 'Clean Energy', 'Chinese Markets', 'Manufacturing'].map(topic => (
                <button key={topic} className="w-full text-left p-2 text-sm hover:bg-slate-50 rounded">
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const InvestmentThesis = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-slate-800">Investment Thesis Tracking</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">8 Active</span>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} />
          <span>New Thesis</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {investmentTheses.map(thesis => (
          <div key={thesis.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{thesis.name}</h3>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    thesis.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {thesis.status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    thesis.conviction === 'High' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {thesis.conviction} Conviction
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-800">{thesis.allocation}</p>
                <p className={`text-sm font-medium ${
                  thesis.performance.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {thesis.performance}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">Key Holdings:</p>
              <div className="flex space-x-2">
                {thesis.keyStocks.map(stock => (
                  <span key={stock} className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded">
                    {stock}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Calendar size={16} />
                <span>Last Review: {thesis.lastReview}</span>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-slate-600 hover:text-blue-600">
                  <Eye size={16} />
                </button>
                <button className="p-2 text-slate-600 hover:text-blue-600">
                  <TrendingUp size={16} />
                </button>
                <button className="p-2 text-slate-600 hover:text-blue-600">
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="mr-2 text-blue-600" size={20} />
          Portfolio Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">+12.8%</p>
            <p className="text-sm text-green-700">Total Return</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">$8.2M</p>
            <p className="text-sm text-blue-700">Total AUM</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">0.89</p>
            <p className="text-sm text-purple-700">Sharpe Ratio</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">-8.2%</p>
            <p className="text-sm text-orange-700">Max Drawdown</p>
          </div>
        </div>
      </div>
    </div>
  );

  const DecisionAudit = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-slate-800">Decision Audit Trail</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">All Decisions</button>
            <button className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">High Impact</button>
            <button className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">This Week</button>
          </div>
        </div>
        <button className="flex items-center space-x-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700">
          <Download size={16} />
          <span>Export Audit</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-800">156</p>
              <p className="text-sm text-slate-600">Total Decisions</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">23</p>
              <p className="text-sm text-red-700">High Impact</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">87%</p>
              <p className="text-sm text-green-700">Documented</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">92%</p>
              <p className="text-sm text-blue-700">Compliance</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {auditTrail.map(item => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      item.impact === 'High' ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      {item.analyst.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.action}</h4>
                      <p className="text-slate-600">{item.details}</p>
                      <p className="text-sm text-slate-500 mt-1">{item.rationale}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.impact === 'High' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.impact} Impact
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{item.timestamp}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>Analyst: {item.analyst}</span>
                    <span>•</span>
                    <span>ID: #{item.id.toString().padStart(4, '0')}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 text-slate-600 hover:text-blue-600">
                      <Eye size={16} />
                    </button>
                    <button className="p-1 text-slate-600 hover:text-blue-600">
                      <MessageCircle size={16} />
                    </button>
                    <button className="p-1 text-slate-600 hover:text-blue-600">
                      <Archive size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'collaboration':
        return <Collaboration />;
      case 'retrieval':
        return <SmartRetrieval />;
      case 'thesis':
        return <InvestmentThesis />;
      case 'audit':
        return <DecisionAudit />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header />
      <main className="ml-64 p-6">
        {renderContent()}
      </main>

      <CreateResearchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          // Refresh the research items
          const fetchResearchItems = async () => {
            try {
              const response = await apiService.authenticatedFetch('/api/research', {
                method: 'GET',
              });
              const result = await response.json();
              if (result.success && Array.isArray(result.data)) {
                setResearchItems(result.data);
              }
            } catch (error) {
              console.error('Error fetching research:', error);
              setError(error.message);
            }
          };
          fetchResearchItems();
        }}
      />
    </div>
  );
};

export default KnowledgeRepository; 
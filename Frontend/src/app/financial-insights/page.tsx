"use client";

import { useState } from "react";
import { FaFilter, FaCalendarAlt, FaEye, FaFileAlt, FaBlog } from "react-icons/fa";
import Header from "../components/Header";

type ContentType = 'all' | 'blog' | 'report';

interface ContentItem {
  id: string;
  type: 'blog' | 'report';
  title: string;
  subtitle: string;
  description: string;
  date: string;
  readTime: string;
  views: number;
  filename: string;
  tags: string[];
}

const contentData: ContentItem[] = [
  {
    id: '1',
    type: 'blog',
    title: 'Stagflation',
    subtitle: 'Tariff-Induced Economic Implications',
    description: 'An in-depth analysis of how modern tariff policies could trigger stagflation scenarios and their potential impact on global markets.',
    date: '2025-05-28',
    readTime: '8 min read',
    views: 1247,
    filename: 'blog.html',
    tags: ['Economics', 'Policy', 'Inflation', 'Trade']
  },
  {
    id: '2',
    type: 'report',
    title: 'NVIDIA Corporation (NASDAQ: NVDA)',
    subtitle: 'Comprehensive Equity Research Report – May 29, 2025',
    description: 'Detailed financial analysis and valuation of NVIDIA Corporation covering Q1 2025 earnings, AI market positioning, and future growth prospects.',
    date: '2025-05-29',
    readTime: '25 min read',
    views: 892,
    filename: 'report.html',
    tags: ['Equity Research', 'Technology', 'AI', 'Semiconductors']
  },
  {
    id: '3',
    type: 'blog',
    title: 'Federal Reserve Policy Outlook',
    subtitle: 'Interest Rate Projections for H2 2025',
    description: 'Analyzing recent Fed communications and economic indicators to forecast potential monetary policy shifts in the second half of 2025.',
    date: '2025-05-25',
    readTime: '6 min read',
    views: 1856,
    filename: 'fed-policy-blog.html',
    tags: ['Federal Reserve', 'Interest Rates', 'Monetary Policy']
  },
  {
    id: '4',
    type: 'report',
    title: 'Tesla Inc. (NASDAQ: TSLA)',
    subtitle: 'Electric Vehicle Market Analysis – Q1 2025',
    description: 'Comprehensive analysis of Tesla\'s performance in the evolving EV landscape, including market share analysis and competitive positioning.',
    date: '2025-05-20',
    readTime: '22 min read',
    views: 743,
    filename: 'tesla-report.html',
    tags: ['Equity Research', 'Electric Vehicles', 'Automotive', 'Clean Energy']
  },
  {
    id: '5',
    type: 'blog',
    title: 'Cryptocurrency Market Dynamics',
    subtitle: 'Institutional Adoption Trends in 2025',
    description: 'Exploring the growing institutional interest in digital assets and its implications for traditional financial markets.',
    date: '2025-05-22',
    readTime: '10 min read',
    views: 2103,
    filename: 'crypto-blog.html',
    tags: ['Cryptocurrency', 'Digital Assets', 'Institutional Investment']
  },
  {
    id: '6',
    type: 'report',
    title: 'Apple Inc. (NASDAQ: AAPL)',
    subtitle: 'Services Revenue Deep Dive – May 2025',
    description: 'Analyzing Apple\'s services segment growth, including App Store, iCloud, and emerging revenue streams with forward-looking projections.',
    date: '2025-05-15',
    readTime: '18 min read',
    views: 1122,
    filename: 'apple-report.html',
    tags: ['Equity Research', 'Technology', 'Services', 'Mobile']
  }
];

export default function FinancialInsights() {
  const [activeFilter, setActiveFilter] = useState<ContentType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContent = contentData.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const openDocument = (filename: string) => {
    window.open(`/assets/${filename}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getContentIcon = (type: 'blog' | 'report') => {
    return type === 'blog' ? <FaBlog className="text-blue-400" /> : <FaFileAlt className="text-green-400" />;
  };

  const getContentTypeColor = (type: 'blog' | 'report') => {
    return type === 'blog' ? 'bg-blue-600' : 'bg-green-600';
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <Header showBackButton={true} backUrl="/" backText="Home" />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Page Header */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Financial Insights
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Comprehensive market analysis, research reports, and expert commentary
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search insights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400 mr-2" />
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeFilter === 'all' 
                    ? 'bg-white text-black font-semibold' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('blog')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                  activeFilter === 'blog' 
                    ? 'bg-blue-600 text-white font-semibold' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <FaBlog className="text-sm" />
                <span>Blog</span>
              </button>
              <button
                onClick={() => setActiveFilter('report')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                  activeFilter === 'report' 
                    ? 'bg-green-600 text-white font-semibold' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <FaFileAlt className="text-sm" />
                <span>Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="max-w-6xl mx-auto">
          {filteredContent.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-lg mb-4">No content found</div>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                  onClick={() => openDocument(item.filename)}
                >
                  {/* Content Type Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`${getContentTypeColor(item.type)} text-white text-xs px-3 py-1 rounded-full uppercase font-semibold`}>
                      {item.type}
                    </span>
                    <div className="text-2xl">
                      {getContentIcon(item.type)}
                    </div>
                  </div>

                  {/* Title and Subtitle */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <h4 className="text-gray-300 font-medium mb-3">
                    {item.subtitle}
                  </h4>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {item.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-gray-400 text-xs px-2 py-1">
                        +{item.tags.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm text-gray-400 border-t border-white/10 pt-4">
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt className="text-xs" />
                      <span>{formatDate(item.date)}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>{item.readTime}</span>
                      <div className="flex items-center space-x-1">
                        <FaEye className="text-xs" />
                        <span>{item.views.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">
                {contentData.filter(item => item.type === 'blog').length}
              </div>
              <div className="text-gray-400">Blog Posts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">
                {contentData.filter(item => item.type === 'report').length}
              </div>
              <div className="text-gray-400">Research Reports</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">
                {Math.round(contentData.reduce((sum, item) => sum + item.views, 0) / 1000)}k+
              </div>
              <div className="text-gray-400">Total Views</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
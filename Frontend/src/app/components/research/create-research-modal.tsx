'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, ExternalLink, Brain, Users, History, ChevronDown, Eye, GitBranch, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RichTextEditor from '../../../components/research/RichTextEditor';
import WritingAssistant from '../../../components/research/WritingAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { apiService } from '@/lib/services/apiService';

interface ResearchVersion {
  id: string;
  version_number: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  file_url: string | null;
}

interface Research {
  id: string;
  title: string;
  type: string;
  content: string;
  tags: string[];
  author: string;
  created_at: string;
  relevance_score: number;
  status: string;
  file_url: string | null;
  current_version_id: string;
  versions?: ResearchVersion[];
}

// Create Research Modal Component
const CreateResearchModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    content: '',
    tags: [],
    file: null
  });
  const [tagInput, setTagInput] = useState('');
  const [fileError, setFileError] = useState('');
  const [selectedText, setSelectedText] = useState('');

  // Get team JWT for authentication (dynamically)
  const getCurrentJwt = () => localStorage.getItem('team_jwt');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, file }));
      setFileError('');
    } else {
      setFileError('Please select a valid PDF file');
      setFormData(prev => ({ ...prev, file: null }));
    }
  };

  const uploadFile = async (file: File) => {
    console.log('📤 Starting file upload...');
    console.log('📄 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    const currentJwt = getCurrentJwt();
    console.log('🔑 Team JWT for upload:', currentJwt ? 'Present' : 'Missing');
    
    try {
      console.log('📡 Calling apiService.uploadFile...');
      const url = await apiService.uploadFile(file, currentJwt);
      console.log('✅ File uploaded successfully:', url);
      return url;
    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.type || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    const currentJwt = getCurrentJwt();
    if (!currentJwt) {
      alert('Please log in to your team first');
      return;
    }

    console.log('🔐 Using JWT for research creation:', currentJwt ? 'Present' : 'Missing');

    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (formData.file) {
        console.log('Uploading file with team JWT authentication...');
        fileUrl = await uploadFile(formData.file);
      }

      // Get the current user's profile for consistent author naming
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      const authorName = profile?.full_name || session.user.email?.split('@')[0] || 'Unknown';

      console.log('Creating research with team JWT...');
      const result = await apiService.createResearch({
        title: formData.title,
        type: formData.type,
        content: formData.content,
        tags: formData.tags,
        fileUrl: fileUrl,
        username: authorName,
        relevance_score: 0
      }, currentJwt);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create research');
      }

      console.log('Research created successfully:', result);
      
      // Reset form
      setFormData({
        title: '',
        type: '',
        content: '',
        tags: [],
        file: null
      });
      setTagInput('');
      setFileError('');
      
      onSuccess();
    } catch (error: any) {
      console.error('Research creation failed:', error);
      alert(`Failed to create research: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader className="pb-4 border-b border-gray-200 mb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">Create New Research</DialogTitle>
          <DialogDescription className="text-gray-600">Add a new research item to your knowledge repository.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="Enter research title"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Research Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              <option value="">Select type</option>
              <option value="Company Research">Company Research</option>
              <option value="Sector Analysis">Sector Analysis</option>
              <option value="Macro Analysis">Macro Analysis</option>
              <option value="Technical Analysis">Technical Analysis</option>
              <option value="Market Commentary">Market Commentary</option>
            </select>
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-700">Content *</label>
              <div className="border border-gray-300 rounded-lg bg-white p-2 min-h-[350px] max-h-[600px]">
                <RichTextEditor
                  content={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  onSelectionUpdate={setSelectedText}
                />
              </div>
            </div>
            <div className="w-full lg:w-1/3">
              <WritingAssistant
                selectedText={selectedText}
                researchTitle={formData.title}
                researchType={formData.type}
                onApply={(newText) => setFormData(prev => ({ ...prev, content: newText }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Add a tag and press Enter"
              />
              <Button type="button" onClick={addTag} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-800">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Attach PDF File *</label>
            <div className="border-2 border-dashed border-blue-400 rounded-lg p-4 bg-white flex flex-col items-center justify-center">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="mb-2"
                required
              />
              {formData.file && <span className="text-sm text-gray-700">{formData.file.name}</span>}
              {fileError && <span className="text-sm text-red-600">{fileError}</span>}
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</Button>
            <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Research'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Version Details Modal Component
const VersionDetailsModal = ({ isOpen, onClose, version, researchTitle }) => {
  if (!isOpen || !version) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            {researchTitle} - Version {version.version_number}
          </DialogTitle>
          <DialogDescription>
            Created by {version.author} on {new Date(version.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Content</h3>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{version.content}</p>
            </div>
          </div>

          {version.file_url && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Attached File</h3>
              <a
                href={version.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <FileText className="w-4 h-4 mr-2" />
                View File
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Mock data for demonstration
const mockResearchItems = [
  {
    id: '1',
    title: 'Tesla Q3 2024 Analysis',
    type: 'Company Research',
    content: 'Comprehensive analysis of Tesla\'s Q3 2024 performance, including production numbers, financial metrics, and future outlook.',
    tags: ['TSLA', 'EV', 'Growth'],
    author: 'Sarah Chen',
    created_at: '2024-05-30T10:00:00Z',
    relevance_score: 92,
    status: 'published',
    file_url: null,
    current_version_id: '1'
  },
  {
    id: '2',
    title: 'Fed Rate Decision Impact',
    type: 'Macro Analysis',
    content: 'Analysis of the Federal Reserve\'s latest rate decision and its potential impact on various market sectors.',
    tags: ['Fed', 'Rates', 'Fixed Income'],
    author: 'David Kim',
    created_at: '2024-05-29T15:30:00Z',
    relevance_score: 88,
    status: 'published',
    file_url: null,
    current_version_id: '2'
  },
  {
    id: '3',
    title: 'Renewable Energy Sector Thesis',
    type: 'Sector Analysis',
    content: 'Long-term investment thesis for the renewable energy sector, focusing on solar and wind power companies.',
    tags: ['Clean Energy', 'ESG', 'Long-term'],
    author: 'Emma Johnson',
    created_at: '2024-05-28T09:15:00Z',
    relevance_score: 95,
    status: 'published',
    file_url: null,
    current_version_id: '3'
  }
];

// Utility function to strip HTML tags
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '');
}

export default CreateResearchModal;
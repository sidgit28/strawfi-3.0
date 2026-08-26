'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';

import RichTextEditor from '../../../components/research/RichTextEditor';
import WritingAssistant from '../../../components/research/WritingAssistant';
import { apiService } from '@/lib/services/apiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  researchId: string;
  title: string;
  type: string;
  onSuccess: () => void;          
}

export default function AddVersionModal({
  isOpen,
  onClose,
  researchId,
  title,
  type,
  onSuccess
}: Props) {
  const [formData, setFormData] = useState({
    content: '',
    tags: [] as string[],
    file: null as File | null
  });
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  React.useEffect(() => {
    const loadVersions = async () => {
      try {
        const res = await apiService.authenticatedFetch(`/api/research/${researchId}/versions`, {
          method: 'GET',
        });
        const data = await res.json();
        if (data.versions && data.versions.length > 0) {
          setFormData(prev => ({
            ...prev,
            content: data.versions[0].content,
            tags: data.versions[0].tags || []
          }));
        }
      } catch (error) {
        console.error('Error fetching versions:', error);
      }
    };

    if (isOpen && researchId) {
      loadVersions();
    }
  }, [isOpen, researchId]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');
  const [selectedText, setSelectedText] = useState('');

  /* ---------- helpers ---------- */

  const uploadFile = async (file: File) => {
    try {
      return await apiService.uploadFile(file);
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error('File upload failed');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(p => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) =>
    setFormData(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type !== 'application/pdf') {
      setFileError('Only PDF files are allowed.');
      setFormData(p => ({ ...p, file: null }));
    } else {
      setFileError('');
      setFormData(p => ({ ...p, file }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.content.trim()) return alert('Content is required');
    setSubmitting(true);
    try {
      let fileUrl: string | null = null;
      if (formData.file) fileUrl = await uploadFile(formData.file);

      // Get the current user's profile
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

      // Get team JWT for authentication
      const teamJwt = localStorage.getItem('team_jwt');
      if (!teamJwt) {
        throw new Error('No team authentication found');
      }

      // Create new version using API service
      const result = await apiService.createResearchVersion(researchId, {
        content: formData.content,
        tags: formData.tags,
        fileUrl: fileUrl,
        username: authorName
      }, teamJwt);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create version');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Version creation failed:', err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- render ---------- */

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader className="pb-4 border-b border-gray-200 mb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">Add New Version</DialogTitle>
          <DialogDescription className="text-gray-600">
            Creating a new version for <strong className="text-blue-600">{title}</strong> (<span className="text-blue-600">{type}</span>)
          </DialogDescription>
        </DialogHeader>

        {/* immutable fields */}
        <div className="flex gap-4 mb-6">
          <input
            disabled
            value={title}
            className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
          />
          <input
            disabled
            value={type}
            className="w-56 p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
          />
        </div>

        {/* editable content */}
        <div className="space-y-4">
          <div className="border border-gray-300 rounded-lg bg-white p-2 min-h-[300px]">
            <RichTextEditor
              content={formData.content}
              onChange={v => setFormData(p => ({ ...p, content: v }))}
              onSelectionUpdate={setSelectedText}
            />
          </div>
          
          <WritingAssistant
            selectedText={selectedText}
            researchTitle={title}
            researchType={type}
            onApply={improvedContent => setFormData(p => ({ ...p, content: improvedContent }))}
          />
        </div>

        {/* tags */}
         <div className="mb-6">
           <label className="text-sm font-medium text-gray-700">Tags</label>
           <div className="flex gap-2 my-2">
             <input
               value={tagInput}
               onChange={e => setTagInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
               className="flex-1 p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
               placeholder="Add tag & press Enter"
             />
             <Button variant="outline" type="button" onClick={addTag} className="border-gray-300 text-gray-700 hover:bg-gray-100">
               Add
             </Button>
           </div>
           <div className="flex flex-wrap gap-2">
             {formData.tags.map(tag => (
               <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-800">
                 {tag}
                 <button
                   type="button"
                   onClick={() => removeTag(tag)}
                   className="ml-1 text-blue-600 hover:text-blue-800"
                 >
                   ×
                 </button>
               </Badge>
             ))}
           </div>
         </div>

         {/* file upload */}
         <div className="mb-6">
           <label className="text-sm font-medium text-gray-700">Attach PDF (optional)</label>
           <div className="border-2 border-dashed border-blue-400 rounded-lg p-4 bg-white">
             <input type="file" accept="application/pdf" onChange={handleFileChange} className="text-gray-900" />
             {formData.file && (
               <div className="mt-2">
                 <p className="text-sm text-gray-700">{formData.file.name}</p>
                 <button
                   type="button"
                   onClick={() => setFormData(p => ({ ...p, file: null }))}
                   className="text-xs text-red-600 hover:text-red-800"
                 >
                   Remove
                 </button>
               </div>
             )}
             {fileError && <p className="text-red-600 text-sm mt-2">{fileError}</p>}
           </div>
         </div>

         <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</Button>
            <Button type="submit" onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? 'Saving...' : 'Save Version'}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}


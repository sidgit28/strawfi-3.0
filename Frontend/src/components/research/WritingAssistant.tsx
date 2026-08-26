'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Clipboard, Check } from 'lucide-react';

const assistantPrompts = [
  { key: 'improve', label: 'Improve Text' },
  { key: 'summary', label: 'Summarize' },
  { key: 'grammar', label: 'Fix Grammar' },
  { key: 'citations', label: 'Suggest Tags' },
  { key: 'outline', label: 'Create Outline' },
];

interface WritingAssistantProps {
  selectedText: string;
  researchTitle: string;
  researchType: string;
  onApply: (newText: string) => void;
}

export default function WritingAssistant({ selectedText, researchTitle, researchType, onApply }: WritingAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAssist = async (promptType: string) => {
    setIsLoading(true);
    setAiResponse('');

    const payload = {
      promptType,
      content: selectedText,
      title: researchTitle,
      type: researchType,
    };

    try {
      const response = await fetch('/api/writing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }

      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      setAiResponse(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Writing Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500">
          Select text in the editor or use the research title to get help.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {assistantPrompts.map((prompt) => (
            <Button
              key={prompt.key}
              variant="outline"
              size="sm"
              onClick={() => handleAssist(prompt.key)}
              disabled={isLoading || (!selectedText && !['outline', 'citations'].includes(prompt.key))}
            >
              {prompt.label}
            </Button>
          ))}
        </div>
        
        {(isLoading || aiResponse) && (
          <div className="pt-4">
            <h4 className="font-semibold mb-2">Suggestion:</h4>
            {isLoading ? (
              <div className="animate-pulse bg-slate-200 rounded-md h-24"></div>
            ) : (
              <div className="relative">
                <Textarea value={aiResponse} readOnly rows={5} className="bg-slate-50" />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                </Button>
              </div>
            )}
            {!isLoading && aiResponse && (
              <Button size="sm" className="mt-2" onClick={() => onApply(aiResponse)}>Apply Suggestion</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/services/apiService';
import { config as appConfig } from '@/lib/config';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Styled Components
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const DashboardContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(120deg, #f8fafc 0%, #e0e7ef 100%);
  color: #1f2937;
  line-height: 1.6;
  font-size: 1.08rem;
`;

const DashboardHeader = styled.header`
  background: #ffffffcc;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.07);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(6px);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;

    i {
      color: #3b82f6;
      margin-right: 0.5rem;
    }
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  gap: 2rem;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const StatusBadge = styled.span<{ status: 'connected' | 'disconnected' | 'recording' | 'not-recording' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  ${props => props.status === 'connected' && css`
    background-color: #dcfce7;
    color: #166534;
  `}

  ${props => props.status === 'disconnected' && css`
    background-color: #fee2e2;
    color: #991b1b;
  `}

  ${props => props.status === 'recording' && css`
    background-color: #fef3c7;
    color: #92400e;
    animation: ${pulse} 2s infinite;
  `}

  ${props => props.status === 'not-recording' && css`
    background-color: #e5e7eb;
    color: #6b7280;
  `}
`;

const DashboardMain = styled.div`
  display: flex;
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
`;

const Sidebar = styled.aside`
  width: 320px;
  background: #f4f7fb;
  border-right: 1px solid #e5e7eb;
  padding: 2rem 1.2rem;
  overflow-y: auto;
  max-height: calc(100vh - 80px);
  transition: all 0.3s;
  @media (max-width: 900px) {
    position: fixed;
    left: 0;
    top: 80px;
    width: 80vw;
    max-width: 350px;
    z-index: 20;
    box-shadow: 2px 0 12px rgba(0,0,0,0.08);
    transform: translateX(-100%);
    &[data-open='true'] {
      transform: translateX(0);
    }
  }
`;

const SidebarSection = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px dashed #e5e7eb;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px 0 rgba(0,0,0,0.03);
  &:last-child {
    border-bottom: none;
  }
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    i {
      color: #3b82f6;
      margin-right: 0.5rem;
    }
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(100vh - 80px);
  background: linear-gradient(120deg, #f8fafc 60%, #e0e7ef 100%);
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #1f2937;
`;

const FormControl = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease-in-out;
  background-color: #ffffff;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:hover {
    border-color: #60a5fa;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease-in-out;
  background-color: #ffffff;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:hover {
    border-color: #60a5fa;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease-in-out;
  background-color: #ffffff;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:hover {
    border-color: #60a5fa;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'success' | 'danger' | 'secondary' | 'outline'; size?: 'sm' | 'md' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${props => props.size === 'sm' ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  border: none;
  border-radius: 8px;
  font-size: ${props => props.size === 'sm' ? '0.75rem' : '0.875rem'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${props => props.variant === 'primary' && css`
    background-color: #3b82f6;
    color: white;
    &:hover:not(:disabled) {
      background-color: #2563eb;
    }
  `}

  ${props => props.variant === 'success' && css`
    background-color: #10b981;
    color: white;
    &:hover:not(:disabled) {
      background-color: #059669;
    }
  `}

  ${props => props.variant === 'danger' && css`
    background-color: #ef4444;
    color: white;
    &:hover:not(:disabled) {
      background-color: #dc2626;
    }
  `}

  ${props => props.variant === 'secondary' && css`
    background-color: #6b7280;
    color: white;
    &:hover:not(:disabled) {
      background-color: #4b5563;
    }
  `}

  ${props => props.variant === 'outline' && css`
    background-color: transparent;
    color: #3b82f6;
    border: 1px solid #3b82f6;
    &:hover {
      background-color: #3b82f6;
      color: white;
    }
  `}

  ${props => !props.variant && css`
    background-color: #3b82f6;
    color: white;
    &:hover:not(:disabled) {
      background-color: #2563eb;
    }
  `}

  &:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
`;

const UploadArea = styled.div`
  position: relative;
  margin-top: 0.5rem;
`;

const FileInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
`;

const UploadLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #3b82f6;
    background-color: #f0f9ff;
  }

  i {
    font-size: 2rem;
    color: #3b82f6;
    margin-bottom: 0.5rem;
  }
`;

const ContentSection = styled.section`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.07);
  margin-bottom: 2rem;
  overflow: hidden;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 4px 24px 0 rgba(59,130,246,0.08);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;

    i {
      color: #3b82f6;
      margin-right: 0.5rem;
    }
  }
`;

const ViewControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ViewButton = styled.button<{ 
  variant?: 'primary' | 'success' | 'danger' | 'secondary' | 'outline'; 
  size?: 'sm' | 'md'; 
  $active?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${props => props.size === 'sm' ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  border: none;
  border-radius: 8px;
  font-size: ${props => props.size === 'sm' ? '0.75rem' : '0.875rem'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${props => props.variant === 'primary' && css`
    background-color: #3b82f6;
    color: white;
    &:hover:not(:disabled) {
      background-color: #2563eb;
    }
  `}

  ${props => props.variant === 'success' && css`
    background-color: #10b981;
    color: white;
    &:hover:not(:disabled) {
      background-color: #059669;
    }
  `}

  ${props => props.variant === 'danger' && css`
    background-color: #ef4444;
    color: white;
    &:hover:not(:disabled) {
      background-color: #dc2626;
    }
  `}

  ${props => props.variant === 'secondary' && css`
    background-color: #6b7280;
    color: white;
    &:hover:not(:disabled) {
      background-color: #4b5563;
    }
  `}

  ${props => props.variant === 'outline' && css`
    background-color: ${props.$active ? '#3b82f6' : 'transparent'};
    color: ${props.$active ? 'white' : '#3b82f6'};
    border: 1px solid #3b82f6;
    &:hover {
      background-color: #3b82f6;
      color: white;
    }
  `}

  ${props => !props.variant && css`
    background-color: #3b82f6;
    color: white;
    &:hover:not(:disabled) {
      background-color: #2563eb;
    }
  `}

  &:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
`;

const ChartContainer = styled.div`
  position: relative;
  height: 400px;
  padding: 2rem;
`;

const RealTimeUpdates = styled.div`
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem 2rem;
`;

const RealTimeUpdate = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  animation: ${slideIn} 0.3s ease-out;

  &:last-child {
    border-bottom: none;
  }
`;

const UpdateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const UpdateTime = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const SentimentScore = styled.span<{ sentiment: 'positive' | 'negative' | 'neutral' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  ${props => props.sentiment === 'positive' && css`
    background-color: #dcfce7;
    color: #166534;
  `}

  ${props => props.sentiment === 'negative' && css`
    background-color: #fee2e2;
    color: #991b1b;
  `}

  ${props => props.sentiment === 'neutral' && css`
    background-color: #e5e7eb;
    color: #6b7280;
  `}
`;

const TranscriptChunk = styled.p`
  font-size: 0.875rem;
  color: #1f2937;
  line-height: 1.5;
  margin: 0;
`;

const ResultsContainer = styled.div`
  padding: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;

  i {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoadingContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;

  h3 {
    margin-bottom: 1rem;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 1rem;
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Notification = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  animation: ${slideIn} 0.3s ease-out;
  transition: transform 0.3s, opacity 0.3s;
  transform: translateY(0);
  opacity: 1;

  ${props => props.type === 'success' && css`
    background-color: #f0fdf4;
    color: #166534;
    border-left: 4px solid #10b981;
  `}

  ${props => props.type === 'error' && css`
    background-color: #fef2f2;
    color: #991b1b;
    border-left: 4px solid #ef4444;
  `}

  ${props => props.type === 'warning' && css`
    background-color: #fffbeb;
    color: #92400e;
    border-left: 4px solid #f59e0b;
  `}

  ${props => props.type === 'info' && css`
    background-color: #eff6ff;
    color: #1e40af;
    border-left: 4px solid #3b82f6;
  `}

  &.notification-exit {
    transform: translateY(-20px);
    opacity: 0;
  }
`;

const NotificationClose = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: auto;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

// Interfaces (same as before)
interface SentimentData {
  overall_sentiment: number;
  company?: string;
  ticker: string;
  year: number;
  quarter: number;
  timestamp?: string;
  date?: string;
  success?: boolean;
  error?: string;
  summary?: {
    positive_ratio: number;
    neutral_ratio: number;
    negative_ratio: number;
    key_points: string[];
    most_positive: Array<{ score: number; text: string }>;
    most_negative: Array<{ score: number; text: string }>;
    sentiment_ratios?: {
      positive_ratio: number;
      negative_ratio: number;
      neutral_ratio: number;
    };
    sentiment_distribution?: {
      positive: number;
      negative: number;
      neutral: number;
      total: number;
    };
  };
  sentiments?: Array<{ label: string; score: number; text: string }>;
  transcript?: string;
}

interface RealtimeUpdate {
  timestamp: string;
  sentiment_score: number;
  transcript_chunk: string;
}

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const CorporateEvents: React.FC = () => {
  const { jwt } = useAuth();
  
  // State management (same as before)
  const [isRecording, setIsRecording] = useState(false);
  const [currentCompany, setCurrentCompany] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('');
  const [currentView, setCurrentView] = useState<'summary' | 'detailed' | 'transcript'>('summary');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [sentimentResults, setSentimentResults] = useState<SentimentData | null>(null);
  const [bulkResults, setBulkResults] = useState<Record<string, SentimentData> | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([]);
  const [notifications, setNotifications] = useState<Array<NotificationProps & { id: number }>>([]);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1)); // Remove oldest notification
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Manual close notification function
  const closeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Add notification function
  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  // Form states
  const [tickerInput, setTickerInput] = useState('');
  const [yearSelect, setYearSelect] = useState(new Date().getFullYear().toString());
  const [quarterSelect, setQuarterSelect] = useState('');
  const [recordingCompany, setRecordingCompany] = useState('');
  const [uploadCompany, setUploadCompany] = useState('');
  const [bulkTickers, setBulkTickers] = useState('');
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear().toString());
  const [bulkQuarter, setBulkQuarter] = useState('1');

  // Chart data
  const [sentimentChartData, setSentimentChartData] = useState({
    labels: [] as string[],
    datasets: [{
      label: 'Sentiment Score',
      data: [] as number[],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  });

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioSocketRef = useRef<WebSocket | null>(null);
  const notificationIdRef = useRef(0);

  // Configuration - using centralized config
  const config = {
    apiBaseUrl: appConfig.api.baseUrl,
    wsUrl: appConfig.websocket.url,
    socketUrl: appConfig.api.baseUrl
  };

  // Additional refs for recording
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize WebSocket connection for live recording
  const initializeWebSocket = useCallback(() => {
    try {
      const wsUrl = `${config.wsUrl || 'ws://localhost:3001'}/ws/corporate`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected for live recording');
        // Note: Update connection UI state here if needed
        addNotification('Connected to live recording service', 'success');
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        // Note: Update connection UI state here if needed
        audioSocketRef.current = null;
      };

      ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        // Note: Update connection UI state here if needed
        addNotification('Failed to connect to recording service', 'error');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      audioSocketRef.current = ws;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      addNotification('Failed to initialize recording connection', 'error');
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'recording_started':
        addNotification(`Recording started for ${data.company || data.ticker}`, 'success');
        break;
      
      case 'chunk_received':
        console.log(`📦 Audio chunk ${data.chunkNumber} received`);
        break;
      
      case 'processing_started':
        addNotification('Processing audio...', 'info');
        setLoadingMessage('Transcribing and analyzing audio...');
        setIsLoading(true);
        break;
      
      case 'analysis_complete':
        console.log('✅ Live recording analysis complete:', data.data);
        setIsLoading(false);
        setLoadingMessage('');
        if (data.data) {
          const newResult: SentimentData = {
            overall_sentiment: data.data.overall_sentiment || 0,
            ticker: recordingCompany?.toUpperCase().substring(0, 4) || 'LIVE',
            year: new Date().getFullYear(),
            quarter: Math.ceil((new Date().getMonth() + 1) / 3),
            timestamp: new Date().toISOString(),
            success: true,
            summary: data.data.summary,
            sentiments: data.data.sentiments,
            transcript: data.data.transcript,
            company: recordingCompany
          };
          
          // Update sentiment results with the new live recording result
          setSentimentResults(newResult);
          addNotification('Live recording analysis complete!', 'success');
        }
        break;
      
      case 'error':
        console.error('❌ WebSocket error:', data.error);
        setIsLoading(false);
        setLoadingMessage('');
        addNotification(data.error || 'Recording error occurred', 'error');
        break;
      
      case 'pong':
        console.log('🏓 WebSocket ping/pong successful');
        break;
    }
  };

  // Start recording function
  const startRecording = async () => {
    try {
      if (!recordingCompany.trim()) {
        addNotification('Please enter a company name before recording', 'warning');
        return;
      }

      // Initialize WebSocket if not connected
      if (!audioSocketRef.current || audioSocketRef.current.readyState !== WebSocket.OPEN) {
        initializeWebSocket();
        // Wait a moment for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Send audio chunk to WebSocket
          if (audioSocketRef.current && audioSocketRef.current.readyState === WebSocket.OPEN) {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Audio = (reader.result as string).split(',')[1];
              audioSocketRef.current?.send(JSON.stringify({
                type: 'audio_chunk',
                audio: base64Audio,
                timestamp: new Date().toISOString()
              }));
            };
            reader.readAsDataURL(event.data);
          }
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every 1 second
      setIsRecording(true);
      
      // Notify WebSocket of recording start
      if (audioSocketRef.current && audioSocketRef.current.readyState === WebSocket.OPEN) {
        audioSocketRef.current.send(JSON.stringify({
          type: 'start_recording',
          company: recordingCompany,
          ticker: recordingCompany.toUpperCase().substring(0, 4),
          timestamp: new Date().toISOString()
        }));
      }

      addNotification('Recording started successfully', 'success');
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      addNotification('Failed to access microphone. Please allow microphone access.', 'error');
      setIsRecording(false);
    }
  };

  // Stop recording function
  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        
        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Notify WebSocket of recording stop
        if (audioSocketRef.current && audioSocketRef.current.readyState === WebSocket.OPEN) {
          audioSocketRef.current.send(JSON.stringify({
            type: 'stop_recording',
            timestamp: new Date().toISOString()
          }));
        }

        addNotification('Recording stopped. Processing...', 'info');
      }
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      addNotification('Error stopping recording', 'error');
      setIsRecording(false);
    }
  };

  // Initialize WebSocket on component mount
  useEffect(() => {
    initializeWebSocket();
    
    return () => {
      // Cleanup on unmount
      if (audioSocketRef.current) {
        audioSocketRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeWebSocket]);

  // Fetch historical analysis
  const fetchHistoricalAnalysis = async (ticker: string, year: number, quarter: number) => {
    // Clear previous results when starting new analysis
    setBulkResults(null);
    setRealtimeUpdates([]);
    
    console.log('🔍 Fetching historical analysis...');
    console.log('📊 Parameters:', { ticker, year, quarter });
    console.log('🌐 API Base URL:', config.apiBaseUrl);
    
    try {
      const result = await apiService.getHistoricalAnalysis(ticker, year, quarter);
      console.log('✅ Historical analysis successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Historical analysis failed:', error);
      throw error;
    }
  };

  // Process audio file (upload and analyze)
  const processAudio = async (audioBlob: Blob, company: string, ticker: string) => {
    // Clear previous results when starting new analysis
    setBulkResults(null);
    setRealtimeUpdates([]);
    
    console.log('🎤 Processing audio...');
    console.log('📊 Parameters:', { company, ticker, audioSize: audioBlob.size });
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('company', company);
    formData.append('ticker', ticker);
    
    try {
      const result = await apiService.transcribeAudio(formData);
      console.log('✅ Audio processing successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Audio processing failed:', error);
      
      // Enhanced error handling with debugging info
      let errorMessage = 'Audio processing failed';
      
      if (error.message?.includes('No speech detected')) {
        errorMessage = `⚠️ No speech detected in audio file. 

Common issues with financial news clips:
• Background music interfering with speech detection
• Multiple speakers or unclear audio quality  
• Sound effects, jingles, or intro/outro music
• Audio compression from web downloads

💡 Try uploading:
• A clear recording of someone speaking
• Audio without background music
• Common formats: MP3, WAV, M4A
• File with clear, audible speech content`;
      } else if (error.message?.includes('400')) {
        errorMessage = `Audio upload failed: ${error.message}`;
      } else if (error.message?.includes('500')) {
        errorMessage = `Server error during audio processing: ${error.message}`;
      }
      
      // Show detailed error to user
      addNotification(errorMessage, 'error');
      throw error;
    }
  };

  // Debug audio file function
  const debugAudio = async (audioFile: File) => {
    console.log('🔧 Debugging audio file...');
    
    const formData = new FormData();
    formData.append('audio', audioFile, audioFile.name);
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/audio-debug`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('🔍 Audio debug result:', result);
      
      if (result.debug) {
        console.log('📊 File Info:', result.debug.fileInfo);
        if (result.debug.whisperResponse) {
          console.log('🤖 Whisper Response:', result.debug.whisperResponse);
        }
        if (result.debug.whisperError) {
          console.log('❌ Whisper Error:', result.debug.whisperError);
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Audio debug failed:', error);
      return null;
    }
  };

  // Analyze bulk tickers
  const analyzeBulk = async (tickers: string[], year: number, quarter: number) => {
    // Clear previous results when starting new analysis
    setSentimentResults(null);
    setRealtimeUpdates([]);
    
    console.log('📈 Analyzing bulk tickers...');
    console.log('📊 Parameters:', { tickers, year, quarter });
    
    try {
      const result = await apiService.analyzeBulk({ tickers, year, quarter });
      console.log('✅ Bulk analysis successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Bulk analysis failed:', error);
      throw error;
    }
  };

  // Utility functions
  const getSentimentClass = (score: number): 'positive' | 'negative' | 'neutral' => {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  };

  const getSentimentColor = (score: number): string => {
    if (score > 0.1) return '#10b981';
    if (score < -0.1) return '#ef4444';
    return '#6b7280';
  };

  const getNotificationIcon = (type: NotificationProps['type']): string => {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type];
  };

  // Chart options (same as before)
  const sentimentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        min: -1,
        max: 1,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Real-time Sentiment Analysis',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      legend: {
        display: true,
        position: 'top' as const
      }
    },
    animation: {
      duration: 750
    }
  };

  // Add results display component
  const renderResults = () => {
    if (!sentimentResults && !bulkResults) {
      return (
        <EmptyState>
          <i className="fas fa-chart-pie"></i>
          <h3>No Analysis Results</h3>
          <p>Perform a quick lookup or start recording to see sentiment analysis results</p>
        </EmptyState>
      );
    }

    if (bulkResults) {
      const tickers = Object.keys(bulkResults);
      const successfulResults = Object.values(bulkResults).filter(result => (result as any).success !== false);
      const failedResults = Object.values(bulkResults).filter(result => (result as any).success === false);
      
      // Handle different views for bulk analysis
      if (currentView === 'summary') {
        return (
          <div>
            <h3>Bulk Analysis Results - Summary</h3>
            
            {/* Summary Section */}
            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
              <h4>Overall Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Total Tickers:</strong> {tickers.length}
                </div>
                <div>
                  <strong>Successful:</strong> {successfulResults.length}
                </div>
                <div>
                  <strong>Failed:</strong> {failedResults.length}
                </div>
                <div>
                  <strong>Success Rate:</strong> {tickers.length > 0 ? ((successfulResults.length / tickers.length) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            
            {/* Individual Results Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {Object.entries(bulkResults).map(([ticker, data]) => (
                <div key={ticker} style={{ 
                  padding: '1rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  background: (data as any).success === false ? '#fef2f2' : '#f9fafb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: (data as any).success === false ? '#dc2626' : '#374151' }}>{ticker}</h4>
                    {(data as any).success !== false && (
                      <SentimentScore sentiment={getSentimentClass(data.overall_sentiment || 0)}>
                        {data.overall_sentiment?.toFixed(3) || 'N/A'}
                      </SentimentScore>
                    )}
                  </div>
                  
                  {(data as any).success === false ? (
                    <p style={{ color: '#dc2626', margin: 0 }}>Error: {(data as any).error}</p>
                  ) : (
                    <div>
                      <p style={{ margin: '0.5rem 0' }}>
                        <strong>Year/Quarter:</strong> {data.year} / Q{data.quarter}
                      </p>
                      {data.summary && (
                        <div>
                          <p style={{ margin: '0.25rem 0' }}>
                            <strong>Key Points:</strong> {data.summary.key_points?.length || 0}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <div>
                              <strong>Positive:</strong> {data.summary.positive_ratio ? (data.summary.positive_ratio * 100).toFixed(1) : 'N/A'}%
                            </div>
                            <div>
                              <strong>Negative:</strong> {data.summary.negative_ratio ? (data.summary.negative_ratio * 100).toFixed(1) : 'N/A'}%
                            </div>
                            <div>
                              <strong>Neutral:</strong> {data.summary.neutral_ratio ? (data.summary.neutral_ratio * 100).toFixed(1) : 'N/A'}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      if (currentView === 'detailed') {
        return (
          <div>
            <h3>Bulk Analysis Results - Detailed View</h3>
            
            {/* Summary Section */}
            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
              <h4>Analysis Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Total Tickers:</strong> {tickers.length}
                </div>
                <div>
                  <strong>Successful:</strong> {successfulResults.length}
                </div>
                <div>
                  <strong>Failed:</strong> {failedResults.length}
                </div>
                <div>
                  <strong>Success Rate:</strong> {tickers.length > 0 ? ((successfulResults.length / tickers.length) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            
            {/* Detailed Sentiment Analysis for each ticker */}
            {Object.entries(bulkResults).map(([ticker, data]) => (
              <div key={ticker} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: (data as any).success === false ? '#dc2626' : '#374151' }}>{ticker}</h4>
                  {(data as any).success !== false && (
                    <SentimentScore sentiment={getSentimentClass(data.overall_sentiment || 0)}>
                      {data.overall_sentiment?.toFixed(3) || 'N/A'}
                    </SentimentScore>
                  )}
                </div>
                
                {(data as any).success === false ? (
                  <p style={{ color: '#dc2626', margin: 0 }}>Error: {(data as any).error}</p>
                ) : (
                  <div>
                    <p style={{ margin: '0.5rem 0' }}>
                      <strong>Year/Quarter:</strong> {data.year} / Q{data.quarter}
                    </p>
                    
                    {/* Sentiment Distribution */}
                    {data.summary && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h5>Sentiment Distribution</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ padding: '0.5rem', background: '#dcfce7', borderRadius: '4px', textAlign: 'center' }}>
                            <strong>Positive</strong><br />
                            {data.summary.positive_ratio ? (data.summary.positive_ratio * 100).toFixed(1) : 'N/A'}%
                          </div>
                          <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: '4px', textAlign: 'center' }}>
                            <strong>Negative</strong><br />
                            {data.summary.negative_ratio ? (data.summary.negative_ratio * 100).toFixed(1) : 'N/A'}%
                          </div>
                          <div style={{ padding: '0.5rem', background: '#e5e7eb', borderRadius: '4px', textAlign: 'center' }}>
                            <strong>Neutral</strong><br />
                            {data.summary.neutral_ratio ? (data.summary.neutral_ratio * 100).toFixed(1) : 'N/A'}%
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Key Points */}
                    {data.summary && data.summary.key_points && data.summary.key_points.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h5>Key Points</h5>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                          {data.summary.key_points.map((point, index) => (
                            <li key={index} style={{ marginBottom: '0.5rem' }}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Individual Sentiments */}
                    {data.sentiments && data.sentiments.length > 0 && (
                      <div>
                        <h5>Detailed Sentiment Analysis</h5>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {data.sentiments.slice(0, 10).map((sentiment, index) => (
                            <div key={index} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', marginBottom: '0.5rem', borderRadius: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <SentimentScore sentiment={sentiment.label as 'positive' | 'negative' | 'neutral'}>
                                  {sentiment.label}
                                </SentimentScore>
                                <span>Score: {sentiment.score.toFixed(3)}</span>
                              </div>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                                {sentiment.text.length > 200 ? sentiment.text.substring(0, 200) + '...' : sentiment.text}
                              </p>
                            </div>
                          ))}
                          {data.sentiments.length > 10 && (
                            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                              Showing first 10 of {data.sentiments.length} sentiment chunks
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      
      if (currentView === 'transcript') {
        return (
          <div>
            <h3>Bulk Analysis Results - Transcripts</h3>
            
            {/* Summary Section */}
            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
              <h4>Analysis Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Total Tickers:</strong> {tickers.length}
                </div>
                <div>
                  <strong>Successful:</strong> {successfulResults.length}
                </div>
                <div>
                  <strong>Failed:</strong> {failedResults.length}
                </div>
                <div>
                  <strong>Success Rate:</strong> {tickers.length > 0 ? ((successfulResults.length / tickers.length) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            
            {/* Transcripts for each ticker */}
            {Object.entries(bulkResults).map(([ticker, data]) => (
              <div key={ticker} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: (data as any).success === false ? '#dc2626' : '#374151' }}>{ticker}</h4>
                  {(data as any).success !== false && (
                    <SentimentScore sentiment={getSentimentClass(data.overall_sentiment || 0)}>
                      {data.overall_sentiment?.toFixed(3) || 'N/A'}
                    </SentimentScore>
                  )}
                </div>
                
                {(data as any).success === false ? (
                  <p style={{ color: '#dc2626', margin: 0 }}>Error: {(data as any).error}</p>
                ) : (
                  <div>
                    <p style={{ margin: '0.5rem 0' }}>
                      <strong>Year/Quarter:</strong> {data.year} / Q{data.quarter}
                    </p>
                    
                    {data.transcript ? (
                      <div>
                        <h5>Transcript</h5>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: '0.875rem' }}>
                            {data.transcript}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No transcript available for this analysis.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      
      // Default view (same as summary)
      return (
        <div>
          <h3>Bulk Analysis Results</h3>
          
          {/* Summary Section */}
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
            <h4>Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Total Tickers:</strong> {tickers.length}
              </div>
              <div>
                <strong>Successful:</strong> {successfulResults.length}
              </div>
              <div>
                <strong>Failed:</strong> {failedResults.length}
              </div>
              <div>
                <strong>Success Rate:</strong> {tickers.length > 0 ? ((successfulResults.length / tickers.length) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
          
          {/* Individual Results */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {Object.entries(bulkResults).map(([ticker, data]) => (
              <div key={ticker} style={{ 
                padding: '1rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                background: (data as any).success === false ? '#fef2f2' : '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, color: (data as any).success === false ? '#dc2626' : '#374151' }}>{ticker}</h4>
                  {(data as any).success !== false && (
                    <SentimentScore sentiment={getSentimentClass(data.overall_sentiment || 0)}>
                      {data.overall_sentiment?.toFixed(3) || 'N/A'}
                    </SentimentScore>
                  )}
                </div>
                
                {(data as any).success === false ? (
                  <p style={{ color: '#dc2626', margin: 0 }}>Error: {(data as any).error}</p>
                ) : (
                  <div>
                    <p style={{ margin: '0.5rem 0' }}>
                      <strong>Year/Quarter:</strong> {data.year} / Q{data.quarter}
                    </p>
                    {data.summary && (
                      <div>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Key Points:</strong> {data.summary.key_points?.length || 0}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div>
                            <strong>Positive:</strong> {data.summary.positive_ratio ? (data.summary.positive_ratio * 100).toFixed(1) : 'N/A'}%
                          </div>
                          <div>
                            <strong>Negative:</strong> {data.summary.negative_ratio ? (data.summary.negative_ratio * 100).toFixed(1) : 'N/A'}%
                          </div>
                          <div>
                            <strong>Neutral:</strong> {data.summary.neutral_ratio ? (data.summary.neutral_ratio * 100).toFixed(1) : 'N/A'}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (sentimentResults) {
      return (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h3>Analysis Results for {sentimentResults.ticker}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <strong>Overall Sentiment</strong>
                <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
                  {sentimentResults.overall_sentiment?.toFixed(3) || 'N/A'}
                </p>
                <SentimentScore sentiment={getSentimentClass(sentimentResults.overall_sentiment || 0)}>
                  {getSentimentClass(sentimentResults.overall_sentiment || 0)}
                </SentimentScore>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <strong>Year/Quarter</strong>
                <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
                  {sentimentResults.year} / Q{sentimentResults.quarter}
                </p>
              </div>
            </div>
          </div>

          {currentView === 'summary' && sentimentResults.summary && (
            <div>
              <h4>Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
                  <h5>Sentiment Ratios</h5>
                  <div>
                    <p>Positive: {sentimentResults.summary.positive_ratio ? (sentimentResults.summary.positive_ratio * 100).toFixed(1) : 'N/A'}%</p>
                    <p>Negative: {sentimentResults.summary.negative_ratio ? (sentimentResults.summary.negative_ratio * 100).toFixed(1) : 'N/A'}%</p>
                    <p>Neutral: {sentimentResults.summary.neutral_ratio ? (sentimentResults.summary.neutral_ratio * 100).toFixed(1) : 'N/A'}%</p>
                  </div>
                </div>
                <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
                  <h5>Key Points</h5>
                  <ul>
                    {sentimentResults.summary.key_points?.slice(0, 3).map((point, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentView === 'detailed' && sentimentResults.sentiments && (
            <div>
              <h4>Detailed Sentiment Analysis</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {sentimentResults.sentiments.map((sentiment, index) => (
                  <div key={index} style={{ padding: '1rem', border: '1px solid #e5e7eb', marginBottom: '0.5rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <SentimentScore sentiment={sentiment.label as 'positive' | 'negative' | 'neutral'}>
                        {sentiment.label}
                      </SentimentScore>
                      <span>Score: {sentiment.score.toFixed(3)}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{sentiment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'transcript' && sentimentResults.transcript && (
            <div>
              <h4>Transcript</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                  {sentimentResults.transcript}
                </pre>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Clear results function
  const clearResults = () => {
    setSentimentResults(null);
    setBulkResults(null);
    setRealtimeUpdates([]);
    addNotification('Results cleared', 'info');
  };

  // Clear chart function
  const clearChart = () => {
    setSentimentChartData({
      labels: [],
      datasets: [{
        label: 'Sentiment Score',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    });
    addNotification('Chart cleared', 'info');
  };

  // Export chart function
  const exportChart = () => {
    // Create a canvas element to capture the chart
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'sentiment-analysis-chart.png';
      link.href = canvas.toDataURL();
      link.click();
      addNotification('Chart exported successfully', 'success');
    } else {
      addNotification('No chart to export', 'warning');
    }
  };

  // Update chart data when sentiment results change
  useEffect(() => {
    if (sentimentResults && sentimentResults.overall_sentiment !== undefined) {
      const timestamp = new Date().toLocaleTimeString();
      setSentimentChartData(prevData => ({
        labels: [...prevData.labels, timestamp],
        datasets: [{
          ...prevData.datasets[0],
          data: [...prevData.datasets[0].data, sentimentResults.overall_sentiment]
        }]
      }));
    }
  }, [sentimentResults]);

  // Update chart data when bulk results change
  useEffect(() => {
    if (bulkResults && Object.keys(bulkResults).length > 0) {
      const labels = Object.keys(bulkResults);
      const data = Object.values(bulkResults).map(result => result.overall_sentiment || 0);
      const colors = data.map(sentiment => getSentimentColor(sentiment));
      
      // Update the real-time chart with bulk results
      setSentimentChartData(prevData => ({
        labels: [...prevData.labels, ...labels],
        datasets: [{
          ...prevData.datasets[0],
          data: [...prevData.datasets[0].data, ...data]
        }]
      }));
    }
  }, [bulkResults]);

  return (
    <DashboardContainer>
      {/* Header */}
      <DashboardHeader>
        <HeaderContent>
          <h1><i className="fas fa-chart-line"></i> Earnings Call Sentiment Analysis</h1>
          <StatusIndicators>
            <StatusItem>
              <i className="fas fa-microphone"></i>
              <span>Recording:</span>
              <StatusBadge status={isRecording ? 'recording' : 'not-recording'}>
                {isRecording ? 'Recording…' : 'Not Recording'}
              </StatusBadge>
            </StatusItem>
          </StatusIndicators>
        </HeaderContent>
      </DashboardHeader>

      {/* Main Dashboard */}
      <DashboardMain>
        {/* Sidebar Controls */}
        <Sidebar>
          <SidebarSection>
            <h3><i className="fas fa-search"></i> Quick Lookup</h3>
            <FormGroup>
              <Label htmlFor="ticker-input">Stock Ticker</Label>
              <FormControl
                type="text"
                id="ticker-input"
                placeholder="e.g., AAPL, GOOGL"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
              />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <Label htmlFor="year-select">Year</Label>
                <Select
                  id="year-select"
                  value={yearSelect}
                  onChange={(e) => setYearSelect(e.target.value)}
                >
                  <option value="">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="quarter-select">Quarter</Label>
                <Select
                  id="quarter-select"
                  value={quarterSelect}
                  onChange={(e) => setQuarterSelect(e.target.value)}
                >
                  <option value="">All Quarters</option>
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </Select>
              </FormGroup>
            </FormRow>
            <Button variant="primary" onClick={async () => {
              if (!tickerInput.trim()) {
                addNotification('Please enter a ticker symbol.', 'warning');
                return;
              }
              if (!yearSelect) {
                addNotification('Please select a year.', 'warning');
                return;
              }
              if (!quarterSelect) {
                addNotification('Please select a quarter.', 'warning');
                return;
              }
              
              setIsLoading(true);
              setLoadingMessage('Fetching historical analysis...');
              try {
                console.log('Fetching analysis for:', tickerInput, yearSelect, quarterSelect);
                const result = await fetchHistoricalAnalysis(tickerInput.trim().toUpperCase(), parseInt(yearSelect), parseInt(quarterSelect));
                console.log('Analysis result:', result);
                
                if (result.success) {
                  setSentimentResults(result.data);
                  addNotification('Analysis complete!', 'success');
                } else {
                  addNotification(result.error || 'Analysis failed.', 'error');
                }
              } catch (e) {
                console.error('Error fetching analysis:', e);
                addNotification('Error fetching analysis. Please try again.', 'error');
              }
              setIsLoading(false);
            }}>
              <i className="fas fa-search"></i> Get Sentiment
            </Button>
          </SidebarSection>

          <SidebarSection>
            <h3><i className="fas fa-microphone"></i> Live Recording</h3>
            <FormGroup>
              <Label htmlFor="recording-company">Company</Label>
              <FormControl
                type="text"
                id="recording-company"
                placeholder="Company ticker"
                value={recordingCompany}
                onChange={(e) => setRecordingCompany(e.target.value)}
              />
            </FormGroup>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="success"
                onClick={startRecording}
                disabled={isRecording}
              >
                <i className="fas fa-play"></i> Start Recording
              </Button>
              <Button
                variant="danger"
                            onClick={stopRecording}
            disabled={!isRecording}
              >
                <i className="fas fa-stop"></i> Stop Recording
              </Button>
            </div>
          </SidebarSection>

          <SidebarSection>
            <h3><i className="fas fa-upload"></i> Upload Audio</h3>
            <FormGroup>
              <Label htmlFor="upload-company">Company</Label>
              <FormControl
                type="text"
                id="upload-company"
                placeholder="Company ticker"
                value={uploadCompany}
                onChange={(e) => setUploadCompany(e.target.value)}
              />
            </FormGroup>
            <UploadArea>
              <FileInput
                type="file"
                id="audio-upload"
                accept="audio/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    addNotification('Please select an audio file.', 'warning');
                    return;
                  }
                  
                  if (!uploadCompany) {
                    addNotification('Please enter a company name.', 'warning');
                    return;
                  }
                  
                  // Auto-debug if file is problematic
                  console.log(`📁 Selected file: ${file.name} (${file.size} bytes, ${file.type})`);
                  
                  setIsLoading(true);
                  setLoadingMessage('Uploading and analyzing audio...');
                  addNotification('Uploading and analyzing audio...', 'info');
                  
                  try {
                    const result = await processAudio(file, uploadCompany, uploadCompany);
                    if (result.success) {
                      setSentimentResults(result.data);
                      addNotification('Audio analysis complete!', 'success');
                    } else {
                      addNotification(result.error || 'Audio analysis failed.', 'error');
                    }
                  } catch (e) {
                    console.error('❌ Audio processing error:', e);
                    
                    // Auto-run debug on error
                    console.log('🔧 Running automatic audio debug...');
                    addNotification('Running audio file diagnostics...', 'info');
                    const debugResult = await debugAudio(file);
                    
                    if (debugResult?.debug) {
                      const fileInfo = debugResult.debug.fileInfo;
                      const whisperResp = debugResult.debug.whisperResponse;
                      
                      let debugMessage = `Audio Debug Info:
                      • File: ${fileInfo.originalName} (${fileInfo.size} bytes)
                      • Format: ${fileInfo.detectedFormat}
                      • MIME: ${fileInfo.mimeType}`;
                      
                      if (whisperResp) {
                        debugMessage += `
                        • Duration: ${whisperResp.duration}s
                        • Language: ${whisperResp.language}
                        • Speech detected: ${whisperResp.hasText ? 'Yes' : 'No'}`;
                      }
                      
                      console.log('🔍 Debug info:', debugMessage);
                      addNotification('Check browser console for detailed audio debug info', 'info');
                    }
                  }
                  setIsLoading(false);
                }}
              />
              <UploadLabel htmlFor="audio-upload">
                <i className="fas fa-cloud-upload-alt"></i>
                <span>Choose Audio File</span>
              </UploadLabel>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                Supported formats: MP3, WAV, M4A, OGG, WebM
              </div>
            </UploadArea>
          </SidebarSection>

          <SidebarSection>
            <h3><i className="fas fa-list"></i> Bulk Analysis</h3>
            <FormGroup>
              <Label htmlFor="bulk-tickers">Stock Tickers (comma-separated)</Label>
              <TextArea
                id="bulk-tickers"
                placeholder="AAPL, GOOGL, MSFT, AMZN"
                rows={3}
                value={bulkTickers}
                onChange={(e) => setBulkTickers(e.target.value)}
              />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <Label htmlFor="bulk-year">Year</Label>
                <Select
                  id="bulk-year"
                  value={bulkYear}
                  onChange={(e) => setBulkYear(e.target.value)}
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="bulk-quarter">Quarter</Label>
                <Select
                  id="bulk-quarter"
                  value={bulkQuarter}
                  onChange={(e) => setBulkQuarter(e.target.value)}
                >
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </Select>
              </FormGroup>
            </FormRow>
            <Button variant="secondary" onClick={async () => {
              const tickers = bulkTickers.split(',').map(t => t.trim()).filter(Boolean);
              if (!tickers.length || !bulkYear || !bulkQuarter) {
                addNotification('Please enter tickers, year, and quarter.', 'warning');
                return;
              }
              
              console.log('Starting bulk analysis for:', tickers, bulkYear, bulkQuarter);
              setIsLoading(true);
              setLoadingMessage('Running bulk analysis...');
              
              try {
                const result = await analyzeBulk(tickers, parseInt(bulkYear), parseInt(bulkQuarter));
                console.log('Bulk analysis result:', result);
                console.log('Result success:', result.success);
                console.log('Result data:', result.data);
                console.log('Result data.results:', result.data?.results);
                
                if (result.success && result.data && result.data.results) {
                  // Convert array to object for easier frontend handling
                  const bulkResultsObject = result.data.results.reduce((acc, cur) => {
                    console.log('Processing result:', cur);
                    if (cur.success) {
                      acc[cur.ticker] = cur;
                    }
                    return acc;
                  }, {});
                  
                  console.log('Processed bulk results object:', bulkResultsObject);
                  console.log('Setting bulk results with:', bulkResultsObject);
                  setBulkResults(bulkResultsObject);
                  
                  const successCount = result.data.results.filter(r => r.success).length;
                  const totalCount = result.data.results.length;
                  
                  console.log('Success count:', successCount, 'Total count:', totalCount);
                  
                  if (successCount > 0) {
                    addNotification(`Bulk analysis complete! ${successCount}/${totalCount} successful.`, 'success');
                  } else {
                    addNotification('Bulk analysis completed but no results were successful.', 'warning');
                  }
                  
                  // Show errors if any
                  if (result.data.errors && result.data.errors.length > 0) {
                    console.log('Bulk analysis errors:', result.data.errors);
                    result.data.errors.forEach(error => {
                      addNotification(`${error.ticker}: ${error.error}`, 'error');
                    });
                  }
                } else {
                  console.error('Bulk analysis failed:', result);
                  addNotification(result.error || 'Bulk analysis failed.', 'error');
                }
              } catch (e) {
                console.error('Error running bulk analysis:', e);
                addNotification('Error running bulk analysis. Please try again.', 'error');
              } finally {
                setIsLoading(false);
              }
            }}>
              <i className="fas fa-chart-bar"></i> Analyze All
            </Button>
          </SidebarSection>
        </Sidebar>

        {/* Main Content Area */}
        <MainContent>
          {/* Real-time Sentiment Chart */}
          <ContentSection>
            <SectionHeader>
              <h2><i className="fas fa-chart-line"></i> Real-time Sentiment Analysis</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="outline" onClick={clearChart}>
                  Clear Chart
                </Button>
                <Button variant="outline" onClick={exportChart}>
                  Export Chart
                </Button>
              </div>
            </SectionHeader>
            <ChartContainer>
              <Line data={sentimentChartData} options={sentimentChartOptions} />
            </ChartContainer>
            <RealTimeUpdates>
              {realtimeUpdates.map((update, index) => (
                <RealTimeUpdate key={index}>
                  <UpdateHeader>
                    <UpdateTime>
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </UpdateTime>
                    <SentimentScore sentiment={getSentimentClass(update.sentiment_score)}>
                      {update.sentiment_score.toFixed(3)}
                    </SentimentScore>
                  </UpdateHeader>
                  <TranscriptChunk>{update.transcript_chunk}</TranscriptChunk>
                </RealTimeUpdate>
              ))}
            </RealTimeUpdates>
            {sentimentResults && (
              <ContentSection style={{marginBottom: '1.5rem', background: '#f0f9ff', boxShadow: '0 1px 8px 0 rgba(59,130,246,0.07)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem 2rem'}}>
                  <div>
                    <div style={{fontWeight: 700, fontSize: '1.1rem'}}>Company</div>
                    <div>{sentimentResults.company || sentimentResults.ticker}</div>
                  </div>
                  <div>
                    <div style={{fontWeight: 700, fontSize: '1.1rem'}}>Overall Sentiment</div>
                    <SentimentScore sentiment={getSentimentClass(sentimentResults.overall_sentiment)}>
                      {sentimentResults.overall_sentiment.toFixed(3)}
                    </SentimentScore>
                  </div>
                  <div>
                    <div style={{fontWeight: 700, fontSize: '1.1rem'}}>Year/Quarter</div>
                    <div>{sentimentResults.year} / Q{sentimentResults.quarter}</div>
                  </div>
                </div>
              </ContentSection>
            )}
          </ContentSection>

          {/* Results Display */}
          <ContentSection>
            <SectionHeader>
              <h2>
                <i className="fas fa-analytics"></i> 
                Analysis Results
                {bulkResults && (
                  <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                    - {currentView.charAt(0).toUpperCase() + currentView.slice(1)} View
                  </span>
                )}
              </h2>
              <ViewControls>
                <ViewButton
                  variant="outline"
                  $active={currentView === 'summary'}
                  onClick={() => setCurrentView('summary')}
                >
                  Summary
                </ViewButton>
                <ViewButton
                  variant="outline"
                  $active={currentView === 'detailed'}
                  onClick={() => setCurrentView('detailed')}
                >
                  Detailed
                </ViewButton>
                <ViewButton
                  variant="outline"
                  $active={currentView === 'transcript'}
                  onClick={() => setCurrentView('transcript')}
                >
                  Transcript
                </ViewButton>
                {(sentimentResults || bulkResults) && (
                  <Button variant="outline" size="sm" onClick={clearResults}>
                    <i className="fas fa-trash"></i> Clear
                  </Button>
                )}
              </ViewControls>
            </SectionHeader>
            <ResultsContainer>
              {renderResults()}
            </ResultsContainer>
          </ContentSection>

          {/* Summary Statistics */}
          <ContentSection>
            <SectionHeader>
              <h2><i className="fas fa-chart-bar"></i> Analysis Summary</h2>
            </SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Total Analyses</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#3b82f6' }}>
                  {(sentimentResults ? 1 : 0) + (bulkResults ? Object.keys(bulkResults).length : 0)}
                </p>
              </div>
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Average Sentiment</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
                  {(() => {
                    const allSentiments = [];
                    if (sentimentResults && sentimentResults.overall_sentiment !== undefined) {
                      allSentiments.push(sentimentResults.overall_sentiment);
                    }
                    if (bulkResults && Object.keys(bulkResults).length > 0) {
                      Object.values(bulkResults).forEach(result => {
                        if (result.overall_sentiment !== undefined) {
                          allSentiments.push(result.overall_sentiment);
                        }
                      });
                    }
                    
                    if (allSentiments.length > 0) {
                      const avg = allSentiments.reduce((sum, sentiment) => sum + sentiment, 0) / allSentiments.length;
                      return avg.toFixed(3);
                    }
                    return 'N/A';
                  })()}
                </p>
              </div>
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Real-time Updates</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>
                  {realtimeUpdates.length}
                </p>
              </div>
            </div>
          </ContentSection>
        </MainContent>
      </DashboardMain>

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingOverlay>
          <LoadingContent>
            <Spinner />
            <h3>Processing Earnings Call...</h3>
            <p>{loadingMessage}</p>
          </LoadingContent>
        </LoadingOverlay>
      )}

      {/* Notification Container */}
      <NotificationContainer>
        {notifications.map((notification) => (
          <Notification key={notification.id} type={notification.type}>
            <i className={getNotificationIcon(notification.type)}></i>
            <span>{notification.message}</span>
            <NotificationClose
              onClick={() => closeNotification(notification.id)}
            >
              <i className="fas fa-times"></i>
            </NotificationClose>
          </Notification>
        ))}
      </NotificationContainer>
    </DashboardContainer>
  );
};

export default CorporateEvents;

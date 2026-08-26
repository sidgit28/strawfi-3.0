import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { config } from '@/lib/config';

const WS_URL = config.websocket.url;

export function usePresence(researchId) {
  const [editors, setEditors] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const supabase = useSupabaseClient();

  const connect = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const socket = new WebSocket(WS_URL);
    setWs(socket);

    socket.onopen = () => {
      setIsConnected(true);
      // Send initial start_edit message
      const teamName = localStorage.getItem('team_name') || 'Team Member';
      const teamId = localStorage.getItem('team_id') || 'unknown';
      socket.send(JSON.stringify({
        type: 'start_edit',
        researchId,
        teamName: teamName,
        teamId: teamId
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'editors_update' && data.editors[researchId]) {
        setEditors(data.editors[researchId]);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setEditors([]);
    };

    return socket;
  }, [researchId, supabase]);

  useEffect(() => {
    const socket = connect();

    return () => {
      if (socket) {
        // Send stop_edit message before closing
        const teamName = localStorage.getItem('team_name') || 'Team Member';
        const teamId = localStorage.getItem('team_id') || 'unknown';
        socket.send(JSON.stringify({
          type: 'stop_edit',
          researchId,
          teamName: teamName,
          teamId: teamId
        }));
        socket.close();
      }
    };
  }, [connect, researchId]);

  return {
    editors,
    isConnected
  };
} 
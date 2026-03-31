import { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface WebSocketMessage {
  title: string;
  message: string;
  type: 'Reminder' | 'Warning' | 'Info';
}

export const useWebSockets = (onNotificationReceived?: () => void) => {
  const connect = useCallback(() => {
    const socket = new WebSocket('ws://localhost:8001/ws/notifications/');

    socket.onmessage = (event) => {
      // Trigger Toast
      const data: WebSocketMessage = JSON.parse(event.data);

      if (data.type === 'Warning') {
        toast.error(`${data.title}: ${data.message}`);
      } else if (data.type === 'Reminder') {
        toast(`${data.title}: ${data.message}`);
      } else {
        toast.success(`${data.title}: ${data.message}`);
      }

      if (onNotificationReceived) {
        onNotificationReceived();
      }
    };

    socket.onclose = (e) => {
      console.log('Socket is closed. Reconnecting in 5 seconds...', e.reason);
      setTimeout(() => {
        connect();
      }, 5000);
    };

    socket.onerror = (err) => {
      console.error('Socket encountered error: ', err, 'Closing socket');
      socket.close();
    };

    return socket;
  }, [onNotificationReceived]);

  useEffect(() => {
    const socket = connect();
    return () => socket.close();
  }, [connect]);
};

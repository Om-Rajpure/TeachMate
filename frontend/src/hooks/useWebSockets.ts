import { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import type { ToastOptions } from 'react-toastify';

interface WebSocketMessage {
  title: string;
  message: string;
  type: 'Reminder' | 'Warning' | 'Info';
}

export const useWebSockets = (onNotificationReceived?: () => void) => {
  const connect = useCallback(() => {
    const socket = new WebSocket('ws://localhost:8001/ws/notifications/');

    socket.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data);
      
      // Trigger Toast
      const toastOptions: ToastOptions = {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      };

      if (data.type === 'Warning') {
        toast.error(`${data.title}: ${data.message}`, toastOptions);
      } else if (data.type === 'Reminder') {
        toast.info(`${data.title}: ${data.message}`, toastOptions);
      } else {
        toast.success(`${data.title}: ${data.message}`, toastOptions);
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

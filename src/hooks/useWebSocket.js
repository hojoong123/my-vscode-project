import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function useWebSocket(subscriptions = []) {
  const clientRef = useRef(null);

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS("/ws"),
      reconnectDelay: 5000,
      onConnect: () => {
        subscriptions.forEach(({ topic, callback }) => {
          stompClient.subscribe(topic, (msg) => {
            callback(JSON.parse(msg.body));
          });
        });
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      if (clientRef.current) clientRef.current.deactivate();
    };
  }, []);

  return clientRef;
}
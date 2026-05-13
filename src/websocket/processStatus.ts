import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Store connections mapped by process_uuid
const clients = new Map<string, Set<WebSocket>>();

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    let subscribedProcess: string | null = null;

    ws.on('message', (message) => {
      try {
        const { action, process_uuid } = JSON.parse(message.toString());

        if (action === 'subscribe' && process_uuid) {
          subscribedProcess = process_uuid;

          if (!clients.has(process_uuid)) {
            clients.set(process_uuid, new Set());
          }
          clients.get(process_uuid)!.add(ws);

          ws.send(JSON.stringify({ type: 'subscribed', process_uuid }));
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      if (subscribedProcess) {
        clients.get(subscribedProcess)?.delete(ws);
      }
    });
  });
}

// Call this whenever a process status changes
export function broadcastStatusUpdate(process_uuid: string, status: string) {
  const connections = clients.get(process_uuid);
  if (!connections) return;

  const payload = JSON.stringify({ type: 'status_update', process_uuid, status });

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}
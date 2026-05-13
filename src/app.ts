import '@/config/env.js';
import App from "@/server.js";
import { initWebSocket } from '@/websocket/processStatus.js';

const port = process.env.PORT ?? 3500;
const server = App.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

initWebSocket(server);

server.on("error", (err) => {
    console.error("Server error:", err);
});



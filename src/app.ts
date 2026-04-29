import './config/env.js';
import App from "./server.js";

App.listen(process.env.PORT, () => {
    console.log("Server running on port 3200")
})

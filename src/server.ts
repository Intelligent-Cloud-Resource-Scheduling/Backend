import express, { type Request, type Response } from "express";
// import userExampleRoutes from '@/routes/user-Example-route.js';
import userRoutes from '@/routes/userRoutes.js'
import adminRoutes from '@/routes/adminRoutes.js';
import planRoutes from '@/routes/planRoutes.js';
import processRoutes from '@/routes/processRoutes.js';
import vidoeRoutes from '@/routes/videoRoutes.js';
import { errorHandler } from '@/middlewares/error.js';
import { requestId } from '@/middlewares/requestId.js';
import cors from "cors";

declare global {
    interface BigInt {
        toJSON(): Number;
    }
}
BigInt.prototype.toJSON = function () { return Number(this) }

const App = express();

App.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));


App.use(express.json());
App.use(requestId);

// App.use('/users', userExampleRoutes);
App.use('/users', userRoutes);
App.use('/admins', adminRoutes);
App.use('/plans', planRoutes);
App.use('/processes', processRoutes);
App.use('/videos', vidoeRoutes);

App.get("/", (req: Request, res: Response) => {
    res.send(`Server is running, main route.`)
})

App.use(errorHandler);

export default App;

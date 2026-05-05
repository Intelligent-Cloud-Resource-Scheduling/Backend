import express, { type Request, type Response } from "express";
// import userExampleRoutes from '@/routes/user-Example-route.js';
import userRoutes from '@/routes/userRoutes.js'
import adminRoutes from '@/routes/adminRoutes.js';
import planRoutes from '@/routes/planRoutes.js';
import vidoeRoutes from '@/routes/videoRoutes.js';
import { errorHandler } from '@/middlewares/error.js';
import { requestId } from '@/middlewares/requestId.js';

declare global {
    interface BigInt {
        toJSON(): Number;
    }
}
BigInt.prototype.toJSON = function () { return Number(this) }

const App = express();


App.use(express.json());
App.use(requestId);

// App.use('/users', userExampleRoutes);
App.use('/users', userRoutes);
App.use('/admins', adminRoutes);
App.use('/plans', planRoutes);
App.use('/videos', vidoeRoutes);

App.get("/", (req: Request, res: Response) => {
    res.send(`Server is running, main route.`)
})

App.use(errorHandler);

export default App;

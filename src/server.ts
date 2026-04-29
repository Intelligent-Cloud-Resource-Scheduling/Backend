import express, {type Request, type Response} from "express";
import userExampleRoutes from '@/routes/user-Example-route.js';
import { errorHandler } from '@/middlewares/error.js';
import { requestId } from '@/middlewares/requestId.js';

const App = express();


App.use(express.json());
App.use(requestId);

App.use('/users', userExampleRoutes);

App.get("/", (req: Request, res: Response)=>{
    res.send(`Server is running, main route`)
})

App.use(errorHandler);

export default App;
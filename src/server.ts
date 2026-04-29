import express, {type Request, type Response} from "express";

const App = express();

App.get("/", (req: Request, res: Response)=>{
    res.send(`Server is running, main route`)
})

export default App;
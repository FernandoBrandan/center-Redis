import Express from "express";
const app = Express();
app.use(Express.json());
import router from "./routes/route";
app.use("/api/redis", router);
export default app;
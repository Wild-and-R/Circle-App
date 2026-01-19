import express from "express"; 
import dotenv from "dotenv";
import appRoutes from "./routes/app-route";
import { corsMiddleware } from "./middlewares/cors";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(corsMiddleware);
app.use(express.json());

app.use("/api/v1", appRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
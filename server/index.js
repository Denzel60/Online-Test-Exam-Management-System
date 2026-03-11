import express from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();

import userRoutes from './src/routes/user.routes.js';
import testRoutes from './src/routes/test.routes.js';
import attemptRoutes from "./src/routes/attempt.routes.js";
import oversightRoutes from "./src/routes/oversight.routes.js";

const app = express();

app.use(express.json());

app.use(cors(
    {
        origin: "http://localhost:5173",
        methods:["GET","POST","PATCH","DELETE"],
        credentials: true,
    }
));
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());

app.use('/api/users', userRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/student/tests", attemptRoutes);
app.use("/api/oversight", oversightRoutes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
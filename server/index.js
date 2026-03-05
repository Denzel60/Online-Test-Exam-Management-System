import express from 'express';
import dotenv from "dotenv";
dotenv.config();

import userRoutes from './src/routes/user.routes.js';
import testRoutes from './src/routes/test.routes.js';

const app = express();

app.use(express.json());

app.use('/users', userRoutes);
app.use("/api/tests", testRoutes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
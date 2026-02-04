import express from 'express';
import "dotenv/config";

import userRoutes from './src/routes/user.routes.js';

const app = express();

app.use('/users', userRoutes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
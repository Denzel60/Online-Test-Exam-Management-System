import { Router } from 'express';
import { loginUser, createUser, updateUserRole, deleteUser } from '../controllers/user.controllers.js';
import validateUser from '../middlewares/validateUser.middleware.js';
import { authenticate } from "../middlewares/auth.middlewares.js";
import { studentOnly, teacherOnly, adminOnly } from "../middlewares/roles.middlewares.js";
import { refreshToken } from './auth.routes.js';

const router = Router();

// Define user-related routes here
router.post('/loginUser', authenticate, studentOnly, loginUser);

router.post('/createUser', validateUser, createUser);

router.patch(
  "/role/:id",
  authenticate,
  adminOnly,
  updateUserRole
);

router.delete('/deleteUser/:id', authenticate, deleteUser); 

export default router;
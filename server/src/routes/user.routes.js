import { Router } from 'express';
import { loginUser, createUser, updateUser, deleteUser } from '../controllers/user.controllers.js';
// import validateUser from '../middlewares/validateUser.middleware.js';

const router = Router();

// Define user-related routes here
router.post('/loginUser', loginUser);

router.post('/createUser', createUser);

router.patch('/updateUser/:id', updateUser);

router.delete('/deleteUser/:id', deleteUser); 

export default router;
import {Router} from "express";
import { loginController, logoutController, ProfileController, registerController } from "../controllers/user.controller.js";
import protect from "../middleware/auth.js";

const router = Router();


router.post("/register", registerController);

router.post("/login", loginController)

router.get('/profile' ,protect, ProfileController)

router.post('/logout' ,protect, logoutController)


export default router;
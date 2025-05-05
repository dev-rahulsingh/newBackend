import { Router } from "express";
import {
  loginOut,
  loginUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.midleware.js";

const router = Router();
router.route("/register").post(
  // middleware injected
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
// secure routes
// verifyJWT is middleware as in last we mention next()
router.route("/logout").post(verifyJWT, loginOut);

export default router;

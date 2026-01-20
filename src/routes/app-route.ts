import express from "express";
import { registerUser, loginUser } from "../controllers/auth";
import {
  createThread,
  getThreads,
  getThreadById,
  updateThread,
  deleteThread,
} from "../controllers/thread";
import { toggleLikeThread } from "../controllers/like";
import { authenticate } from "../middlewares/auth";
import { upload } from "../utils/multer";

const router = express.Router();

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Thread Routes
router.get("/threads", authenticate,getThreads);
router.post("/thread", authenticate, upload.single("image"), createThread);

router.get("/thread/:id", getThreadById);
router.put("/thread/:id", authenticate, upload.single("image"), updateThread);
router.delete("/thread/:id", authenticate, deleteThread);

// Like Routes

// Like / Unlike thread (toggle)
router.post(
  "/threads/:id/like",
  authenticate,
  toggleLikeThread
);

export default router;

import express from "express";
import { registerUser, loginUser } from "../controllers/auth";
import {
  createThread,
  getThreads,
  getThreadById,
  updateThread,
  deleteThread,
} from "../controllers/thread";
import {
  createReply,
  getRepliesByThread,
  updateReply,
  deleteReply,
} from "../controllers/reply";
import { toggleLikeThread } from "../controllers/like";
import { updateUserProfile, getCurrentUserProfile } from "../controllers/user";
import { authenticate } from "../middlewares/auth";
import { upload } from "../utils/multer";


const router = express.Router();

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Thread Routes
router.get("/threads", authenticate, getThreads);
router.post("/thread", authenticate, upload.single("image"), createThread);

router.get("/thread/:id", authenticate, getThreadById);
router.put("/thread/:id", authenticate, upload.single("image"), updateThread);
router.delete("/thread/:id", authenticate, deleteThread);

// Like / Unlike thread (toggle)
router.post(
  "/threads/:id/like",
  authenticate,
  toggleLikeThread
);

// Replies
router.post(
  "/thread/:id/replies",
  authenticate,
  upload.single("image"),
  createReply
);

router.get(
  "/thread/:id/replies",
  authenticate,
  getRepliesByThread
);

router.put(
  "/replies/:id",
  authenticate,
  upload.single("image"),
  updateReply
);

router.delete(
  "/replies/:id",
  authenticate,
  deleteReply
);

// User
router.put("/user/profile/me", authenticate, upload.single("photo_profile"), updateUserProfile)
router.get("/user/profile/me", authenticate, getCurrentUserProfile)
export default router;

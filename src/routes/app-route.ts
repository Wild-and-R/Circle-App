import express from "express";
import { registerUser, loginUser } from "../controllers/auth";
import {
  createThread,
  getThreads,
  getThreadById,
  getMyPosts,
  getUserPostsById,
} from "../controllers/thread";
import {
  createReply,
  getRepliesByThread,
} from "../controllers/reply";
import {
  getFollowing,
  getFollowers,
  followUser,
  unfollowUser,
  getSuggestedUsers,
} from "../controllers/follow";
import { toggleLikeThread } from "../controllers/like";
import { updateUserProfile, getCurrentUserProfile, getMyFollowStats, searchUsers, getUserFollowStatsById, getUserProfileById } from "../controllers/user";
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

router.get("/posts/me", authenticate, getMyPosts);

// User
router.put("/user/profile/me", authenticate, upload.single("photo_profile"), updateUserProfile)
router.get("/user/profile/me", authenticate, getCurrentUserProfile)
router.get("/users/me/stats", authenticate, getMyFollowStats);


// Get list of users that user is following
router.get("/follows/:userId/following", authenticate, getFollowing);

// Get list of followers for a user
router.get("/follows/:userId/followers", authenticate, getFollowers);

// Follow a user
router.post("/follows/:userId/follow", authenticate, followUser);

// Unfollow a user
router.delete("/follows/:userId/unfollow", authenticate, unfollowUser);

//suggested users to follow
router.get("/users/suggested", authenticate, getSuggestedUsers);

// search users
router.get("/users/search", authenticate, searchUsers);

// User profile by id
router.get("/users/:id", authenticate, getUserProfileById);
router.get("/users/:id/stats", authenticate, getUserFollowStatsById);

// User posts by id
router.get("/posts/user/:id", authenticate, getUserPostsById);

export default router;

import { Request, Response, NextFunction } from "express";
import { prisma } from "../connections/client";
import AppError from "../utils/app-error";
import { sendFollowUpdate } from "../websocket/websocket";

// Get users that a given user is following
export async function getFollowing(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.userId);
    const following = await prisma.following.findMany({
      where: { follower_id: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
            bio: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: following.map(f => f.following),
    });
  } catch (err) {
    next(err);
  }
}

// Get users that follow a given user
export async function getFollowers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.userId);
    const followers = await prisma.following.findMany({
      where: { following_id: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
            bio: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: followers.map(f => f.follower),
    });
  } catch (err) {
    next(err);
  }
}

// Follow a user
export async function followUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.currentUser.id; // logged in user
    const targetUserId = Number(req.params.userId);

    if (userId === targetUserId) {
      return next(new AppError("You cannot follow yourself", 400));
    }

    // Check if already following
    const existing = await prisma.following.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: userId,
          following_id: targetUserId,
        },
      },
    });

    if (existing) {
      return next(new AppError("Already following this user", 400));
    }

    await prisma.following.create({
      data: {
        follower_id: userId,
        following_id: targetUserId,
      },
    });

    // Emit real-time follow counts
    sendFollowUpdate(userId, 0, 1); // you gained +1 following
    sendFollowUpdate(targetUserId, 1, 0); // target gained +1 follower

    res.status(201).json({ status: "success" });
  } catch (err) {
    next(err);
  }
}

// Unfollow a user
export async function unfollowUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.currentUser.id; // logged in user
    const targetUserId = Number(req.params.userId);

    const existing = await prisma.following.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: userId,
          following_id: targetUserId,
        },
      },
    });

    if (!existing) {
      return next(new AppError("You are not following this user", 400));
    }

    await prisma.following.delete({
      where: {
        follower_id_following_id: {
          follower_id: userId,
          following_id: targetUserId,
        },
      },
    });

    // Emit real-time follow counts
    sendFollowUpdate(userId, 0, -1); // you lost 1 following
    sendFollowUpdate(targetUserId, -1, 0); // target lost 1 follower

    res.status(204).json({ status: "success" });
  } catch (err) {
    next(err);
  }
}

// Get suggested users to follow
export async function getSuggestedUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUserId = res.locals.currentUser.id;

    // Get IDs of users the current user already follows
    const following = await prisma.following.findMany({
      where: { follower_id: currentUserId },
      select: { following_id: true },
    });

    const followingIds = following.map(f => f.following_id);
    followingIds.push(currentUserId); // exclude self

    // Fetch up to 5 users that are not followed by current user
    const suggested = await prisma.user.findMany({
      where: { id: { notIn: followingIds } },
      take: 5,
      select: {
        id: true,
        username: true,
        full_name: true,
        photo_profile: true,
        bio: true,
      },
    });

    res.status(200).json({ data: suggested });
  } catch (err) {
    next(err);
  }
};

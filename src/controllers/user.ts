import { Request, Response, NextFunction } from "express";
import { prisma } from "../connections/client";
import AppError from "../utils/app-error";

// Update user profile with optional profile picture
export async function updateUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = res.locals.currentUser.id;
    const { full_name, bio } = req.body;
    const profileImage = req.file ? req.file.filename : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        full_name: full_name || undefined,
        bio: bio || undefined,
        photo_profile: profileImage || undefined,
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        bio: true,
        photo_profile: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (err) {
    next(err);
  }
}

// GET current logged-in user profile
export async function getCurrentUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = res.locals.currentUser.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        bio: true,
        photo_profile: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

//Get follow stats
export async function getMyFollowStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = res.locals.currentUser.id;

    const [followers, following] = await Promise.all([
      prisma.following.count({
        where: { following_id: userId },
      }),
      prisma.following.count({
        where: { follower_id: userId },
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        followers,
        following,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Search users by username or full_name
export async function searchUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const q = (req.query.q as string)?.trim();
    const currentUserId = res.locals.currentUser.id;

    if (!q) {
      return res.status(200).json({
        status: "success",
        data: { users: [] },
      });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            full_name: {
              contains: q,
              mode: "insensitive",
            },
          },
        ],
        NOT: {
          id: currentUserId, // don't show yourself
        },
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        bio: true,
        photo_profile: true,
        followers: {
          where: {
            follower_id: currentUserId,
          },
          select: { id: true },
        },
      },
      take: 10,
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      bio: u.bio,
      photo_profile: u.photo_profile,
      isFollowing: u.followers.length > 0,
    }));

    res.status(200).json({
      status: "success",
      data: {
        users: formattedUsers,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Get user profile by ID
export async function getUserProfileById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        full_name: true,
        bio: true,
        photo_profile: true,
        created_at: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// Get follow stats by user ID
export async function getUserFollowStatsById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = Number(req.params.id);

    const [followers, following] = await Promise.all([
      prisma.following.count({
        where: { following_id: userId },
      }),
      prisma.following.count({
        where: { follower_id: userId },
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        followers,
        following,
      },
    });
  } catch (err) {
    next(err);
  }
}

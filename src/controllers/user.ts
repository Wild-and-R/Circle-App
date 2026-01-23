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
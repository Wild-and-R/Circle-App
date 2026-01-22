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
    const { username, bio } = req.body;
    const profileImage = req.file ? req.file.filename : undefined;

    // OR conditions for unique checks
    const orConditions: any[] = [];
    if (username) orConditions.push({ username });

    if (orConditions.length > 0) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: orConditions,
          NOT: { id: userId }, // exclude current user
        },
      });

      if (existingUser) {
        return next(new AppError("Username or email already taken", 400));
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username || undefined,
        bio: bio || undefined,
        photo_profile: profileImage || undefined,
      },
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
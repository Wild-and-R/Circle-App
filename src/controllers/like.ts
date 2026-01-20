import { Request, Response, NextFunction } from "express";
import { prisma } from "../connections/client";
import AppError from "../utils/app-error";

// Like / Unlike Thread (toggle)
export async function toggleLikeThread(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const threadId = Number(req.params.id);
    const userId = res.locals.currentUser.id;

    // Check thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return next(new AppError("Thread not found", 404));
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        user_id_thread_id: {
          user_id: userId,
          thread_id: threadId,
        },
      },
    });

    // Unlike
    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      return res.status(200).json({
        status: "success",
        message: "Thread unliked",
      });
    }

    // Like
    await prisma.like.create({
      data: {
        user_id: userId,
        thread_id: threadId,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Thread liked",
    });
  } catch (error) {
    next(error);
  }
}

import { Request, Response, NextFunction } from "express";
import { prisma } from "../connections/client";
import AppError from "../utils/app-error";

// Create Reply
export async function createReply(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const threadId = Number(req.params.id);
    const userId = res.locals.currentUser.id;
    const { content } = req.body;

    if (!content || !content.trim() || content.length > 500) {
      return next(new AppError("Invalid reply content", 400));
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return next(new AppError("Thread not found", 404));
    }

    const image = req.file ? req.file.filename : null;

    const reply = await prisma.reply.create({
      data: {
        content: content.trim(),
        image,
        user_id: userId,
        thread_id: threadId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            photo_profile: true,
          },
        },
      },
    });

    // keep counter in sync
    await prisma.thread.update({
      where: { id: threadId },
      data: {
        number_of_replies: {
          increment: 1,
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: { reply },
    });
  } catch (error) {
    next(error);
  }
}

// Get Replies by Thread
export async function getRepliesByThread(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const threadId = Number(req.params.id);

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return next(new AppError("Thread not found", 404));
    }

    const replies = await prisma.reply.findMany({
      where: { thread_id: threadId },
      orderBy: { created_at: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: { replies },
    });
  } catch (error) {
    next(error);
  }
}
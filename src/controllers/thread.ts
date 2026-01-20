import { Request, Response, NextFunction } from "express";
import { prisma } from "../connections/client";
import AppError from "../utils/app-error";

// Create Thread
export async function createThread(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { content } = req.body;
    const userId = res.locals.currentUser.id;

    if (!content || content.trim() === "") {
      return next(new AppError("Thread content is required", 400));
    }

    // multer file (optional)
    const image = req.file ? req.file.filename : null;

    const thread = await prisma.thread.create({
      data: {
        content,
        image,
        created_by: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: { thread },
    });
  } catch (error) {
    next(error);
  }
}

// Get all threads with pagination
export async function getThreads(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    const currentUserId = res.locals.currentUser?.id; // set in authenticate middleware

    const threads = await prisma.thread.findMany({
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
        likes: currentUserId ? { where: { user_id: currentUserId } } : false,
      },
    });

    // Format likedByMe
    const formatted = threads.map((t) => ({
      id: t.id,
      author: t.author,
      content: t.content,
      image: t.image,
      likes: t._count.likes,
      replies: t._count.replies,
      likedByMe: t.likes ? t.likes.length > 0 : false,
      createdAt: t.created_at,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
}



// Get Thread by ID
export async function getThreadById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const threadId = Number(req.params.id);
    const currentUserId = res.locals.currentUser?.id;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
          },
        },
        likes: currentUserId
          ? {
              where: { user_id: currentUserId },
              select: { id: true },
            }
          : false,
        replies: {
          orderBy: { created_at: "asc" },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                photo_profile: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
    });

    if (!thread) {
      return next(new AppError("Thread not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        thread: {
          ...thread,
          likedByMe: currentUserId ? thread.likes.length > 0 : false,
          likes: undefined, // remove internal likes array
        },
      },
    });
  } catch (error) {
    next(error);
  }
}


// Update Thread (Owner Only)
export async function updateThread(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const threadId = Number(req.params.id);
    const userId = res.locals.currentUser.id;
    const { content } = req.body;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return next(new AppError("Thread not found", 404));
    }

    if (thread.created_by !== userId) {
      return next(new AppError("You are not allowed to update this thread", 403));
    }

    const image = req.file ? req.file.filename : thread.image;

    const updatedThread = await prisma.thread.update({
      where: { id: threadId },
      data: {
        content: content ?? thread.content,
        image,
      },
    });

    res.status(200).json({
      status: "success",
      data: { thread: updatedThread },
    });
  } catch (error) {
    next(error);
  }
}

// Delete Thread (Owner only)
export async function deleteThread(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const threadId = Number(req.params.id);
    const userId = res.locals.currentUser.id;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return next(new AppError("Thread not found", 404));
    }

    if (thread.created_by !== userId) {
      return next(new AppError("You are not allowed to delete this thread", 403));
    }

    await prisma.thread.delete({
      where: { id: threadId },
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
}

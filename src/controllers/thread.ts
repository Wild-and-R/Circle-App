import { Request, Response, NextFunction } from "express";
import { prisma } from "../connections/client";
import AppError from "../utils/app-error";
import { enqueueThreadForProcessing } from "../queues/thread.queue";
import { sendThreadNotification } from "../websocket/websocket";
import redisClient from "../utils/redis";

/**
 * @swagger
 * components:
 *   schemas:
 *     Thread:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         image:
 *           type: string
 *           nullable: true
 *         created_by:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         likes:
 *           type: integer
 *         replies:
 *           type: integer
 *         likedByMe:
 *           type: boolean
 *       required:
 *         - id
 *         - content
 *         - created_by
 *         - created_at
 *         - likes
 *         - replies
 *         - likedByMe
 */

const MY_POSTS_CACHE_VERSION = "v1";

// Helper for consistent cache key
const getMyPostsCacheKey = (userId: number) =>
  `user:${userId}:posts:${MY_POSTS_CACHE_VERSION}`;

/**
 * @swagger
 * /posts/me:
 *   get:
 *     summary: Get all posts of the current logged-in user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Thread'
 *       500:
 *         description: Internal server error
 */
export async function getMyPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.currentUser.id;
    const cacheKey = getMyPostsCacheKey(userId);

    let cached: string | null = null;
    try {
      if (redisClient.isOpen) cached = await redisClient.get(cacheKey);
    } catch (err) {
      console.error("Redis get error:", err);
    }

    if (cached) {
      try {
        return res.status(200).json(JSON.parse(cached));
      } catch {
        if (redisClient.isOpen) await redisClient.del(cacheKey);
      }
    }

    const posts = await prisma.thread.findMany({
      where: { created_by: userId },
      orderBy: { created_at: "desc" },
      include: { _count: { select: { likes: true, replies: true } } },
    });

    const normalizedPosts = posts.map((p) => ({
      id: p.id,
      content: p.content,
      image: p.image,
      created_at: p.created_at,
      likes_count: p._count.likes,
      replies_count: p._count.replies,
    }));

    const response = {
      status: "success",
      data: { posts: normalizedPosts },
    };

    try {
      if (redisClient.isOpen) await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 });
    } catch (err) {
      console.error("Redis set error:", err);
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /thread:
 *   post:
 *     summary: Create a new thread (post)
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Thread'
 *       400:
 *         description: Invalid thread content
 */
export async function createThread(req: Request, res: Response, next: NextFunction) {
  try {
    const { content } = req.body;
    const userId = res.locals.currentUser.id;

    if (!content || !content.trim() || content.length > 500) {
      return res.status(400).json({ status: "error", message: "Invalid thread content" });
    }

    const image = req.file ? req.file.filename : null;

    const thread = await prisma.thread.create({
      data: { content: content.trim(), image, created_by: userId },
      include: {
        author: { select: { id: true, username: true, full_name: true, photo_profile: true } },
        _count: { select: { likes: true, replies: true } },
      },
    });

    // Invalidate cache
    if (redisClient.isOpen) await redisClient.del(getMyPostsCacheKey(userId));

    enqueueThreadForProcessing({
      id: thread.id,
      user_id: userId,
      content: thread.content,
      image: thread.image,
    });

    sendThreadNotification({
      id: thread.id,
      author: thread.author,
      content: thread.content,
      image: thread.image,
      likes: 0,
      replies: 0,
      likedByMe: false,
      createdAt: thread.created_at,
    });

    return res.status(201).json({ status: "success", message: "Thread created successfully", data: thread });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /threads:
 *   get:
 *     summary: Get all threads (with pagination)
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Maximum number of threads to return
 *     responses:
 *       200:
 *         description: List of threads
 */
export async function getThreads(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    const currentUserId = res.locals.currentUser?.id;

    const threads = await prisma.thread.findMany({
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        author: { select: { id: true, username: true, full_name: true, photo_profile: true } },
        _count: { select: { likes: true, replies: true } },
        likes: currentUserId ? { where: { user_id: currentUserId } } : false,
      },
    });

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

/**
 * @swagger
 * /thread/{id}:
 *   get:
 *     summary: Get thread by ID
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Thread detail
 */
export async function getThreadById(req: Request, res: Response, next: NextFunction) {
  try {
    const threadId = Number(req.params.id);
    const currentUserId = res.locals.currentUser?.id;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        author: { select: { id: true, username: true, full_name: true, photo_profile: true } },
        likes: currentUserId ? { where: { user_id: currentUserId }, select: { id: true } } : false,
        replies: {
          orderBy: { created_at: "asc" },
          include: { user: { select: { id: true, username: true, photo_profile: true } } },
        },
        _count: { select: { replies: true, likes: true } },
      },
    });

    if (!thread) return next(new AppError("Thread not found", 404));

    res.status(200).json({
      status: "success",
      data: {
        thread: { ...thread, likedByMe: currentUserId ? thread.likes.length > 0 : false, likes: undefined },
      },
    });
  } catch (error) {
    next(error);
  }
}

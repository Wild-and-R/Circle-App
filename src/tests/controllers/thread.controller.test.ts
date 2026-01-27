import request from "supertest";
import express from "express";

jest.mock("../../connections/client", () => ({
  prisma: {
    thread: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("../../utils/redis", () => ({
  __esModule: true,
  default: {
    isOpen: true,
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock("../../websocket/websocket", () => ({
  sendThreadNotification: jest.fn(),
}));

jest.mock("../../queues/thread.queue", () => ({
  enqueueThreadForProcessing: jest.fn(),
}));


import { prisma } from "../../connections/client";
import redisClient from "../../utils/redis";
import {
  getMyPosts,
  createThread,
  getThreads,
} from "../../controllers/thread";


const app = express();
app.use(express.json());

// Fake auth middleware
app.use((req, res, next) => {
  res.locals.currentUser = { id: 1 };
  next();
});

app.get("/posts/me", getMyPosts);
app.post("/thread", createThread);
app.get("/threads", getThreads);

describe("Thread Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /posts/me", () => {
    it("returns cached posts if present", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(
        JSON.stringify({
          status: "success",
          data: { posts: [{ id: 1, content: "cached post" }] },
        })
      );

      const res = await request(app).get("/posts/me");

      expect(res.status).toBe(200);
      expect(res.body.data.posts[0].content).toBe("cached post");
      expect(prisma.thread.findMany).not.toHaveBeenCalled();
    });

    it("fetches from DB if cache empty", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      (prisma.thread.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          content: "db post",
          image: null,
          created_at: new Date(),
          _count: { likes: 2, replies: 1 },
        },
      ]);

      const res = await request(app).get("/posts/me");

      expect(res.status).toBe(200);
      expect(prisma.thread.findMany).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe("POST /thread", () => {
    it("creates a thread", async () => {
      (prisma.thread.create as jest.Mock).mockResolvedValue({
        id: 1,
        content: "hello world",
        image: null,
        created_at: new Date(),
        author: {
          id: 1,
          username: "john",
          full_name: "John Doe",
          photo_profile: null,
        },
        _count: { likes: 0, replies: 0 },
      });

      const res = await request(app)
        .post("/thread")
        .send({ content: "hello world" });

      expect(res.status).toBe(201);
      expect(prisma.thread.create).toHaveBeenCalled();
      expect(redisClient.del).toHaveBeenCalled();
    });

    it("rejects invalid content", async () => {
      const res = await request(app)
        .post("/thread")
        .send({ content: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /threads", () => {
    it("returns formatted threads", async () => {
      (prisma.thread.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          content: "thread",
          image: null,
          created_at: new Date(),
          author: { id: 1, username: "john", full_name: "John", photo_profile: null },
          _count: { likes: 3, replies: 2 },
          likes: [{ id: 1 }],
        },
      ]);

      const res = await request(app).get("/threads");

      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty("likedByMe", true);
    });
  });
});

import request from "supertest";
import express from "express";
import bcrypt from "bcryptjs";
import { registerUser, loginUser } from "../../controllers/auth";
import { prisma } from "../../connections/client";
import AppError from "../../utils/app-error";

// Mock prisma client
jest.mock("../../connections/client", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock JWT signing
jest.mock("../../utils/jwt", () => ({
  signToken: jest.fn(() => "fake-jwt-token"),
}));

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
  compare: jest.fn().mockResolvedValue(true),
}));

const app = express();
app.use(express.json());

// Wrap async controllers so errors go to next()
const wrapAsync = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Register routes with async wrapper
app.post("/register", wrapAsync(registerUser));
app.post("/login", wrapAsync(loginUser));

// Error handler to catch AppError
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }
  res.status(500).json({ message: "Internal Server Error" });
});

describe("Auth Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    it("registers a new user successfully", async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // username check

      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        username: "john",
        full_name: "John Doe",
        email: "john@test.com",
      });

      const res = await request(app).post("/register").send({
        username: "john",
        full_name: "John Doe",
        email: "john@test.com",
        password: "12345",
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.token).toBe("fake-jwt-token");
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it("fails if required fields are missing", async () => {
      const res = await request(app).post("/register").send({
        email: "john@test.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "Username, email, and password are required"
      );
    });

    it("fails if email already exists", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: "john@test.com",
      });

      const res = await request(app).post("/register").send({
        username: "john",
        email: "john@test.com",
        password: "12345",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("Email already exists");
    });

    it("fails if username already exists", async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 2, username: "john" }); // username check

      const res = await request(app).post("/register").send({
        username: "john",
        email: "john@test.com",
        password: "12345",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("Username already exists");
    });
  });

  describe("POST /login", () => {
    it("logs in successfully", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        username: "john",
        email: "john@test.com",
        password: "hashed-password",
      });

      // Correct password
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const res = await request(app).post("/login").send({
        email: "john@test.com",
        password: "12345",
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.token).toBe("fake-jwt-token");
    });

    it("fails if email or password missing", async () => {
      const res = await request(app).post("/login").send({
        email: "john@test.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email and password are required");
    });

    it("fails if user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post("/login").send({
        email: "john@test.com",
        password: "12345",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("fails if password is incorrect", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: "john@test.com",
        password: "hashed-password",
      });

      // Wrong password
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const res = await request(app).post("/login").send({
        email: "john@test.com",
        password: "wrong-password",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid credentials");
    });
  });
});

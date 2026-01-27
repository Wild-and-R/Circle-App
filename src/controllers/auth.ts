import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../connections/client";
import { signToken } from "../utils/jwt";
import AppError from "../utils/app-error";

// Register
export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { username, full_name, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return next(
        new AppError("Username, email, and password are required", 400)
      );
    }

    // Email validation
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return next(new AppError("Invalid email format", 400));
    }

    // Password validation
    if (password.length < 5) {
      return next(
        new AppError("Password must be at least 5 characters long", 400)
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return next(new AppError("Email already exists", 409));
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return next(new AppError("Username already exists", 409));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        full_name,
        email,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Sign token
    const token = signToken({ id: user.id });

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}



/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "mypassword"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         email:
 *                           type: string
 *       400:
 *         description: Email or password missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Email and password are required"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 */
export async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AppError("Invalid credentials", 401));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError("Invalid credentials", 401));
    }

    const token = signToken({ id: user.id });

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

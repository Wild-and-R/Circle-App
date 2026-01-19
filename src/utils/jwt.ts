import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface Userpayload {
    id: number;
}

export function signToken (payload: Userpayload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken (token: string) {
    return jwt.verify(token, JWT_SECRET) as Userpayload;
}    
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      role?: string;
    }
  }
}

export {};

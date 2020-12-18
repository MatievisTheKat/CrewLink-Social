export default {};

declare global {
  namespace Express {
    interface Request {
      uid: string;
    }
  }
}

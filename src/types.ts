export enum FriendshipStatus {
  PENDING,
  ACCEPTED,
  DECLINED,
}

export interface User {
  id: string;
  username: string;
}

export type IdentifyOptions =
  | {
      uuid?: undefined;
      username: string;
    }
  | {
      uuid: string;
      username?: undefined;
    };

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

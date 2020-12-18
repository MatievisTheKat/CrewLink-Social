export enum FriendshipStatus {
  PENDING,
  ACCEPTED,
  DECLINED,
}

export interface User {
  id: string;
  username: string;
}

export interface Friendship {
  timestamp: string;
  from_user: string;
  to_user: string;
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

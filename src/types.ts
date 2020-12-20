export enum FriendshipStatus {
  PENDING,
  ACCEPTED,
  DECLINED,
}

export interface User {
  id: string;
  username: string;
}

export type NotifSignature = 'friend.request' | 'friend.decline' | 'friend.accept';

export enum NotifStatus {
  UNREAD,
  READ,
}

export interface Notif {
  id: number;
  timestamp: string;
  content: string;
  signature: NotifSignature;
  uid: string;
  from_uid?: string;
  status: NotifStatus;
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

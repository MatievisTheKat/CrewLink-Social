import { Response } from 'express';
import WebSocket from 'ws';
import db from './database';
import { IdentifyOptions, Notif, NotifSignature, User } from './types';

export class Error {
  constructor(public status: number, public message: any) {}
}

export function handleErr(this: Response, err: any) {
  if (err.status === 500 || !err.status) console.error(`HandleError: `, err.message || err);
  this.status(err.status || 500).json({
    error: err.status === 500 || !err.status ? 'Something went wrong on our end' : err.message,
  });
}

export function createUser(username: string) {
  return new Promise<User>(async (resolve, reject) => {
    const user = await getUser({ username }).catch(reject);
    if (user) return reject(new Error(400, 'That username is taken'));
    db.query('INSERT INTO users ( username ) VALUES ( $1 );', [username])
      .then(async (res) => {
        const user = await getUser({ username });
        resolve(user);
      })
      .catch((err) => reject(new Error(500, err)));
  });
}

export function getUser({ uuid, username }: IdentifyOptions) {
  return new Promise<User | undefined>((resolve, reject) => {
    db.query('SELECT * FROM users WHERE id = $1 OR username = $2', [uuid, username])
      .then((res) => resolve(res.rows[0]))
      .catch((err) => reject(new Error(500, err)));
  });
}

export function updateUser(newUsername: string, { uuid, username }: IdentifyOptions) {
  return new Promise<void>(async (resolve, reject) => {
    db.query('UPDATE users SET username = $3 WHERE id = $1 OR username = $2', [uuid, username, newUsername])
      .then((_) => resolve())
      .catch((err) => reject(new Error(500, err)));
  });
}

export function createNotif(
  username: string,
  text: string,
  signature: NotifSignature,
  sockets?: Record<string, WebSocket>,
  from?: string
) {
  return new Promise<Notif>(async (resolve, reject) => {
    const user = await getUser({ username }).catch(reject);
    if (!user) return reject(new Error(400, 'Cannot create a notification for a user that does not exist'));

    const fromUser = await getUser({ uuid: from }).catch(reject);
    if (from && !fromUser) return reject(new Error(400, 'Cannot create a notification from a non-existant user'));

    db.query('INSERT INTO notifs ( uid, content, from_uid, signature ) VALUES ( $1, $2, $3, $4 );', [
      user.id,
      text,
      from,
      signature,
    ])
      .then(async (_) => {
        const notif = (await getNotif(user.id, text).catch(reject)) as Notif;

        const socket = sockets[user.id];
        if (socket) {
          socket.send(
            JSON.stringify({
              id: notif.id,
              content: text,
              signature,
              from: fromUser ? fromUser.username : undefined,
              timestamp: notif.timestamp,
              status: notif.status,
            }),
            (err) => (err ? console.error(err) : null)
          );
        }

        resolve(notif);
      })
      .catch(reject);
  });
}

export function getNotif(uuid: string, text: string) {
  return new Promise<Notif | undefined>((resolve, reject) => {
    db.query('SELECT * FROM notifs WHERE uid = $1 AND content = $2;', [uuid, text])
      .then((res) => resolve(res.rows[0]))
      .catch((err) => reject(new Error(500, err)));
  });
}

export function readNotif(id: number, uid: string) {
  return new Promise<void>((resolve, reject) => {
    db.query('UPDATE notifs SET status = 1 WHERE id = $1 AND uid = $2;', [id, uid])
      .then((_) => resolve())
      .catch((err) => reject(new Error(500, err)));
  });
}

export function getAllNotifs(uid: string) {
  return new Promise<Notif[]>((resolve, reject) => {
    db.query('SELECT * FROM notifs WHERE uid = $1 ORDER BY timestamp;', [uid])
      .then((res) => resolve(res.rows))
      .catch((err) => reject(new Error(500, err)));
  });
}

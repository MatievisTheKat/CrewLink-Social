import { Response } from 'express';
import db from './database';
import { Friendship, IdentifyOptions, User } from './types';

export class Error {
  constructor(public status: number, public message: any) {}
}

export function handleErr(this: Response, err: any) {
  if (err.status === 500 || !err.status) console.error(err.message || err);
  this.status(err.status || 500).json({
    error: err.status === 500 || !err.status ? 'Something went wrong on our end' : err.message,
  });
}

export function createUser(username: string) {
  return new Promise<User>(async (resolve, reject) => {
    const user = await getUser({ username }).catch(reject);
    if (user) return reject(new Error(400, 'That username is taken'));
    db.pool
      .query('INSERT INTO users ( username ) VALUES ( $1 );', [username])
      .then(async (res) => {
        const user = await getUser({ username });
        resolve(user);
      })
      .catch((err) => reject(new Error(500, err)));
  });
}

export function getUser({ uuid, username }: IdentifyOptions) {
  return new Promise<User | undefined>((resolve, reject) => {
    db.pool
      .query('SELECT * FROM users WHERE id = $1 OR username = $2', [uuid, username])
      .then((res) => resolve(res.rows[0]))
      .catch((err) => reject(new Error(500, err)));
  });
}

export function updateUser(newUsername: string, { uuid, username }: IdentifyOptions) {
  return new Promise<void>(async (resolve, reject) => {
    db.pool
      .query('UPDATE users SET username = $3 WHERE id = $1 OR username = $2', [uuid, username, newUsername])
      .then((_) => resolve())
      .catch((err) => reject(new Error(500, err)));
  });
}

export function createFriendship(from: User, to: User) {
  return new Promise<Friendship>(async (resolve, reject) => {
    const friendship = await getFriendship({ from: from, to: to }).catch(reject);
    if (friendship) return reject(new Error(400, 'A friendship between those users already exists'));
    db.pool
      .query('INSERT INTO friends ( from_user, to_user ) VALUES ( $1, $2 );', [from.id, to.id])
      .then(async (_) => {
        const created = await getFriendship({ from: from, to: to });
        resolve(created);
      })
      .catch((err) => reject(new Error(500, err)));
  });
}

export function getFriendship(id: number | { from: User; to: User }) {
  return new Promise<Friendship | undefined>((resolve, reject) => {
    db.pool
      .query(
        typeof id === 'number'
          ? 'SELECT * FROM friends WHERE id = $1;'
          : 'SELECT * FROM friends WHERE from_user = $1 AND to_user = $2;',
        typeof id === 'number' ? [id] : [id.from.id, id.to.id]
      )
      .then((res) => resolve(res.rows[0]))
      .catch((err) => reject(new Error(500, err)));
  });
}

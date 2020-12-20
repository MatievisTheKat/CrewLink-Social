import { Request, Response, NextFunction } from 'express';
import { getUser, handleErr } from './util';

export function authenticate(optional = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header && !optional) return res.status(401).json({ error: "Missing 'Authorization' header" });
    const uid = header?.replace(/Authorization/gi, '').trim();
    if (!uid && !optional) return res.status(401).json({ error: "Missing uid in 'Authorization' header" });

    getUser({ uuid: uid })
      .then((user) => {
        if (!user && !optional)
          return res.status(401).json({ error: 'The user you tried to authenticate as a user that does not exist' });
        else {
          req.user = user;
          next();
        }
      })
      .catch(handleErr.bind(res));
  };
}

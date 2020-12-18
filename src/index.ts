require('dotenv').config();

import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import { authenticate } from './middleware';
import { createFriendship, createUser, getUser, handleErr } from './util';

const app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('json spaces', 2);

app.post('/user', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing 'username' in body" });

  createUser(username)
    .then((user) => res.status(201).json(user))
    .catch(handleErr.bind(res));
});

app.post('/friendship', authenticate, async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: "Missing 'to' in body" });

  if (to === req.user.id) return res.status(400).json({ error: "Sorry mate, you can't be your own friend :(" });

  const toUser = await getUser({ uuid: to });
  if (!toUser) return res.status(400).json({ error: "The user you are trying to request doesn't exist" });

  createFriendship(req.user, toUser)
    .then((friendship) => res.status(201).json({ success: true, created: friendship.timestamp }))
    .catch(handleErr.bind(res));
});

app.use((req, res, next) => res.status(404).json({ error: 'Route not found' }));

app.listen(3000, () => console.info(`CrewLink-Social running on http://localhost:3000`));

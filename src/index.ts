require('dotenv').config();

import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import ioServer, { Socket } from 'socket.io';
import { createServer } from 'http';
import { authenticate } from './middleware';
import { createNotif, createUser, getAllNotifs, getUser, handleErr, readNotif } from './util';

const app = express();
const server = createServer(app); //@ts-ignore
const io = ioServer(server);
const socketIds: Record<string, string> = {};
const sockets: Record<string, Socket> = {};

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('json spaces', 2);

app.post('/createUser', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing 'username' in request body" });

  createUser(username)
    .then((user) => res.status(201).json(user))
    .catch(handleErr.bind(res));
});

app.post('/createNotif', authenticate(true), (req, res) => {
  const { to, text, signature } = req.body;
  const signatures = ['friend.request', 'friend.decline', 'friend.accept'];
  if (!text) return res.status(400).json({ error: "Missing 'text' in request body" });
  if (signature && !signatures.includes(signature))
    return res.status(400).json({ error: `Invalid signature. Use one of the following ${signatures.join(', ')}` });

  createNotif(to, text, signature, sockets, req.user?.id)
    .then((notif) =>
      res.status(201).json({
        id: notif.id,
        timestamp: notif.timestamp,
        content: notif.content,
        signature: notif.signature,
        from: req.user?.id,
        status: notif.status,
      })
    )
    .catch(handleErr.bind(res));
});

app.put('/readNotif', authenticate(), (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing 'id' in request body" });

  readNotif(id, req.user.id)
    .then(() => res.status(200).json({ success: true }))
    .catch(handleErr.bind(res));
});

app.get('/notifs', authenticate(), (req, res) => {
  getAllNotifs(req.user.id)
    .then(async (notifs) => {
      const filtered = [];

      for (const { id, timestamp, content, from_uid, status, signature } of notifs) {
        const from = await getUser({ uuid: from_uid });
        filtered.push({ id, timestamp, content, from: from.username, signature, status });
      }

      res.status(200).json(filtered);
    })
    .catch(handleErr.bind(res));
});

io.on('connection', (socket: Socket) => {
  console.log('Socket connected: ', socket.id);

  socket.on('init', (id: string) => {
    console.log(id);
    socketIds[socket.id] = id;
    sockets[id] = socket;
  });

  socket.on('diconnect', () => {
    console.log('Socket disconnected: ', socket.id);
    delete sockets[socketIds[socket.id]];
    delete socketIds[socket.id];
  });
});

app.use((req, res, next) => res.status(404).json({ error: 'Route not found' }));

server.listen(3000, () => console.info(`CrewLink-Social running on http://localhost:3000`));

require('dotenv').config();

import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import ioServer, { Socket } from 'socket.io';
import { createServer } from 'http';
import { authenticate } from './middleware';
import { createNotif, createUser, handleErr, readNotif } from './util';

const app = express();
const server = createServer(app); //@ts-ignore
const io = ioServer(server, { path: '/notifications' });
const socketIds: Record<string, string> = {};
const sockets: Record<string, Socket> = {};

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

io.on('connection', (socket: Socket) => {
  socket.on('init', (id: string) => {
    socketIds[socket.id] = id;
    sockets[id] = socket;
  });

  socket.on('send_notif', async (to: string, text: string) => {
    const from = socketIds[socket.id];
    const notif = await createNotif(to, text, from);
    if (sockets[to]) sockets[to].emit('notif', notif.id, text, from);
  });

  socket.on('read_notif', async (id: number) => {
    await readNotif(id, socketIds[socket.id]);
  });

  socket.on('diconnect', () => {
    delete sockets[socketIds[socket.id]];
    delete socketIds[socket.id];
  });
});

app.use((req, res, next) => res.status(404).json({ error: 'Route not found' }));

server.listen(3000, () => console.info(`CrewLink-Social running on http://localhost:3000`));

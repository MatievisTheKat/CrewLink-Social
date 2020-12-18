import express from 'express';
import morgan from 'morgan';
import Tracer from 'tracer';

const app = express();
const logger = Tracer.colorConsole({
  format: '{{timestamp}} <{{title}}> {{message}}',
});

app.use(morgan('combined'));
app.set('json spaces', 2);

app.get('/friends', extractUid, (req, res) => {});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(3000, () => logger.info(`CrewLink-Social running on http://localhost:3000`));

function extractUid(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing 'Authorization' header" });
  const uid = header.replace(/Authorization/gi, '').trim();
  if (!uid) return res.status(401).json({ error: "Missing uid in 'Authorization' header" });

  req.uid = uid;
  next();
}

import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './src/routes/api.js';
import { pagesRouter } from './src/routes/pages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Support running both directly via tsx (root) and compiled (dist/server.js)
const rootDir = path.basename(__dirname) === 'dist' ? path.resolve(__dirname, '..') : __dirname;

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/static', express.static(path.join(rootDir, 'public')));
app.use('/src/assets', express.static(path.join(rootDir, 'src', 'assets')));

app.use(apiRouter);
app.use(pagesRouter);

app.use((_req, res) => {
  res.status(404).render('info', {
    title: 'Page Not Found — Pamoja',
    heading: 'Page Not Found',
    lead: 'The page you requested does not exist or has moved.',
    sections: [
      {
        heading: 'Continue Exploring',
        body: 'Visit the Pamoja homepage or choose a service from the navigation bar.',
      },
    ],
    ctaHref: '/',
    ctaLabel: 'Return Home',
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Pamoja (AFCON360) Node.js server listening on http://${HOST}:${PORT}`);
});

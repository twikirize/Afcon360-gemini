import { Router, Request, Response } from 'express';

export const pagesRouter = Router();

// User App Home Page at /
pagesRouter.get('/', (_req: Request, res: Response) => {
  res.render('mobile-studio');
});

// Separate React Native (iOS & Android) Download, Expo Go, EAS Build, Source & API page
pagesRouter.get(['/get-app', '/mobile-app', '/download'], (_req: Request, res: Response) => {
  res.render('get-app');
});

const hiddenWebRoutes = [
  '/web',
  '/events',
  '/events/*',
  '/accommodation',
  '/transport',
  '/transport/*',
  '/tourism',
  '/wallet',
  '/user/dashboard',
  '/auth/login',
  '/auth/register',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
  '/faqs',
];

for (const route of hiddenWebRoutes) {
  pagesRouter.get(route, (_req: Request, res: Response) => {
    res.redirect('/');
  });
}

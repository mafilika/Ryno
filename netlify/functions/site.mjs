import { getStore } from '@netlify/blobs';
import { handlePublic } from '../lib/handlers.mjs';

export default async (req) =>
  handlePublic(req, {
    store: getStore({ name: 'rayno-site', consistency: 'strong' }),
    env: process.env,
  });

export const config = {
  path: ['/', '/gallery.html', '/services', '/services/*', '/sitemap.xml', '/robots.txt'],
};

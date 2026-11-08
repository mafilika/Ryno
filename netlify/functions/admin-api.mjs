import { getStore } from '@netlify/blobs';
import { handleAdmin } from '../lib/handlers.mjs';

export default async (req) =>
  handleAdmin(req, {
    store: getStore({ name: 'rayno-site', consistency: 'strong' }),
    env: process.env,
  });

export const config = { path: '/api/admin/*' };

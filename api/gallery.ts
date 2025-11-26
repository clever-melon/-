import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS setup
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // GET: Fetch the public gallery photos
  if (req.method === 'GET') {
    try {
      // Get the latest 50 photos from the 'public_gallery' list
      const photos = await kv.lrange('public_gallery', 0, 49);
      return new Response(JSON.stringify(photos), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch gallery' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST: Add a new photo to the public gallery
  if (req.method === 'POST') {
    try {
      const photo = await req.json();

      if (!photo || !photo.imageData) {
        return new Response(JSON.stringify({ error: 'Invalid photo data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Add to the beginning of the list
      await kv.lpush('public_gallery', photo);
      
      // Trim the list to keep only the latest 50 photos to save storage space
      await kv.ltrim('public_gallery', 0, 49);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Failed to save photo' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
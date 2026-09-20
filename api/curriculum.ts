/**
 * Curriculum persistence is handled exclusively by Firebase Firestore.
 *
 * This endpoint is intentionally disabled for curriculum GET/PUT operations.
 * Vercel serverless memory is NOT persistent and must never be used as the
 * source of truth for curriculum data.
 *
 * The teacher authentication endpoints remain in server.ts for local/dev use.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  return res.status(410).json({
    error: 'Curriculum API disabled. Use Firebase Firestore collection curriculum/main.'
  });
}

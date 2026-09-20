/**
 * ============================================================
 * CURRICULUM API DISABLED
 * ============================================================
 *
 * Curriculum data is stored exclusively in Firebase Firestore.
 *
 * DO NOT use this endpoint as a database.
 *
 * Vercel serverless functions are not persistent storage.
 *
 * The old implementation stored curriculum data in:
 *
 *     let inMemoryState = {
 *         plan: INITIAL_PLAN
 *     }
 *
 * This could reset whenever Vercel created a new serverless
 * function instance.
 *
 * Firebase Firestore is now the only source of truth.
 */

export default async function handler(
  req: any,
  res: any
) {
  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  /**
   * CORS preflight.
   */
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  /**
   * This endpoint intentionally does not store curriculum data.
   */
  return res.status(410).json({
    error:
      'Curriculum API disabled. Curriculum data is stored in Firebase Firestore at curriculum/main.'
  });
}

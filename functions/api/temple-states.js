import {
  cleanState,
  jsonResponse,
  requireAdmin,
} from '../_shared/api.js';

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      return jsonResponse({ ok: false, error: 'D1 binding DB is not configured.' }, 500);
    }

    const authError = requireAdmin(request, env, { bearer: true, queryToken: true });
    if (authError) return authError;

    const result = await env.DB.prepare(`
      SELECT
        state,
        COUNT(*) AS count,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified_count,
        SUM(CASE WHEN status = 'unverified' THEN 1 ELSE 0 END) AS unverified_count,
        SUM(CASE WHEN status = 'needs_review' THEN 1 ELSE 0 END) AS needs_review_count,
        SUM(CASE WHEN status = 'removed' THEN 1 ELSE 0 END) AS removed_count
      FROM temples
      WHERE state IS NOT NULL AND TRIM(state) != ''
      GROUP BY state
      ORDER BY state COLLATE NOCASE ASC
    `).all();

    const states = (result.results || [])
      .map(row => ({
        state: cleanState(row.state),
        count: Number(row.count || 0),
        verifiedCount: Number(row.verified_count || 0),
        unverifiedCount: Number(row.unverified_count || 0),
        needsReviewCount: Number(row.needs_review_count || 0),
        removedCount: Number(row.removed_count || 0),
      }))
      .filter(row => row.state);

    return jsonResponse({ ok: true, source: 'd1', count: states.length, states });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Failed to load D1 states.' }, 500);
  }
}

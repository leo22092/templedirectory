const CLOSED_ADMIN_PATHS = new Set([
  '/login',
  '/login.html',
  '/dashboard',
  '/dashboard.html',
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (CLOSED_ADMIN_PATHS.has(url.pathname.toLowerCase())) {
    return new Response('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  return context.next();
}

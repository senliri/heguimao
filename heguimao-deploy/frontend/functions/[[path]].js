// SPA catch-all: return empty 200 so Pages serves index.html
// React Router handles client-side navigation
export function onRequest() {
  return new Response('', { status: 200 });
}

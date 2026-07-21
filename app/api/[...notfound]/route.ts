// Unmatched /api/* paths must stay JSON. Without this they fall through to
// the HTML not-found page, which surfaces as a parse error inside apiFetch.
// Catch-all segments are the lowest routing priority, so real routes win.
const notFound = () => Response.json({ error: 'Not found' }, { status: 404 });

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;

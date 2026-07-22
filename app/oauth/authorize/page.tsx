import { redirect } from 'next/navigation';
import { db } from '@/db';
import { oauthClients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/session';
import { redirectUriAllowed } from '@/lib/oauth';

/**
 * OAuth consent screen. Server-rendered so validation and the session check
 * happen before anything is shown, and the approval posts as a plain form (no
 * client JS). The user must be signed into Daily Gita; the screen shows the
 * real redirect host, since a dynamically-registered client_name is untrusted.
 */

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

function ErrorCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-card p-6 text-center dark:border-gray-800">
        <h1 className="font-display text-xl font-semibold text-gray-800 dark:text-white">{title}</h1>
        <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">{detail}</p>
      </div>
    </div>
  );
}

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');

  const clientId = get('client_id');
  const redirectUri = get('redirect_uri');
  const responseType = get('response_type');
  const codeChallenge = get('code_challenge');
  const codeChallengeMethod = get('code_challenge_method');
  const state = get('state');
  const scope = get('scope') || 'gita.read';
  const resource = get('resource');

  // 1. Validate the client and redirect_uri BEFORE trusting either — an
  //    unregistered redirect must never receive a redirect (open-redirect).
  const [client] = clientId
    ? await db.select().from(oauthClients).where(eq(oauthClients.clientId, clientId)).limit(1)
    : [];
  if (!client) {
    return <ErrorCard title="Unknown application" detail="This client is not registered." />;
  }
  if (!redirectUri || !redirectUriAllowed(redirectUri, client.redirectUris)) {
    return (
      <ErrorCard
        title="Invalid redirect"
        detail="The redirect URI does not match what this application registered."
      />
    );
  }

  // 2. redirect_uri is now trusted — parameter errors go back to it as OAuth errors.
  const bounce = (error: string, description: string) => {
    const u = new URL(redirectUri);
    u.searchParams.set('error', error);
    u.searchParams.set('error_description', description);
    if (state) u.searchParams.set('state', state);
    redirect(u.toString());
  };

  if (responseType !== 'code') bounce('unsupported_response_type', 'Only response_type=code is supported');
  if (!codeChallenge || codeChallengeMethod !== 'S256') {
    bounce('invalid_request', 'PKCE with code_challenge_method=S256 is required');
  }

  // 3. Require a Daily Gita session; bounce through sign-in and back.
  const user = await getSessionUser();
  if (!user) {
    const returnTo = `/oauth/authorize?${new URLSearchParams(
      Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === 'string') as [string, string][]),
    ).toString()}`;
    redirect(`/auth?next=${encodeURIComponent(returnTo)}`);
  }

  const redirectHost = new URL(redirectUri).host;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-card p-6 dark:border-gray-800">
        <div className="mb-5 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl dark:bg-brand-500/[0.12]">
            <span className="font-sanskrit text-brand-600 dark:text-brand-400">ॐ</span>
          </span>
          <h1 className="font-display text-xl font-semibold text-gray-800 dark:text-white">
            Authorize access
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {client.clientName || 'An application'}
            </span>{' '}
            wants to read the Bhagavad Gita on your behalf.
          </p>
        </div>

        <div className="mb-5 space-y-2 rounded-lg bg-gray-50 p-4 text-theme-sm dark:bg-white/5">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">Will redirect to</span>
            <span className="truncate font-mono text-gray-700 dark:text-gray-300">{redirectHost}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">Access</span>
            <span className="text-gray-700 dark:text-gray-300">Read verses &amp; search</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">Signed in as</span>
            <span className="truncate text-gray-700 dark:text-gray-300">{user.email}</span>
          </div>
        </div>

        <form method="post" action="/api/oauth/authorize" className="flex gap-2">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="redirect_uri" value={redirectUri} />
          <input type="hidden" name="code_challenge" value={codeChallenge} />
          <input type="hidden" name="state" value={state} />
          <input type="hidden" name="scope" value={scope} />
          <input type="hidden" name="resource" value={resource} />
          <button
            type="submit"
            name="decision"
            value="deny"
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Deny
          </button>
          <button
            type="submit"
            name="decision"
            value="approve"
            className="flex-1 rounded-lg bg-brand-500 py-2.5 text-theme-sm font-medium text-white shadow-cta transition-colors hover:bg-brand-600"
          >
            Approve
          </button>
        </form>
      </div>
    </div>
  );
}

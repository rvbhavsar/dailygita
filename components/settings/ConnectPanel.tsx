'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, Plug, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

const card = 'rounded-2xl border border-gray-200 bg-card p-5 dark:border-gray-800';

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {label ?? (copied ? 'Copied' : 'Copy')}
    </Button>
  );
}

const ConnectPanel = () => {
  const [endpoint, setEndpoint] = useState('');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);

  useEffect(() => {
    setEndpoint(`${window.location.origin}/api/mcp`);
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/keys');
      if (res.ok) setKeys(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create key');
      setFreshKey(data.key);
      setName('');
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Key revoked');
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } else {
      toast.error('Could not revoke key');
    }
  };

  const claudeCmd = `claude mcp add --transport http daily-gita ${endpoint} --header "Authorization: Bearer YOUR_KEY"`;
  const jsonConfig = `{
  "mcpServers": {
    "daily-gita": {
      "url": "${endpoint}",
      "headers": { "Authorization": "Bearer YOUR_KEY" }
    }
  }
}`;

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold text-gray-800 dark:text-white">
          Connect to your agent
        </h2>
        <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">
          Give any MCP-capable agent grounded access to all 701 Bhagavad Gita verses — so it
          answers from real, citable scripture instead of guessing.
        </p>
      </div>

      {/* Endpoint */}
      <div className={cn(card, 'mb-4')}>
        <div className="mb-2 flex items-center gap-2 text-theme-sm font-semibold text-gray-800 dark:text-white">
          <Plug className="h-4 w-4 text-brand-500" />
          MCP endpoint
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 font-mono text-theme-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
            {endpoint || '…'}
          </code>
          {endpoint && <CopyButton value={endpoint} />}
        </div>
      </div>

      {/* Freshly created key — shown once */}
      {freshKey && (
        <div className="mb-4 rounded-2xl border border-brand-300 bg-brand-50 p-5 dark:border-brand-500/40 dark:bg-brand-500/[0.08]">
          <div className="mb-2 flex items-center gap-2 text-theme-sm font-semibold text-brand-700 dark:text-brand-400">
            <TriangleAlert className="h-4 w-4" />
            Copy your key now — it won't be shown again
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-theme-sm text-gray-800 dark:bg-gray-900 dark:text-white">
              {freshKey}
            </code>
            <CopyButton value={freshKey} />
          </div>
          <button
            className="mt-3 text-theme-xs text-brand-700 underline dark:text-brand-400"
            onClick={() => setFreshKey(null)}
          >
            Done, hide it
          </button>
        </div>
      )}

      {/* Create + list keys */}
      <div className={cn(card, 'mb-4')}>
        <div className="mb-3 flex items-center gap-2 text-theme-sm font-semibold text-gray-800 dark:text-white">
          <KeyRound className="h-4 w-4 text-brand-500" />
          Your keys
        </div>

        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Key name (e.g. My Claude Desktop)"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <Button onClick={create} disabled={creating || !name.trim()}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create key'}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : keys.length === 0 ? (
          <p className="py-4 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            No keys yet. Create one to connect an agent.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white">
                    {k.name}
                  </p>
                  <p className="truncate font-mono text-theme-xs text-gray-500 dark:text-gray-400">
                    {k.key_prefix}…{' · '}
                    {k.last_used_at
                      ? `last used ${new Date(k.last_used_at).toLocaleDateString()}`
                      : 'never used'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revoke(k.id)}
                  className="text-error-600 hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-error-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* How to connect */}
      <div className={card}>
        <p className="mb-3 text-theme-sm font-semibold text-gray-800 dark:text-white">
          How to connect
        </p>

        <p className="mb-1.5 text-theme-sm text-gray-600 dark:text-gray-300">
          Claude Desktop or Claude Code — one command:
        </p>
        <div className="mb-4 flex items-start gap-2">
          <pre className="hide-scrollbar flex-1 overflow-x-auto rounded-lg bg-gray-100 p-3 font-mono text-theme-xs text-gray-700 dark:bg-white/5 dark:text-gray-300">
            {claudeCmd}
          </pre>
          <CopyButton value={claudeCmd} label="Copy" />
        </div>

        <p className="mb-1.5 text-theme-sm text-gray-600 dark:text-gray-300">
          Cursor, VS Code, or any client with an <code className="font-mono">mcp.json</code>:
        </p>
        <div className="mb-4 flex items-start gap-2">
          <pre className="hide-scrollbar flex-1 overflow-x-auto rounded-lg bg-gray-100 p-3 font-mono text-theme-xs text-gray-700 dark:bg-white/5 dark:text-gray-300">
            {jsonConfig}
          </pre>
          <CopyButton value={jsonConfig} label="Copy" />
        </div>

        <p className="rounded-lg bg-gray-50 p-3 text-theme-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
          Replace <code className="font-mono">YOUR_KEY</code> with a key from above. Works with any
          client that supports a bearer <code className="font-mono">Authorization</code> header.
          ChatGPT and Claude.ai's web connectors currently require OAuth rather than a key — support
          for those is on the roadmap.
        </p>
      </div>
    </div>
  );
};

export default ConnectPanel;

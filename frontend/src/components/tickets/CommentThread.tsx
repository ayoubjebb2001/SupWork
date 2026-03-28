import type { FormEvent } from 'react';
import { InlineError } from '@/components/ui/ErrorBanner';

export type ThreadComment = {
  _id: { toString(): string } | string;
  body: string;
  authorUserId: string;
  createdAt: string;
};

export function CommentThread({
  comments,
  body,
  onBodyChange,
  onSubmit,
  submitLabel,
  composerLabel,
  submitting,
  error,
  showTimestamp = true,
}: {
  comments: ThreadComment[];
  body: string;
  onBodyChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void | Promise<void>;
  submitLabel: string;
  composerLabel?: string;
  submitting?: boolean;
  error?: string;
  showTimestamp?: boolean;
}) {
  return (
    <section className="card" aria-labelledby="comments-heading">
      <h2 id="comments-heading" style={{ marginTop: 0 }}>
        Comments
      </h2>
      {comments.map((c) => {
        const id = typeof c._id === 'string' ? c._id : c._id.toString();
        return (
          <article key={id} className="comment-block">
            <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
              <span className="break-words">{c.authorUserId}</span>
              {showTimestamp && c.createdAt ? (
                <>
                  {' '}
                  · {new Date(c.createdAt).toLocaleString()}
                </>
              ) : null}
            </div>
            <p className="break-words" style={{ margin: 'var(--space-2) 0 0' }}>
              {c.body}
            </p>
          </article>
        );
      })}
      <form onSubmit={onSubmit} className="stack stack--tight" style={{ marginTop: 'var(--space-4)' }}>
        {composerLabel ? (
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="comment-body">{composerLabel}</label>
            <textarea
              id="comment-body"
              rows={3}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              required
              disabled={submitting}
              aria-invalid={error ? true : undefined}
            />
          </div>
        ) : (
          <div className="field" style={{ marginBottom: 0 }}>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              required
              disabled={submitting}
              placeholder="Write a reply…"
              aria-label="Comment"
            />
          </div>
        )}
        {error ? <InlineError>{error}</InlineError> : null}
        <button type="submit" className="btn secondary" disabled={submitting}>
          {submitting ? 'Sending…' : submitLabel}
        </button>
      </form>
    </section>
  );
}

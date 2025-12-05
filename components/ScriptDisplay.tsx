export default function ScriptDisplay({ script }: { script: any }) {
  if (!script) {
    return (
      <div className="rounded-xl hairline p-6 bg-surface">
        <h3 className="text-lg font-semibold mb-4">Script</h3>
        <div className="text-sm text-muted">No script available yet.</div>
      </div>
    )
  }

  const content = script.content || {}
  const editedText = typeof content.edited_text === 'string' ? content.edited_text : null
  
  // If there's edited text, show it cleanly
  if (editedText) {
    return (
      <div className="rounded-xl hairline p-6 bg-surface">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Script</h3>
          <div className="text-xs text-muted mt-1">
            {script.platform} • {script.duration}s • {script.tone}
          </div>
        </div>
        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {editedText}
        </div>
      </div>
    )
  }

  // Otherwise, show structured content
  return (
    <div className="rounded-xl hairline p-6 bg-surface">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Script</h3>
        <div className="text-xs text-muted mt-1">
          {script.platform} • {script.duration}s • {script.tone}
        </div>
      </div>
      <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
        {content.hook && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Hook</div>
            <div>{content.hook}</div>
          </div>
        )}
        {Array.isArray(content.body) && content.body.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Body</div>
            <div className="space-y-2">
              {content.body.map((line: string, idx: number) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        )}
        {content.cta && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Call to Action</div>
            <div>{content.cta}</div>
          </div>
        )}
      </div>
    </div>
  )
}


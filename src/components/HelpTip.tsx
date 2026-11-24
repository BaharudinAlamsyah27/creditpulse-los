import React, { useEffect, useRef, useState } from 'react';

interface HelpTipProps {
  title: string;
  description: string;
  steps?: string[];
  formula?: string;
}

export const HelpTip: React.FC<HelpTipProps> = ({
  title,
  description,
  steps,
  formula,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={`Panduan & Informasi: ${title}`}
        aria-expanded={open}
        title={`Klik untuk penjelasan: ${title}`}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: '1.5px solid var(--border-card)',
          backgroundColor: open ? 'var(--accent-primary)' : 'var(--bg-elevated)',
          color: open ? '#FFFFFF' : 'var(--text-secondary)',
          fontSize: '0.74rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background-color 140ms ease-out, color 140ms ease-out',
        }}
      >
        ?
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={title}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            maxWidth: '88vw',
            padding: '1rem 1.1rem',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            boxShadow: '0 14px 34px rgba(0, 0, 0, 0.18)',
            zIndex: 100,
            textAlign: 'left',
            fontWeight: 400,
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.45rem',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--accent-primary)' }}>
              {title}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup panduan"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {description}
          </p>

          {formula && (
            <div
              className="font-mono-code"
              style={{
                marginTop: '0.55rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-grid)',
                fontSize: '0.73rem',
                color: 'var(--text-primary)',
              }}
            >
              {formula}
            </div>
          )}

          {steps && steps.length > 0 && (
            <div style={{ marginTop: '0.6rem' }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem',
                }}
              >
                Cara Penggunaan / Langkah:
              </div>
              <ol
                style={{
                  paddingLeft: '1.1rem',
                  fontSize: '0.77rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {steps.map((s, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

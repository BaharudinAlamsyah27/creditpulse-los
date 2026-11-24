import React from 'react';
import { BankHealthMetrics, DemoScenarioKey, ThemeMode, WorkspaceRole } from '../types/credit';
import { formatCompactIDR } from '../engine/creditEngine';
import { DEMO_SCENARIO_PRESETS } from '../data/demoApplications';

interface AdminSidebarProps {
  activeRole: WorkspaceRole;
  onSelectRole: (role: WorkspaceRole) => void;
  collapsed: boolean;
  totalApplications: number;
  committeeReadyCount: number;
  anomalyAppsCount: number;
}

interface SidebarNavItem {
  id: WorkspaceRole;
  label: string;
  count?: number;
  tone?: 'info' | 'warn' | 'safe';
  icon: React.ReactNode;
}

interface SidebarCategory {
  categoryTitle: string;
  items: SidebarNavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeRole,
  onSelectRole,
  collapsed,
  totalApplications,
  committeeReadyCount,
  anomalyAppsCount,
}) => {
  const categories: SidebarCategory[] = [
    {
      categoryTitle: 'IKHTISAR & PUBLIK',
      items: [
        {
          id: 'brochure',
          label: 'Halaman Utama',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
        },
      ],
    },
    {
      categoryTitle: 'OPERASIONAL KREDIT',
      items: [
        {
          id: 'borrower',
          label: 'Origination & Debitur',
          count: totalApplications,
          tone: 'info',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
        },
        {
          id: 'underwriter',
          label: 'Analis Kredit Demo',
          count: anomalyAppsCount,
          tone: 'warn',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          ),
        },
      ],
    },
    {
      categoryTitle: 'TATA KELOLA & TREASURY BANK',
      items: [
        {
          id: 'committee',
          label: 'Komite & Sindikasi P2P',
          count: committeeReadyCount,
          tone: 'safe',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          ),
        },
        {
          id: 'treasury',
          label: 'Treasury & Kesehatan Bank',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          ),
        },
        {
          id: 'admin',
          label: 'Anggota & Pengaturan',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9" />
            </svg>
          ),
        },
      ],
    },
  ];

  const getBadgeStyle = (tone: SidebarNavItem['tone'], isActive: boolean): React.CSSProperties => {
    if (isActive) {
      return {
        backgroundColor: '#FFFFFF',
        color: '#0B1813',
      };
    }
    if (tone === 'warn') {
      return {
        backgroundColor: 'rgba(223, 154, 59, 0.2)',
        color: '#EAB366',
      };
    }
    if (tone === 'safe') {
      return {
        backgroundColor: 'rgba(122, 199, 169, 0.2)',
        color: '#8CD4B9',
      };
    }
    return {
      backgroundColor: 'rgba(110, 178, 222, 0.2)',
      color: '#88C4EA',
    };
  };

  return (
    <aside className={`adminlte-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="adminlte-brand">
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.92rem',
            flexShrink: 0,
          }}
        >
          CP
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 800, fontSize: '1.02rem', color: '#FFFFFF', letterSpacing: '-0.025em' }}>
              Bank Nusantara
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-sidebar-muted)' }}>
              CreditPulse LOS Core
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="adminlte-user-panel">
          <img
            src="/images/role-analyst.jpg"
            alt="Pejabat Analis Aktif"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
              border: '1.5px solid var(--accent-lime)',
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              R. Aditya Pratama
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-lime)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-lime)',
                  display: 'inline-block',
                }}
              />
              Lead Underwriter
            </div>
          </div>
        </div>
      )}

      <nav aria-label="Menu Utama Sidebar" style={{ paddingTop: collapsed ? '0.5rem' : 0 }}>
        {categories.map((group) => (
          <div key={group.categoryTitle}>
            {!collapsed && (
              <div className="adminlte-nav-header">{group.categoryTitle}</div>
            )}
            {group.items.map((item) => {
              const isActive = activeRole === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`adminlte-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectRole(item.id)}
                  title={item.label}
                >
                  <span className="adminlte-nav-label">
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                  {!collapsed && typeof item.count === 'number' && (
                    <span
                      className="sidebar-count-pill num-financial"
                      style={getBadgeStyle(item.tone, isActive)}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div
          style={{
            marginTop: 'auto',
            margin: 'auto 0.85rem 1rem',
            padding: '0.95rem 1rem',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-sidebar-card)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.74rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
              Engine Kuantitatif
            </span>
            <span
              style={{
                height: '20px',
                fontSize: '0.66rem',
                fontWeight: 700,
                padding: '0 0.45rem',
                borderRadius: '5px',
                backgroundColor: 'rgba(163, 230, 53, 0.2)',
                color: 'var(--accent-lime)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              ONLINE
            </span>
          </div>
          <div style={{ color: 'var(--text-sidebar-muted)', lineHeight: 1.45 }}>
            Model Log-Odds PDO 45 &amp; Forensik Kas UMKM tersinkronisasi.
          </div>
        </div>
      )}
    </aside>
  );
};

interface AdminTopbarProps {
  activeRole: WorkspaceRole;
  onToggleSidebar: () => void;
  onNavigateRole: (role: WorkspaceRole) => void;
  onOpenOfficialDoc: () => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  bankHealth: BankHealthMetrics;
  onResetDemo: () => void;
  onSelectScenarioPreset?: (presetKey: DemoScenarioKey) => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  activeRole,
  onToggleSidebar,
  onNavigateRole,
  onOpenOfficialDoc,
  theme,
  onSelectTheme,
  bankHealth,
  onResetDemo,
  onSelectScenarioPreset,
}) => {
  const roleLabelMap: Record<WorkspaceRole, string> = {
    brochure: 'Beranda Utama',
    borrower: 'Portal Debitur & Simulasi Pinjaman Digital',
    underwriter: 'Workspace Analis Kredit dan Pra-Screening Demo',
    committee: 'Workspace Komite Demo dan Pendanaan Investor',
    treasury: 'Treasury Demo dan Rasio Ilustratif',
    admin: 'Portal Pengaturan Aturan Demo',
  };

  return (
    <header className="adminlte-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={onToggleSidebar}
          aria-label="Lipat atau Buka Sidebar Navigasi"
          style={{ padding: '0.35rem 0.6rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>
            {roleLabelMap[activeRole]}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <div
          className="num-financial"
          title="Sisa kuota kas likuid bank sebelum menyentuh batas maksimum FDR/LDR"
          style={{
            height: '34px',
            padding: '0 0.8rem',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>Kas Likuid Bank:</span>
          <strong style={{ color: 'var(--status-safe)' }}>
            {formatCompactIDR(bankHealth.availableLiquidCash)}
          </strong>
        </div>

        <div
          className="num-financial"
          title="Financing/Loan to Deposit Ratio terhadap Dana Pihak Ketiga (DPK)"
          style={{
            height: '34px',
            padding: '0 0.8rem',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>FDR/LDR:</span>
          <strong
            style={{
              color:
                bankHealth.fdrLdrPct <= 90
                  ? 'var(--status-safe)'
                  : 'var(--status-warn)',
            }}
          >
            {bankHealth.fdrLdrPct.toFixed(1)}%
          </strong>
        </div>

        <div
          className="num-financial"
          title="Capital Adequacy Ratio (KPMM Modal Inti terhadap ATMR)"
          style={{
            height: '34px',
            padding: '0 0.8rem',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>CAR/KPMM:</span>
          <strong style={{ color: 'var(--accent-info)' }}>
            {bankHealth.carKpmmPct.toFixed(1)}%
          </strong>
        </div>

        <div className="adminlte-tabs" role="group" aria-label="Pemilih Tema Warna">
          {(
            [
              { id: 'cream', label: 'Cream' },
              { id: 'light', label: 'Terang' },
              { id: 'dark', label: 'Gelap' },
            ] as Array<{ id: ThemeMode; label: string }>
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`adminlte-tab-btn ${theme === t.id ? 'active' : ''}`}
              onClick={() => onSelectTheme(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {onSelectScenarioPreset && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Skenario:
            </span>
            <select
              aria-label="Pilih Paket Skenario Demo Siap Pakai"
              className="form-control"
              style={{
                height: '32px',
                fontSize: '0.78rem',
                padding: '0 0.5rem',
                fontWeight: 600,
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
              }}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onSelectScenarioPreset(e.target.value as DemoScenarioKey);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>
                Pilih Kasus Uji Demo...
              </option>
              {DEMO_SCENARIO_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.badgeLabel} — {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onOpenOfficialDoc}
          title="Cetak Memorandum Analisa Kredit (MAK), SP3K, atau Laporan Rapat Komite (PDF)"
        >
          Cetak Dokumen Resmi (PDF)
        </button>

        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onNavigateRole('admin')}
        >
          Pengaturan
        </button>

        <button
          type="button"
          className="btn btn-sm"
          onClick={onResetDemo}
          title="Kembalikan data demo ke kondisi awal"
        >
          Reset Demo
        </button>
      </div>
    </header>
  );
};

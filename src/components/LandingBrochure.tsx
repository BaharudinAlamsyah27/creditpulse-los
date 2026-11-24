import React from 'react';
import {
  CreditUnderwritingEvaluation,
  LoanApplication,
  ThemeMode,
  WorkspaceRole,
} from '../types/credit';
import { formatCompactIDR } from '../engine/creditEngine';
import {
  CashflowMutationTrendChart,
  PortfolioDistributionCharts,
} from './AdminCharts';
import { HelpTip } from './HelpTip';

interface LandingBrochureProps {
  applications: LoanApplication[];
  evaluations: Record<string, CreditUnderwritingEvaluation>;
  onNavigateRole: (role: WorkspaceRole, selectedAppId?: string) => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

const WaveDivider: React.FC<{
  fromBg: string;
  toBg: string;
  variant?: 'arch' | 'wave-left' | 'wave-right';
}> = ({ fromBg, toBg, variant = 'wave-left' }) => {
  const path =
    variant === 'arch'
      ? 'M0,48 C480,0 960,0 1440,48 L1440,64 L0,64 Z'
      : variant === 'wave-right'
        ? 'M0,16 C420,64 1020,0 1440,44 L1440,64 L0,64 Z'
        : 'M0,44 C420,0 1020,68 1440,16 L1440,64 L0,64 Z';

  return (
    <div
      style={{
        lineHeight: 0,
        width: '100%',
        overflow: 'hidden',
        backgroundColor: fromBg,
        marginTop: '-1px',
        marginBottom: '-1px',
      }}
    >
      <svg
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: '54px' }}
        aria-hidden="true"
      >
        <path d={path} fill={toBg} />
      </svg>
    </div>
  );
};

export const LandingBrochure: React.FC<LandingBrochureProps> = ({
  applications,
  evaluations,
  onNavigateRole,
  theme,
  onSelectTheme,
}) => {
  const totalRequested = applications.reduce((s, a) => s + a.requestedAmount, 0);
  const avgScore = Math.round(
    applications.reduce((s, a) => s + (evaluations[a.id]?.creditScore ?? 650), 0) /
      Math.max(1, applications.length)
  );
  const avgDscr =
    applications.reduce((s, a) => s + (evaluations[a.id]?.dscr ?? 1.4), 0) /
    Math.max(1, applications.length);
  const totalP2PCommitted = applications.reduce(
    (s, a) =>
      s + a.p2pCommitments.reduce((acc, c) => acc + c.committedAmount, 0),
    0
  );

  const aggregatedMutations = applications[0].mutations.map((m, idx) => {
    const sumInflow = applications.reduce(
      (s, app) => s + (app.mutations[idx]?.creditInflow ?? 0),
      0
    );
    const sumOutflow = applications.reduce(
      (s, app) => s + (app.mutations[idx]?.debitOutflow ?? 0),
      0
    );
    const sumBalance = applications.reduce(
      (s, app) => s + (app.mutations[idx]?.endingBalance ?? 0),
      0
    );
    return {
      month: m.month,
      creditInflow: sumInflow,
      debitOutflow: sumOutflow,
      endingBalance: sumBalance,
      transactionCount: 0,
      roundNumberTxCount: 0,
      bouncedCheckCount: 0,
    };
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Reference 2: Revolut Business Style Dark Editorial Hero & Navbar */}
      <section className="revolut-hero-shell">
        <header className="revolut-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  backgroundColor: '#FFFFFF',
                  color: '#080A0E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                }}
              >
                CP
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>
                CreditPulse
              </span>
            </div>

            <nav
              aria-label="Menu Utama Landing Page"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '4px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                flexWrap: 'wrap',
              }}
            >
              {[
                { href: '#portal-peran', label: 'Portal Akses' },
                { href: '#alur-kerja', label: 'Alur Kerja' },
                { href: '#arsitektur-risiko', label: 'Arsitektur Risiko' },
                { href: '#analitik-langsung', label: 'Analitik Portofolio' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '0.38rem 0.78rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.88)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Compact Icon-Only Theme Selector */}
            <div
              role="group"
              aria-label="Pemilih Tema"
              style={{
                display: 'inline-flex',
                padding: '3px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                gap: '2px',
              }}
            >
              <button
                type="button"
                title="Tema Cream (Kertas Hangat)"
                aria-label="Tema Cream"
                onClick={() => onSelectTheme('cream')}
                style={{
                  width: '30px',
                  height: '28px',
                  borderRadius: '7px',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: theme === 'cream' ? '#FFFFFF' : 'transparent',
                  color: theme === 'cream' ? '#080A0E' : 'rgba(255,255,255,0.8)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </button>

              <button
                type="button"
                title="Tema Terang (Light)"
                aria-label="Tema Terang"
                onClick={() => onSelectTheme('light')}
                style={{
                  width: '30px',
                  height: '28px',
                  borderRadius: '7px',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: theme === 'light' ? '#FFFFFF' : 'transparent',
                  color: theme === 'light' ? '#080A0E' : 'rgba(255,255,255,0.8)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </button>

              <button
                type="button"
                title="Tema Gelap (Dark)"
                aria-label="Tema Gelap"
                onClick={() => onSelectTheme('dark')}
                style={{
                  width: '30px',
                  height: '28px',
                  borderRadius: '7px',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: theme === 'dark' ? '#FFFFFF' : 'transparent',
                  color: theme === 'dark' ? '#080A0E' : 'rgba(255,255,255,0.8)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              className="revolut-pill-btn-outline"
              onClick={() => onNavigateRole('admin')}
            >
              Portal Anggota / Admin
            </button>

            <button
              type="button"
              className="revolut-pill-btn"
              onClick={() => onNavigateRole('underwriter')}
            >
              Buka Dashboard →
            </button>
          </div>
        </header>

        {/* Hero Body: Editorial Typography Left + Architectural Showcase Right */}
        <div
          className="public-container"
          style={{ paddingTop: '3.25rem', paddingBottom: '4.5rem' }}
        >
          <div className="row-2-col" style={{ alignItems: 'center', gap: '3rem' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.9rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#8CD4B9',
                  marginBottom: '1.35rem',
                }}
              >
                <span>PROTOTIPE DEMO • PORTOFOLIO MAGANG</span>
              </div>

              <h1
                style={{
                  fontSize: '3.15rem',
                  lineHeight: 1.08,
                  letterSpacing: '-0.035em',
                  color: '#FFFFFF',
                  marginBottom: '1.25rem',
                }}
              >
                Demo pembiayaan UMKM: alur bank dan investor.
              </h1>

              <p
                style={{
                  fontSize: '1.05rem',
                  color: 'rgba(255, 255, 255, 0.74)',
                  lineHeight: 1.65,
                  marginBottom: '2rem',
                  maxWidth: '54ch',
                }}
              >
                Prototipe ini memperlihatkan dua skenario terpisah dengan data sintetis dan aturan pra-screening lokal. Tidak ada backend, model machine learning, integrasi regulator, atau perpindahan dana.
              </p>

              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="revolut-pill-btn"
                  onClick={() => onNavigateRole('borrower')}
                >
                  Ajukan &amp; Simulasikan Pinjaman
                </button>
                <button
                  type="button"
                  className="revolut-pill-btn-outline"
                  onClick={() => onNavigateRole('underwriter')}
                >
                  Masuk ke Workspace Analis
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1.5rem',
                  marginTop: '3rem',
                  paddingTop: '1.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <div>
                  <div className="num-financial" style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {formatCompactIDR(totalRequested)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                    Total pengajuan demo (dua skenario)
                  </div>
                </div>
                <div>
                  <div className="num-financial" style={{ fontSize: '1.55rem', fontWeight: 800, color: '#8CD4B9' }}>
                    {avgScore} / AAA–D
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                    Indikator Risiko Demo
                  </div>
                </div>
                <div>
                  <div className="num-financial" style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {formatCompactIDR(totalP2PCommitted)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                    Komitmen Investor Simulasi
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Showcase Card with Uploaded Building Image & Glass Telemetry Overlay */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
                  backgroundColor: '#11151C',
                }}
              >
                <img
                  src="/images/hero-building.jpg"
                  alt="Gedung Institusi Finansial Modern CreditPulse"
                  style={{
                    width: '100%',
                    height: '340px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    padding: '1.35rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    backgroundColor: '#11151C',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#8CD4B9', fontWeight: 700, letterSpacing: '0.05em' }}>
                      CREDITPULSE • DEMO LOKAL
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.15rem' }}>
                      {applications.length} Berkas Korporasi &amp; UMKM Siap Dianalisis
                    </div>
                  </div>
                  <div className="num-financial" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                      Rata-Rata DSCR Portofolio
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {avgDscr.toFixed(2)}x (Sehat)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Architectural Curve Divider into Main Canvas */}
        <div style={{ lineHeight: 0, width: '100%', overflow: 'hidden', marginTop: '-1px' }}>
          <svg
            viewBox="0 0 1440 64"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '56px' }}
            aria-hidden="true"
          >
            <path
              d="M0,16 C360,68 1080,0 1440,48 L1440,64 L0,64 Z"
              fill="var(--bg-body)"
            />
          </svg>
        </div>
      </section>

      {/* Role Gateway Section with the 3 Uploaded Photos */}
      <section id="portal-peran" className="public-section">
        <div className="public-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ maxWidth: '660px' }}>
              <span className="swiss-kicker">GERBANG AKSES MULTI-PERAN</span>
              <h2 style={{ fontSize: '1.85rem', marginTop: '0.3rem', marginBottom: '0.45rem' }}>
                Masuk Cepat sesuai Peran Operasional Anda
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Pilih salah satu workspace di bawah ini untuk langsung berinteraksi dengan simulasi
                data kredit tanpa perlu login.
              </p>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => onNavigateRole('admin')}
            >
              Buka Pengaturan &amp; Manajemen Anggota →
            </button>
          </div>

          <div className="row-3-col">
            {/* Card 1: Borrower / SME Owner */}
            <div className="role-gateway-card">
              <div>
                <img
                  src="/images/role-borrower.jpg"
                  alt="Pelaku Usaha UMKM menggunakan tablet untuk pengajuan pembiayaan"
                  className="role-card-img"
                />
                <div style={{ padding: '1.5rem 1.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-info">Portal Nasabah &amp; UMKM</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Origination
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.18rem', marginBottom: '0.5rem' }}>
                    Portal Debitur &amp; Pelaku Usaha
                  </h3>
                  <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Ajukan pembiayaan usaha secara digital, bandingkan jadwal angsuran Anuitas
                    Konvensional dengan Syariah Murabahah, dan pantau progres persetujuan aplikasi.
                  </p>
                </div>
              </div>
              <div style={{ padding: '0.75rem 1.5rem 1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => onNavigateRole('borrower')}
                >
                  Masuk sebagai Debitur / UMKM →
                </button>
              </div>
            </div>

            {/* Card 2: Credit Analyst & Underwriter */}
            <div className="role-gateway-card">
              <div>
                <img
                  src="/images/role-analyst.jpg"
                  alt="Credit Analyst menganalisis grafik risiko kredit di layar monitor"
                  className="role-card-img"
                />
                <div style={{ padding: '1.5rem 1.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-safe">Portal Analis Risiko</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Pra-Screening Aturan Demo
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.18rem', marginBottom: '0.5rem' }}>
                    Portal Credit Analyst &amp; Underwriter
                  </h3>
                  <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Skor aturan demo, indikator risiko yang tidak terkalibrasi, rasio arus kas ilustratif, uji stres, dan penanda anomali pada data sintetis.
                  </p>
                </div>
              </div>
              <div style={{ padding: '0.75rem 1.5rem 1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => onNavigateRole('underwriter')}
                >
                  Masuk sebagai Credit Analyst →
                </button>
              </div>
            </div>

            {/* Card 3: Credit Committee & Auditor */}
            <div className="role-gateway-card">
              <div>
                <img
                  src="/images/role-committee.jpg"
                  alt="Sidang Komite Kredit dan Auditor Eksekutif di ruang rapat"
                  className="role-card-img"
                />
                <div style={{ padding: '1.5rem 1.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-warn">Portal Komite &amp; Audit</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Approval &amp; P2P
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.18rem', marginBottom: '0.5rem' }}>
                    Portal Komite Kredit &amp; Auditor
                  </h3>
                  <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Jelajahi portofolio sintetis, catat komitmen investor simulasi untuk akad bagi hasil, tinjau berkas komite, dan lihat riwayat tindakan lokal.
                    keputusan.
                  </p>
                </div>
              </div>
              <div style={{ padding: '0.75rem 1.5rem 1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => onNavigateRole('committee')}
                >
                  Masuk sebagai Komite / Auditor →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fromBg="var(--bg-body)" toBg="var(--bg-surface)" variant="wave-left" />

      {/* 4 Core Platform Functions */}
      <section id="empat-fungsi" className="public-section" style={{ backgroundColor: 'var(--bg-surface)', padding: '2.5rem 0 3rem' }}>
        <div className="public-container">
          <div style={{ maxWidth: '720px', marginBottom: '2rem' }}>
            <span className="swiss-kicker">ARSITEKTUR &amp; KEUNGGULAN</span>
            <h2 style={{ fontSize: '1.85rem', marginTop: '0.3rem', marginBottom: '0.45rem' }}>
              Empat Fungsi Utama Sistem CreditPulse
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Satu ekosistem terpadu untuk menangani siklus penuh kredit produktif dan pembiayaan
              syariah maupun konvensional.
            </p>
          </div>

          <div className="row-4-col">
            <div className="feature-pillar-card" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <span className="badge badge-info" style={{ alignSelf: 'flex-start' }}>
                Fungsi 01
              </span>
              <h3 style={{ fontSize: '1.05rem' }}>
                Pengajuan &amp; Manajemen Pinjaman Digital End-to-End
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Formulir permohonan pembiayaan dengan kalkulator jadwal angsuran otomatis untuk
                skema Anuitas maupun Murabahah serta pelacakan status aplikasi.
              </p>
            </div>

            <div className="feature-pillar-card" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <span className="badge badge-safe" style={{ alignSelf: 'flex-start' }}>
                Fungsi 02
              </span>
              <h3 style={{ fontSize: '1.05rem' }}>
                Aturan Pra-Screening &amp; Indikator Risiko Ilustratif
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Skor dan rasio arus kas memakai aturan demo yang transparan. Sinyal risiko tidak terkalibrasi, proxy kerugian bukan ECL, dan data portofolio bersifat sintetis.
              </p>
            </div>

            <div className="feature-pillar-card" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <span className="badge badge-warn" style={{ alignSelf: 'flex-start' }}>
                Fungsi 03
              </span>
              <h3 style={{ fontSize: '1.05rem' }}>
                Penilaian Risiko Pembiayaan Mikro &amp; UMKM Berbasis Arus Kas
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Simulasi kapasitas bayar melalui rasio arus kas demo dan indikator anomali dari mutasi sintetis enam bulan.
              </p>
            </div>

            <div className="feature-pillar-card" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <span className="badge badge-neutral" style={{ alignSelf: 'flex-start' }}>
                Fungsi 04
              </span>
              <h3 style={{ fontSize: '1.05rem' }}>
                Meja Komite Kredit, Pencocokan Pemodal P2P &amp; Audit
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Tinjauan batch oleh komite demo, pencatatan komitmen investor untuk akad bagi hasil, serta riwayat lokal yang dapat diubah.
              </p>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fromBg="var(--bg-surface)" toBg="var(--bg-body)" variant="wave-right" />

      {/* New Section: End-to-End 4-Stage Banking Pipeline */}
      <section id="alur-kerja" className="public-section">
        <div className="public-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ maxWidth: '680px' }}>
              <span className="swiss-kicker">ALUR KERJA TERINTEGRASI</span>
              <h2 style={{ fontSize: '1.85rem', marginTop: '0.3rem', marginBottom: '0.45rem' }}>
                Dari Pengajuan Debitur Hingga Pencairan &amp; Cetak Dokumen
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
                Pemisahan jalur operasional antara pembiayaan neraca internal bank (Anuitas &amp; Murabahah)
                dengan sindikasi pemodal eksternal (Mudharabah &amp; Musyarakah).
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigateRole('borrower')}
            >
              Simulasikan Alur dari Tahap 1 →
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {[
              {
                step: '01',
                title: 'Origination & Simulasi',
                role: 'Portal Debitur',
                desc: 'Calon debitur mengisi profil usaha, memilih akad (Anuitas, Murabahah, atau Bagi Hasil), serta melihat simulasi angsuran atau proyeksi nisbah laba riil.',
                targetRole: 'borrower' as WorkspaceRole,
                badge: 'badge-info',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Forensik & Checklist Berkas',
                role: 'Analis Kredit',
                desc: 'Pemeriksaan 4 tahapan dokumen, deteksi anomali rekening koran 6 bulan (window dressing & tolakan kliring), dan diskusi saran reviewer (Four-Eyes Check).',
                targetRole: 'underwriter' as WorkspaceRole,
                badge: 'badge-safe',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Komite & Jalur Pendanaan',
                role: 'Komite Kredit',
                desc: 'Rapat komite memverifikasi kesiapan berkas, menerbitkan penawaran ke debitur, dan mengelola pool komitmen investor khusus untuk akad bagi hasil syariah.',
                targetRole: 'committee' as WorkspaceRole,
                badge: 'badge-warn',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
              },
              {
                step: '04',
                title: 'Treasury & Cetak Resmi PDF',
                role: 'Treasury & ALCO',
                desc: 'Validasi rasio kas likuid, FDR/LDR, CAR/KPMM, BMPK 20%, pencatatan pencairan demo, serta ekspor dokumen MAK, SP3K, dan Risalah ALCO siap cetak A4.',
                targetRole: 'treasury' as WorkspaceRole,
                badge: 'badge-neutral',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="adminlte-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.35rem',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--accent-primary-soft)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </div>
                    <span className="font-mono-code" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                      {item.step}
                    </span>
                  </div>
                  <span className={`badge ${item.badge}`} style={{ marginBottom: '0.55rem' }}>
                    {item.role}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.45rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => onNavigateRole(item.targetRole)}
                >
                  Buka {item.role} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromBg="var(--bg-body)" toBg="#12221C" variant="wave-left" />

      {/* New Section: Visual Quantitative Risk & Bank Balance Sheet Graphics (Full-Width Curved Band) */}
      <section
        id="arsitektur-risiko"
        className="public-section"
        style={{
          backgroundColor: '#12221C',
          color: '#FFFFFF',
          padding: '2.5rem 0 3rem',
        }}
      >
        <div className="public-container">
          <div style={{ maxWidth: '720px', marginBottom: '2rem' }}>
            <span className="swiss-kicker" style={{ color: '#8CD4B9' }}>
              MESIN KUANTITATIF &amp; LIKUIDITAS BANK
            </span>
            <h2 style={{ fontSize: '1.85rem', marginTop: '0.3rem', marginBottom: '0.45rem', color: '#FFFFFF' }}>
              Visualisasi Forensik Arus Kas &amp; Kesehatan Neraca Internal
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.76)', fontSize: '0.95rem' }}>
              Setiap pengajuan tidak hanya diuji kelayakan usahanya, tetapi juga disinkronkan terhadap
              kapasitas likuiditas dan batas prudensial neraca bank pemberi kredit.
            </p>
          </div>

            <div className="row-2-col" style={{ gap: '1.5rem' }}>
              {/* Graphic Card 1: Forensic Anomaly & Score Visual */}
              <div
                style={{
                  backgroundColor: '#182C24',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '1.15rem 1.35rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF' }}>
                      Deteksi Anomali Mutasi Rekening &amp; Skor Pra-Screening
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.2rem' }}>
                      Identifikasi lonjakan window dressing menjelang pengajuan &amp; tolakan kliring
                    </div>
                  </div>
                  <span className="badge badge-safe">Forensik 6 Bulan</span>
                </div>
                <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Custom Crisp SVG Sparkline Illustration */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(10, 20, 16, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <svg viewBox="0 0 420 120" width="100%" height="120" aria-label="Ilustrasi Deteksi Anomali Mutasi Rekening">
                      <line x1="20" y1="95" x2="400" y2="95" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
                      <line x1="20" y1="55" x2="400" y2="55" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" strokeWidth="1" />
                      <path
                        d="M 20 80 L 90 76 L 160 72 L 230 75 L 300 68 L 385 24"
                        fill="none"
                        stroke="#F07167"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 20 82 L 90 80 L 160 78 L 230 79 L 300 76 L 385 74"
                        fill="none"
                        stroke="#8CD4B9"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="385" cy="24" r="5" fill="#F07167" />
                      <rect x="275" y="10" width="102" height="22" rx="4" fill="#C0392B" />
                      <text x="326" y="25" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">
                        Spike +105% Flag
                      </text>
                      <text x="24" y="112" fill="rgba(255,255,255,0.6)" fontSize="10">Bln 1</text>
                      <text x="155" y="112" fill="rgba(255,255,255,0.6)" fontSize="10">Bln 3</text>
                      <text x="295" y="112" fill="rgba(255,255,255,0.6)" fontSize="10">Bln 5</text>
                      <text x="370" y="112" fill="#F07167" fontSize="10" fontWeight="700">Bln 6</text>
                    </svg>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                    <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>KASUS LANCAR</div>
                      <div className="num-financial" style={{ fontWeight: 800, color: '#8CD4B9', fontSize: '1.05rem', marginTop: '0.15rem' }}>850 (AAA)</div>
                    </div>
                    <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>BORDERLINE</div>
                      <div className="num-financial" style={{ fontWeight: 800, color: '#F3B860', fontSize: '1.05rem', marginTop: '0.15rem' }}>453 (CCC)</div>
                    </div>
                    <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>TOLAK / FRAUD</div>
                      <div className="num-financial" style={{ fontWeight: 800, color: '#F07167', fontSize: '1.05rem', marginTop: '0.15rem' }}>300 (D)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphic Card 2: Bank Liquidity & Prudential Ratios Visual */}
              <div
                style={{
                  backgroundColor: '#182C24',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '1.15rem 1.35rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF' }}>
                      Simulasi Kesehatan Neraca &amp; Likuiditas Treasury Bank
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '0.2rem' }}>
                      Pemantauan DPK, rasio FDR/LDR, kecukupan modal CAR, dan batas BMPK 20%
                    </div>
                  </div>
                  <span className="badge badge-info">ALCO &amp; Treasury</span>
                </div>
                <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    { label: 'Loan / Financing to Deposit Ratio (FDR/LDR)', val: '77.7%', pct: 77.7, limit: 'Batas Sehat ≤ 92%', color: '#8CD4B9' },
                    { label: 'Capital Adequacy Ratio (CAR / KPMM)', val: '29.3%', pct: 73, limit: 'Minimum OJK ≥ 12%', color: '#88C4EA' },
                    { label: 'Ketersediaan Kuota BMPK Debitur Tunggal', val: 'Rp 700 Jt', pct: 64, limit: 'Maks. 20% Modal Inti', color: '#F3B860' },
                  ].map((bar) => (
                    <div key={bar.label} style={{ padding: '0.7rem 0.85rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem', color: '#FFFFFF' }}>
                        <span style={{ fontWeight: 600 }}>{bar.label}</span>
                        <strong className="num-financial" style={{ color: bar.color }}>{bar.val}</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '0.3rem' }}>
                        <div style={{ width: `${bar.pct}%`, height: '100%', backgroundColor: bar.color, borderRadius: '999px' }} />
                      </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>{bar.limit}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fromBg="#12221C" toBg="var(--bg-body)" variant="wave-right" />

      {/* Live Visual Portfolio Analytics Section */}
      <section id="analitik-langsung" className="public-section">
        <div className="public-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="swiss-kicker">TELEMETRI PORTOFOLIO LANGSUNG</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
                Distribusi Pembiayaan &amp; Tren Arus Kas Debitur
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigateRole('underwriter')}
            >
              Buka Analisis Lengkap di Workspace →
            </button>
          </div>

          <div className="row-2-col">
            <div className="adminlte-card">
              <div className="adminlte-card-header">
                <div>
                  <div className="adminlte-card-title">
                    Komposisi Skema Akad &amp; Eksposur Plafon Debitur
                  </div>
                  <div className="adminlte-card-subtitle">
                    Proporsi pembiayaan aktif berdasarkan skema akad dan tingkat kesehatan skor kredit
                  </div>
                </div>
                <HelpTip
                  title="Grafik Komposisi Akad & Plafon"
                  description="Menampilkan data portofolio sintetis untuk skema demo dan skor aturan ilustratif."
                  steps={[
                    'Lingkaran Donut di kiri menunjukkan persentase nilai eksposur per skema akad.',
                    'Batang horizontal di kanan menunjukkan besaran plafon per debitur (Hijau = Sehat, Kuning = Perhatian, Merah = Risiko Tinggi).',
                  ]}
                />
              </div>
              <div className="adminlte-card-body">
                <PortfolioDistributionCharts
                  applications={applications}
                  evaluations={evaluations}
                />
              </div>
            </div>

            <div className="adminlte-card">
              <div className="adminlte-card-header">
                <div>
                  <div className="adminlte-card-title">
                    Tren Arus Kas Masuk &amp; Keluar Agregat (6 Bulan Terakhir)
                  </div>
                  <div className="adminlte-card-subtitle">
                    Pemantauan mutasi kredit, mutasi debit, dan saldo mengendap seluruh debitur
                  </div>
                </div>
                <HelpTip
                  title="Grafik Tren Mutasi Rekening 6 Bulan"
                  description="Memantau agregat arus kas masuk (Inflow), arus kas keluar (Outflow), dan saldo akhir mengendap dari rekening koran seluruh debitur selama 6 bulan terakhir."
                  steps={[
                    'Garis hijau pekat adalah total arus kas masuk usaha.',
                    'Garis merah putus-putus adalah total pengeluaran operasional.',
                    'Garis biru adalah saldo akhir mengendap sebagai penyangga likuiditas.',
                  ]}
                />
              </div>
              <div className="adminlte-card-body">
                <CashflowMutationTrendChart mutations={aggregatedMutations} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organic Curved SVG Transition into Pre-Footer */}
      <div style={{ lineHeight: 0, width: '100%', overflow: 'hidden', backgroundColor: 'var(--bg-body)', marginBottom: '-1px' }}>
        <svg
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: '56px' }}
          aria-hidden="true"
        >
          <path
            d="M0,44 C420,0 1020,68 1440,16 L1440,64 L0,64 Z"
            fill="#12241E"
          />
        </svg>
      </div>

      {/* Pre-Footer Transitional Showcase Band (Smooth Bridge to Corporate Footer) */}
      <section
        style={{
          backgroundColor: '#12241E',
          color: '#FFFFFF',
          padding: '3.25rem 2.25rem 4rem',
        }}
      >
        <div className="public-container" style={{ padding: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '2rem',
            }}
          >
            <div style={{ maxWidth: '620px' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#8CD4B9',
                }}
              >
                SIMULASI LENGKAP SIAP UJI
              </span>
              <h2 style={{ fontSize: '2rem', marginTop: '0.4rem', marginBottom: '0.75rem', color: '#FFFFFF' }}>
                Uji Alur Kredit End-to-End &amp; Cetak Dokumen Resmi
              </h2>
              <p style={{ fontSize: '0.94rem', color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.65 }}>
                Mulai dari simulasi angsuran &amp; bagi hasil syariah di Portal Debitur, telaah
                forensik 6 bulan dengan 3 kasus uji (Lancar, Borderline, Tolak), hingga pencatatan
                pencairan di meja Treasury Bank Nusantara.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '280px' }}>
              <button
                type="button"
                className="revolut-pill-btn"
                style={{ justifyContent: 'center', padding: '0.85rem 1.5rem', fontSize: '0.92rem' }}
                onClick={() => onNavigateRole('underwriter', 'LOS-2026-0841')}
              >
                Buka Workspace Analis &amp; Kasus Uji →
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  type="button"
                  className="revolut-pill-btn-outline"
                  style={{ fontSize: '0.8rem', padding: '0.6rem 0.9rem', justifyContent: 'center' }}
                  onClick={() => onNavigateRole('borrower')}
                >
                  Simulasi Debitur
                </button>
                <button
                  type="button"
                  className="revolut-pill-btn-outline"
                  style={{ fontSize: '0.8rem', padding: '0.6rem 0.9rem', justifyContent: 'center' }}
                  onClick={() => onNavigateRole('treasury')}
                >
                  Treasury Bank
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Institutional & Developer Multi-Column Footer */}
      <footer
        style={{
          marginTop: 'auto',
          backgroundColor: '#0A0D12',
          color: '#D8E1EA',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4rem 2.25rem 2.25rem',
        }}
      >
        <div className="public-container" style={{ padding: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1.1fr 1.1fr',
              gap: '2.25rem',
              paddingBottom: '2.75rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Col 1: Brand & Creator Information */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    color: '#080A0E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                  }}
                >
                  CP
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#FFFFFF' }}>
                  CreditPulse / CrediVault
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, marginBottom: '1rem' }}>
                Prototipe Demo Origination, Pra-Screening Aturan &amp; Tinjauan Pembiayaan
                Arus Kas UMKM, &amp; Sindikasi Komite Kredit Terpadu.
              </p>
              <div style={{ fontSize: '0.8rem', color: '#8CD4B9', fontWeight: 600 }}>
                Dikembangkan oleh: Tim Arsitek Sistem Perbankan &amp; Financial Data Science (Baharudin Alamsyah)
              </div>
            </div>

            {/* Col 2: Navigation & Portals */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#FFFFFF', marginBottom: '1rem' }}>
                Akses Cepat Portal
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem' }}>
                <button
                  type="button"
                  onClick={() => onNavigateRole('borrower')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.72)', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  → Portal Debitur &amp; Simulasi UMKM
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateRole('underwriter')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.72)', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  → Workspace Analis Kredit Demo
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateRole('committee')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.72)', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  → Portal Komite Kredit &amp; Sindikasi P2P
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateRole('admin')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.72)', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  → Portal Anggota &amp; Pengaturan Sistem
                </button>
              </div>
            </div>

            {/* Col 3: Office Address & Operational Hours */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#FFFFFF', marginBottom: '1rem' }}>
                Alamat &amp; Kantor Operasional
              </div>
              <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>
                <div><strong>Menara Finansial Nusantara, Lt. 18</strong></div>
                <div>Kawasan Niaga Terpadu Sudirman (SCBD)</div>
                <div>Jl. Jend. Sudirman Kav. 52–53, Jakarta Selatan 12190, Indonesia</div>
                <div style={{ marginTop: '0.6rem', color: 'rgba(255,255,255,0.55)' }}>
                  Jam Operasional Kliring &amp; Komite: Senin – Jumat (08.00 – 17.00 WIB)
                </div>
              </div>
            </div>

            {/* Col 4: Contact & Compliance */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#FFFFFF', marginBottom: '1rem' }}>
                Kontak &amp; Dukungan Teknis
              </div>
              <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
                <div>Email: <span className="font-mono-code">support@creditpulse-banking.id</span></div>
                <div>Desk Risiko: <span className="font-mono-code">underwriting@credivault.id</span></div>
                <div>Telepon: <span className="num-financial">+62 (21) 5088-9400</span></div>
                <div style={{ marginTop: '0.65rem' }}>
                  <span className="badge badge-warn">Data sintetis • bukan sistem produksi</span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <div>
              CreditPulse / CrediVault — prototipe portofolio demo.
            </div>
            <div>
              Skenario bank dan investor terpisah • Data sintetis • Tidak untuk keputusan atau transaksi nyata.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

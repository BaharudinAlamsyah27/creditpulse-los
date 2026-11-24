import React, { useState } from 'react';
import {
  ApplicationStatus,
  BankHealthMetrics,
  CreditUnderwritingEvaluation,
  GovernanceAuditEntry,
  InternalBankProfile,
  LoanApplication,
} from '../types/credit';
import { INSTITUTIONAL_INVESTOR_POOLS } from '../data/demoApplications';
import {
  computeInternalBankHealth,
  formatCompactIDR,
  formatIDR,
} from '../engine/creditEngine';
import { PortfolioDistributionCharts } from './AdminCharts';
import { HelpTip } from './HelpTip';

interface CommitteePortalProps {
  applications: LoanApplication[];
  evaluations: Record<string, CreditUnderwritingEvaluation>;
  bankProfile: InternalBankProfile;
  bankHealth: BankHealthMetrics;
  auditLogs: GovernanceAuditEntry[];
  onBatchCommitteeDecision: (
    appIds: string[],
    decision: ApplicationStatus,
    committeeNote: string
  ) => void;
  onAllocateP2PFunding: (
    appId: string,
    investorPoolId: string,
    amount: number
  ) => void;
  onSimulateP2PRelease: (appId: string) => void;
  onInspectInUnderwriter: (appId: string) => void;
}

export const CommitteePortal: React.FC<CommitteePortalProps> = ({
  applications,
  evaluations,
  bankProfile,
  bankHealth,
  auditLogs,
  onBatchCommitteeDecision,
  onAllocateP2PFunding,
  onSimulateP2PRelease,
  onInspectInUnderwriter,
}) => {
  const committeeReadyApps = applications.filter((app) => app.status === 'COMMITTEE_READY');
  const p2pApplications = applications.filter(
    (app) => app.scheme === 'MUDHARABAH_P2P' || app.scheme === 'MUSYARAKAH_P2P'
  );
  const bankApplications = applications.filter(
    (app) => app.scheme === 'ANUITAS_KONVENSIONAL' || app.scheme === 'MURABAHAH_MARGIN'
  );
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(() =>
    committeeReadyApps.map((a) => a.id)
  );
  const eligibleSelectedBatchIds = selectedBatchIds.filter((id) =>
    committeeReadyApps.some((app) => app.id === id)
  );
  const [committeeNote, setCommitteeNote] = useState(
    'Catatan tinjauan komite demo; angka dan kebijakan yang tampil bersifat ilustratif.'
  );

  const [selectedP2PAppId, setSelectedP2PAppId] = useState<string>(
    p2pApplications[0]?.id || applications[0]?.id || ''
  );
  const [selectedInvestorPoolId, setSelectedInvestorPoolId] = useState<string>(
    INSTITUTIONAL_INVESTOR_POOLS[0].id
  );
  const [allocationAmount, setAllocationAmount] = useState<number>(125_000_000);

  const totalManagedExposure = bankApplications
    .filter((a) => a.status !== 'REJECTED')
    .reduce((s, a) => s + a.requestedAmount, 0);

  const par30Exposure = bankApplications
    .filter((a) => a.status !== 'REJECTED' && a.pastArrearsDaysMax >= 30)
    .reduce((s, a) => s + a.requestedAmount, 0);

  const nplExposure = bankApplications
    .filter((a) => a.status !== 'REJECTED' && a.slikKol >= 3)
    .reduce((s, a) => s + a.requestedAmount, 0);

  const par30Pct =
    totalManagedExposure > 0 ? (par30Exposure / totalManagedExposure) * 100 : 0;
  const nplPct =
    totalManagedExposure > 0 ? (nplExposure / totalManagedExposure) * 100 : 0;

  const totalIndicativeLossProxy = bankApplications
    .filter((a) => a.status !== 'REJECTED')
    .reduce((s, a) => s + (evaluations[a.id]?.indicativeLossProxyAmount ?? 0), 0);

  const totalInvestorCommitments = p2pApplications.reduce(
    (s, a) =>
      s + a.p2pCommitments.reduce((acc, c) => acc + c.committedAmount, 0),
    0
  );
  const totalP2PRequestedExposure = p2pApplications
    .filter((app) => app.status !== 'REJECTED')
    .reduce((sum, app) => sum + app.requestedAmount, 0);

  // Keep bank exposure and investor commitments on separate demo schemes.
  const selectedBatchBankPortion = applications
    .filter(
      (a) =>
        selectedBatchIds.includes(a.id) && a.status === 'COMMITTEE_READY'
    )
    .reduce((sum, app) => {
      if (app.scheme === 'MUDHARABAH_P2P' || app.scheme === 'MUSYARAKAH_P2P') return sum;
      return sum + app.requestedAmount;
    }, 0);

  const selectedBatchP2PPortion = applications
    .filter(
      (a) =>
        selectedBatchIds.includes(a.id) && a.status === 'COMMITTEE_READY'
    )
    .reduce((sum, app) => {
      if (app.scheme !== 'MUDHARABAH_P2P' && app.scheme !== 'MUSYARAKAH_P2P') return sum;
      const p2pSum = app.p2pCommitments.reduce((s, c) => s + c.committedAmount, 0);
      return sum + Math.min(app.requestedAmount, p2pSum);
    }, 0);

  const projectedBankHealthAfterBatch = computeInternalBankHealth(
    bankProfile,
    applications,
    evaluations,
    selectedBatchBankPortion
  );

  const isBatchExceedingLiquidity =
    selectedBatchBankPortion > bankHealth.availableLiquidCash;

  const toggleSelectId = (id: string) => {
    if (!committeeReadyApps.some((app) => app.id === id)) return;
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const allReadySelected = committeeReadyApps.every((app) => selectedBatchIds.includes(app.id));
    setSelectedBatchIds(allReadySelected ? [] : committeeReadyApps.map((app) => app.id));
  };

  const handleExecuteBatch = (decision: ApplicationStatus) => {
    const eligibleIds = selectedBatchIds.filter((id) =>
      committeeReadyApps.some((app) => app.id === id)
    );
    if (eligibleIds.length === 0) return;
    onBatchCommitteeDecision(eligibleIds, decision, committeeNote);
  };

  const activeP2PApp =
    p2pApplications.find((a) => a.id === selectedP2PAppId) || p2pApplications[0] || applications[0];
  const activeP2PCommitted = activeP2PApp.p2pCommitments.reduce(
    (s, c) => s + c.committedAmount,
    0
  );
  const activeP2PRemaining = Math.max(
    0,
    activeP2PApp.requestedAmount - activeP2PCommitted
  );
  const activeP2PFundedPct = Math.min(
    100,
    Math.round((activeP2PCommitted / Math.max(1, activeP2PApp.requestedAmount)) * 100)
  );
  const ratingRank = { AAA: 0, AA: 1, A: 2, BBB: 3, BB: 4, B: 5, CCC: 6, D: 7 } as const;
  const activeP2PEvaluation = evaluations[activeP2PApp.id];
  const eligibleInvestorPools = activeP2PEvaluation
    ? INSTITUTIONAL_INVESTOR_POOLS.filter(
        (pool) => ratingRank[activeP2PEvaluation.ratingGrade] <= ratingRank[pool.minRatingGrade]
      )
    : [];
  const activeInvestorPoolId = eligibleInvestorPools.some((pool) => pool.id === selectedInvestorPoolId)
    ? selectedInvestorPoolId
    : eligibleInvestorPools[0]?.id ?? '';
  const activeInvestorPool = eligibleInvestorPools.find((pool) => pool.id === activeInvestorPoolId);
  const activePoolCommitted = activeInvestorPool
    ? p2pApplications.reduce(
        (sum, app) => sum + app.p2pCommitments
          .filter((commitment) => commitment.investorName === activeInvestorPool.name)
          .reduce((appSum, commitment) => appSum + commitment.committedAmount, 0),
        0
      )
    : 0;
  const maxInvestorAllocation = activeInvestorPool
    ? Math.max(0, Math.min(activeP2PRemaining, activeInvestorPool.availableLiquidity - activePoolCommitted))
    : 0;

  const handleExportPortfolioCsv = () => {
    const headers = [
      'ID_Aplikasi',
      'Nama_Debitur',
      'Sektor',
      'Skema_Akad',
      'Plafon_IDR',
      'Skor_Demo',
      'Grade',
      'Indikator_Risiko_Demo_Pct',
      'Proxy_Kerugian_Agunan_Pct',
      'Proxy_Kerugian_Ilustratif_IDR',
      'DSCR',
      'Status_Komite',
    ];
    const rows = applications.map((a) => {
      const ev = evaluations[a.id];
      return [
        a.id,
        `"${a.applicantName}"`,
        `"${a.businessSector}"`,
        a.scheme,
        a.requestedAmount,
        ev.creditScore,
        ev.ratingGrade,
        ev.riskSignalPct,
        ev.lgdPct,
        ev.indicativeLossProxyAmount,
        ev.dscr,
        a.status,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Portofolio_Komite_Kredit_CreditPulse.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="adminlte-content-header">
        <div>
          <span className="swiss-kicker">
            PORTAL KOMITE DEMO • DATA DAN STATUS DISIMPAN DI BROWSER
          </span>
          <h1 style={{ fontSize: '1.55rem', marginTop: '0.2rem' }}>
            Tinjauan Berkas Demo • Alur Bank dan Pendanaan Investor
          </h1>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleExportPortfolioCsv}
        >
          Ekspor Laporan Portofolio (.CSV)
        </button>
      </div>

      <div className="adminlte-content">
        <div className="adminlte-card">
          <div className="adminlte-card-header">
            <div>
              <div className="adminlte-card-title">Antrean pelepasan dana — demo investor</div>
              <div className="adminlte-card-subtitle">
                Jalur ini hanya untuk akad bagi hasil dengan komitmen investor penuh. Pencatatan tidak memindahkan dana.
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="swiss-table">
              <thead>
                <tr>
                  <th>ID Berkas</th><th>Debitur</th><th>Komitmen demo</th><th>Jumlah pengajuan</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {applications.filter((app) =>
                  app.status === 'OFFER_ACCEPTED' &&
                  (app.scheme === 'MUDHARABAH_P2P' || app.scheme === 'MUSYARAKAH_P2P')
                ).length === 0 ? (
                  <tr><td colSpan={5} className="text-center">Belum ada penawaran bagi hasil yang diterima.</td></tr>
                ) : applications.filter((app) =>
                  app.status === 'OFFER_ACCEPTED' &&
                  (app.scheme === 'MUDHARABAH_P2P' || app.scheme === 'MUSYARAKAH_P2P')
                ).map((app) => {
                  const committed = app.p2pCommitments.reduce((sum, item) => sum + item.committedAmount, 0);
                  const fullyCommitted = committed >= app.requestedAmount;
                  return (
                    <tr key={app.id}>
                      <td className="font-mono-code">{app.id}</td>
                      <td>{app.applicantName}</td>
                      <td className="text-right num-financial">{formatIDR(committed)}</td>
                      <td className="text-right num-financial">{formatIDR(app.requestedAmount)}</td>
                      <td className="text-center">
                        <button type="button" className="btn btn-sm btn-primary" disabled={!fullyCommitted} onClick={() => onSimulateP2PRelease(app.id)}>
                          Catat pelepasan dana demo
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Internal Bank Treasury & Regulatory Health Panel (POV Perbankan) */}
        <div className="adminlte-card">
          <div className="adminlte-card-header">
            <div>
              <div className="adminlte-card-title">
                Neraca &amp; Kesehatan Likuiditas Internal Bank — {bankHealth.bankName}
              </div>
              <div className="adminlte-card-subtitle">
                Rasio di bawah memakai profil dan data sintetis; hasilnya hanya ilustrasi, bukan pemeriksaan kepatuhan regulator.
              </div>
            </div>
            <HelpTip
              title="Simulasi Neraca dan Likuiditas"
              description="Panel demo memakai rumus sederhana dan profil fiktif. Nilainya bukan perhitungan regulator atau hasil pemeriksaan bank nyata."
              formula="Rasio ilustratif berdasarkan parameter demo; bukan formula kepatuhan tervalidasi"
              steps={[
                'Porsi plafon yang tidak didanai oleh pemodal P2P akan langsung memotong Kas Likuid Internal Bank.',
                'Gunakan panel komitmen investor demo untuk melihat jalur bagi hasil secara terpisah.',
              ]}
            />
          </div>
          <div className="adminlte-card-body">
            <div className="row-4-col" style={{ marginBottom: '1rem' }}>
              <div
                style={{
                  padding: '0.95rem 1.1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-grid)',
                }}
              >
                <div className="swiss-kicker">DANA PIHAK KETIGA (DPK) &amp; MODAL INTI</div>
                <div className="num-financial" style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {formatCompactIDR(bankHealth.dpkDeposits)}{' '}
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    / Modal {formatCompactIDR(bankHealth.tier1Capital)}
                  </span>
                </div>
                <div className="num-financial" style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Portofolio Kredit Berjalan: {formatCompactIDR(bankHealth.totalActiveFinancing)}
                </div>
              </div>

              <div
                style={{
                  padding: '0.95rem 1.1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-grid)',
                }}
              >
                <div className="swiss-kicker">KAS LIKUID BANK SIAP SALUR</div>
                <div
                  className="num-financial"
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    marginTop: '0.25rem',
                    color: 'var(--status-safe)',
                  }}
                >
                  {formatCompactIDR(bankHealth.availableLiquidCash)}
                </div>
                <div className="num-financial" style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Sisa kuota ekspansi sebelum FDR {bankProfile.maxFdrLimitPct}%
                </div>
              </div>

              <div
                style={{
                  padding: '0.95rem 1.1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-grid)',
                }}
              >
                <div className="swiss-kicker">RASIO LIKUIDITAS (FDR/LDR) &amp; CAR</div>
                <div className="num-financial" style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  FDR {bankHealth.fdrLdrPct}%{' '}
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-info)' }}>
                    • CAR {bankHealth.carKpmmPct}%
                  </span>
                </div>
                <div className="num-financial" style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Proyeksi Pasca-Batch: FDR {projectedBankHealthAfterBatch.fdrLdrPct}% • CAR{' '}
                  {projectedBankHealthAfterBatch.carKpmmPct}%
                </div>
              </div>

              <div
                style={{
                  padding: '0.95rem 1.1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-grid)',
                }}
              >
                <div className="swiss-kicker">BATAS BMPK &amp; PROFITABILITAS BANK</div>
                <div className="num-financial" style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  BMPK {formatCompactIDR(bankHealth.bmpkMaxSingleBorrower)}
                </div>
                <div className="num-financial" style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  ROA: {bankHealth.roaPct}% • BOPO: {bankHealth.bopoPct}% • NIM: {bankHealth.nimPct}%
                </div>
              </div>
            </div>

            {/* Live Pre-Disbursement Impact Bar */}
            <div
              className="num-financial"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                backgroundColor: isBatchExceedingLiquidity
                  ? 'var(--status-danger-bg)'
                  : 'var(--accent-primary-soft)',
                color: isBatchExceedingLiquidity
                  ? 'var(--status-danger)'
                  : 'var(--status-safe)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              <span>
                SIMULASI DAMPAK BATCH TERPILIH ({eligibleSelectedBatchIds.length} Berkas): Beban Kas Internal Bank{' '}
                <strong>{formatIDR(selectedBatchBankPortion)}</strong> + Co-Funding Sindikasi P2P{' '}
                <strong>{formatIDR(selectedBatchP2PPortion)}</strong>
              </span>
              <span>
                {isBatchExceedingLiquidity
                  ? 'PERINGATAN: Beban Kas Bank melebihi kuota FDR! Alokasikan sebagian ke Sindikasi P2P.'
                  : `Sisa Kas Likuid Bank Pasca-Pencairan: ${formatIDR(
                      projectedBankHealthAfterBatch.availableLiquidCash
                    )}`}
              </span>
            </div>
          </div>
        </div>

        {/* 4 AdminLTE Small-Box Portfolio KPIs */}
        <section className="adminlte-kpi-grid">
          <div className="small-box">
            <div className="small-box-top-bar" style={{ backgroundColor: 'var(--accent-primary)' }} />
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial">
                  {formatCompactIDR(totalManagedExposure)}
                </div>
                  <div className="small-box-label">Total pengajuan skenario bank</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Diluar berkas ditolak</span>
              <span>{formatIDR(totalManagedExposure)}</span>
            </div>
          </div>

          <div className="small-box">
            <div
              className="small-box-top-bar"
              style={{
                backgroundColor:
                  nplPct <= 5.0 ? 'var(--status-safe)' : 'var(--status-danger)',
              }}
            />
            <div className="small-box-inner">
              <div>
                <div
                  className="small-box-value num-financial"
                  style={{
                    color:
                      nplPct <= 5.0 ? 'var(--status-safe)' : 'var(--status-danger)',
                  }}
                >
                  {nplPct.toFixed(2)}%
                </div>
                <div className="small-box-label">Pengajuan bank dengan SLIK demo KOL ≥ 3</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>PAR-30 demo (tunggakan ≥30 hari): {par30Pct.toFixed(2)}%</span>
              <span>Ambang indikator demo: 5.00%</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-top-bar" style={{ backgroundColor: 'var(--status-warn)' }} />
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial" style={{ color: 'var(--status-warn)' }}>
                  {formatCompactIDR(totalIndicativeLossProxy)}
                </div>
                <div className="small-box-label">Proxy kerugian ilustratif (bukan CKPN/ECL)</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>
                Coverage:{' '}
                {totalManagedExposure > 0
                  ? ((totalIndicativeLossProxy / totalManagedExposure) * 100).toFixed(2)
                  : '0.00'}
                %
              </span>
              <span>Bank demo: {formatIDR(totalIndicativeLossProxy)}</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-top-bar" style={{ backgroundColor: 'var(--accent-info)' }} />
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial" style={{ color: 'var(--accent-info)' }}>
                  {formatCompactIDR(totalInvestorCommitments)}
                </div>
                <div className="small-box-label">Komitmen investor simulasi</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>{INSTITUTIONAL_INVESTOR_POOLS.length} Pool Pemodal</span>
                  <span>Pengajuan bagi hasil: {formatCompactIDR(totalP2PRequestedExposure)}</span>
            </div>
          </div>
        </section>

        {/* Visual Portfolio Allocation Chart Card */}
        <div className="adminlte-card card-info">
          <div className="adminlte-card-header">
            <div>
              <div className="adminlte-card-title">
                Grafik Visualisasi Eksposur Portofolio &amp; Distribusi Skema Pembiayaan
              </div>
              <div className="adminlte-card-subtitle">
                Ringkasan portofolio sintetis berdasarkan akad dan skor demo
              </div>
            </div>
          </div>
          <div className="adminlte-card-body">
            <PortfolioDistributionCharts
              applications={applications}
              evaluations={evaluations}
            />
          </div>
        </div>

        {/* P2P Matching Simulator + Governance Audit Log Side-by-Side */}
        <section className="row-2-col">
          <div className="adminlte-card card-success">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  Pendanaan Investor Simulasi — Akad Bagi Hasil
                </div>
                <div className="adminlte-card-subtitle">
                  Catat komitmen pool investor lokal untuk pengajuan Mudharabah / Musyarakah demo.
                </div>
              </div>
              <HelpTip
                title="Simulasi Pencocokan Investor"
                description="Mencatat komitmen sintetis dalam browser. Tidak ada investor, rekening penampung, atau transfer dana yang terhubung."
                steps={[
                  'Pilih berkas debitur yang sedang membutuhkan pendanaan.',
                  'Pilih institusi pemodal dan masukkan nominal komitmen pendanaan.',
                  'Saat komitmen demo mencapai jumlah pengajuan, berkas bisa masuk antrean tinjauan komite.',
                ]}
              />
            </div>
            <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="row-2-col" style={{ gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="p2p-app-select">
                    Pilih pengajuan skema bagi hasil
                  </label>
                  <select
                    id="p2p-app-select"
                    className="form-control"
                    value={selectedP2PAppId}
                    onChange={(e) => {
                      const nextApp = applications.find((a) => a.id === e.target.value);
                      setSelectedP2PAppId(e.target.value);
                      if (nextApp) {
                        const committed = nextApp.p2pCommitments.reduce(
                          (s, c) => s + c.committedAmount,
                          0
                        );
                        const rem = Math.max(0, nextApp.requestedAmount - committed);
                        setAllocationAmount(rem > 0 ? rem : 100_000_000);
                      }
                    }}
                  >
                    {p2pApplications.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.id} — {a.applicantName} ({formatCompactIDR(a.requestedAmount)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="p2p-investor-select">
                    Pilih Pool Pemodal / Sindikasi BPRS
                  </label>
                  <select
                    id="p2p-investor-select"
                    className="form-control"
                    value={activeInvestorPoolId}
                    onChange={(e) => setSelectedInvestorPoolId(e.target.value)}
                  >
                    {eligibleInvestorPools.map((pool) => (
                      <option key={pool.id} value={pool.id}>
                        {pool.name} (batas rating demo {pool.minRatingGrade})
                      </option>
                    ))}
                  </select>
                  {eligibleInvestorPools.length === 0 && (
                    <div className="form-hint">Tidak ada pool simulasi yang memenuhi rating demo untuk pengajuan ini.</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="p2p-amount">
                    Nominal komitmen investor simulasi (IDR)
                  </label>
                  <input
                    id="p2p-amount"
                    type="number"
                    step={25_000_000}
                    min={10_000_000}
                    max={maxInvestorAllocation}
                    className="form-control num-financial"
                    value={allocationAmount}
                    onChange={(e) => setAllocationAmount(Number(e.target.value) || 0)}
                  />
                  <div className="form-hint" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Maksimum komitmen demo saat ini: {formatIDR(maxInvestorAllocation)} (memperhitungkan kebutuhan berkas dan kapasitas pool).
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!activeInvestorPoolId || allocationAmount < 10_000_000 || allocationAmount > maxInvestorAllocation}
                  onClick={() =>
                    onAllocateP2PFunding(
                      activeP2PApp.id,
                      activeInvestorPoolId,
                      allocationAmount
                    )
                  }
                >
                  Catat komitmen investor →
                </button>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-card)',
                  backgroundColor: 'var(--bg-elevated)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <strong>
                    {activeP2PApp.applicantName} (Nisbah demo {activeP2PApp.nisbahBorrowerPct}% :{' '}
                    {100 - activeP2PApp.nisbahBorrowerPct}%)
                  </strong>
                  <span className="badge badge-safe num-financial">
                    {activeP2PFundedPct}% TERDANAI
                  </span>
                </div>
                <div className="swiss-meter" style={{ height: '10px', marginBottom: '0.6rem' }}>
                  <div className="swiss-meter-fill" style={{ width: `${activeP2PFundedPct}%` }} />
                </div>
                <div className="num-financial" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span>Komitmen demo: <strong>{formatIDR(activeP2PCommitted)}</strong></span>
                  <span>Sisa: <strong>{formatIDR(activeP2PRemaining)}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  Riwayat Tindakan Demo (lokal)
                </div>
                <div className="adminlte-card-subtitle">
                  Catatan di browser ini; belum immutable dan tidak menjadi audit trail resmi.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-neutral font-mono-code">{auditLogs.length} LOGS</span>
                <HelpTip
                  title="Jejak Audit Tata Kelola (Governance Audit Trail)"
                  description="Sebagian tindakan demo dicatat di localStorage browser. Catatan bisa diubah atau dihapus dan bukan bukti audit. Sinyal risiko bukan PD terkalibrasi."
                />
              </div>
            </div>
            <div
              className="adminlte-card-body"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                maxHeight: '340px',
                overflowY: 'auto',
              }}
            >
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-card)',
                    backgroundColor: 'var(--bg-elevated)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className="badge badge-info font-mono-code">{log.actionType}</span>
                    <span className="font-mono-code" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {log.timestamp}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    [{log.applicationId}] {log.applicantName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {log.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Batch Approval Committee Table Card */}
        <div className="adminlte-card">
          <div className="adminlte-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div>
                <div className="adminlte-card-title">
                  Meja Tinjauan dan Putusan Komite Demo
                </div>
                <div className="adminlte-card-subtitle">
                  Centang berkas siap komite untuk mencatat putusan demo secara kolektif
                </div>
              </div>
              <HelpTip
                title="Meja Keputusan Komite Kredit (Batch Approval)"
                description="Memungkinkan pejabat Komite Kredit menyetujui, menahan (restrukturisasi), atau menolak beberapa berkas sekaligus dengan menyertakan risalah keputusan komite."
                steps={[
                  'Centang satu atau beberapa berkas pada tabel di bawah.',
                  'Tulis risalah/catatan komite pada kotak teks.',
                  'Pilih putusan. Persetujuan hanya menerbitkan status penawaran yang menunggu penerimaan.',
                ]}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                style={{ width: '280px', minHeight: '34px', fontSize: '0.8rem' }}
                value={committeeNote}
                onChange={(e) => setCommitteeNote(e.target.value)}
                aria-label="Catatan Keputusan Komite"
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={eligibleSelectedBatchIds.length === 0}
                onClick={() => handleExecuteBatch('APPROVED_PENDING_ACCEPTANCE')}
              >
                Setujui ke tahap penawaran ({eligibleSelectedBatchIds.length})
              </button>
              <button
                type="button"
                className="btn btn-warn btn-sm"
                disabled={eligibleSelectedBatchIds.length === 0}
                onClick={() => handleExecuteBatch('RESTRUCTURE_HOLD')}
              >
                Tahan / Restrukturisasi
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={eligibleSelectedBatchIds.length === 0}
                onClick={() => handleExecuteBatch('REJECTED')}
              >
                Batch Tolak
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="swiss-table">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '44px' }}>
                    <input
                      type="checkbox"
                      aria-label="Pilih semua berkas"
                      checked={
                        committeeReadyApps.length > 0 &&
                        committeeReadyApps.every((app) => selectedBatchIds.includes(app.id))
                      }
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th>ID Berkas</th>
                  <th>Debitur &amp; Sektor</th>
                  <th>Skema Akad</th>
                  <th className="text-right">Jumlah pengajuan</th>
                  <th className="text-center">Skor demo</th>
                  <th className="text-right">Sinyal risiko / proxy agunan</th>
                  <th className="text-right">DSCR</th>
                  <th className="text-center">Komitmen investor demo</th>
                  <th className="text-center">Status Putusan</th>
                  <th className="text-center">Inspeksi</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const ev = evaluations[app.id];
                  const isChecked = app.status === 'COMMITTEE_READY' && selectedBatchIds.includes(app.id);
                  const p2pSum = app.p2pCommitments.reduce(
                    (s, c) => s + c.committedAmount,
                    0
                  );
                  const p2pPct = Math.min(
                    100,
                    Math.round((p2pSum / Math.max(1, app.requestedAmount)) * 100)
                  );

                  return (
                    <tr key={app.id} className={isChecked ? 'row-selected' : ''}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          aria-label={`Pilih berkas ${app.id}`}
                          checked={isChecked}
                          disabled={app.status !== 'COMMITTEE_READY'}
                          onChange={() => toggleSelectId(app.id)}
                        />
                      </td>
                      <td className="font-mono-code" style={{ fontWeight: 700 }}>{app.id}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{app.applicantName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {app.businessSector} • SLIK KOL-{app.slikKol}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral font-mono-code">
                          {app.scheme.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                        <div>{formatIDR(app.requestedAmount)}</div>
                        <div style={{ fontSize: '0.72rem', color: Math.max(0, app.requestedAmount - p2pSum) > bankHealth.bmpkMaxSingleBorrower ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                          Kas Bank: {formatCompactIDR(Math.max(0, app.requestedAmount - p2pSum))}
                          {Math.max(0, app.requestedAmount - p2pSum) > bankHealth.bmpkMaxSingleBorrower ? ' (>BMPK!)' : ''}
                        </div>
                      </td>
                      <td className="text-center num-financial">
                        <span
                          className={`badge ${
                            ev.creditScore >= 690
                              ? 'badge-safe'
                              : ev.creditScore >= 580
                                ? 'badge-warn'
                                : 'badge-danger'
                          }`}
                        >
                          {ev.creditScore} ({ev.ratingGrade})
                        </span>
                      </td>
                      <td className="text-right num-financial">
                        {ev.riskSignalPct.toFixed(2)}% / {ev.lgdPct.toFixed(0)}%
                      </td>
                      <td
                        className="text-right num-financial"
                        style={{
                          fontWeight: 700,
                          color:
                            ev.dscr >= 1.25
                              ? 'var(--status-safe)'
                              : 'var(--status-danger)',
                        }}
                      >
                        {ev.calculationLimitations.length ? 'Belum dihitung' : `${ev.dscr.toFixed(2)}x`}
                      </td>
                      <td className="text-center num-financial">
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px' }}>
                          {p2pPct}% ({formatCompactIDR(p2pSum)})
                        </div>
                        <div className="swiss-meter">
                          <div className="swiss-meter-fill" style={{ width: `${p2pPct}%` }} />
                        </div>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            app.status === 'APPROVED_DISBURSED' || app.status === 'P2P_FUNDS_RELEASED'
                              ? 'badge-safe'
                              : app.status === 'REJECTED'
                                ? 'badge-danger'
                                : 'badge-warn'
                          }`}
                        >
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onInspectInUnderwriter(app.id)}
                        >
                          Detail →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

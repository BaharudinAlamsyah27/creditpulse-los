import React, { useState } from 'react';
import {
  ApplicationStatus,
  CreditUnderwritingEvaluation,
  DemoScenarioKey,
  DocumentReviewStatus,
  GovernanceAuditEntry,
  LoanApplication,
  RiskPolicyConfig,
} from '../types/credit';
import {
  evaluateLoanApplication,
  formatCompactIDR,
  formatIDR,
} from '../engine/creditEngine';
import {
  CashflowMutationTrendChart,
  CreditScoreGaugeChart,
  RiskFactorDivergingChart,
} from './AdminCharts';
import { HelpTip } from './HelpTip';
import { DEMO_SCENARIO_PRESETS } from '../data/demoApplications';

interface UnderwriterPortalProps {
  applications: LoanApplication[];
  evaluations: Record<string, CreditUnderwritingEvaluation>;
  riskPolicy: RiskPolicyConfig;
  selectedAppId: string;
  onSelectAppId: (id: string) => void;
  onToggleDocumentVerified: (appId: string, docId: string) => void;
  onUpdateDocumentStatus?: (
    appId: string,
    docId: string,
    status: DocumentReviewStatus,
    notes?: string
  ) => void;
  onUpdateApplicationParams: (
    appId: string,
    updates: Partial<LoanApplication>,
    auditSummary: string
  ) => void;
  onForwardToStatus: (
    appId: string,
    newStatus: ApplicationStatus,
    note: string
  ) => void;
  onOpenOfficialMemo: () => void;
  onSelectScenarioPreset?: (presetKey: DemoScenarioKey) => void;
  auditLogs?: GovernanceAuditEntry[];
  onAddReviewComment?: (
    appId: string,
    reviewerName: string,
    actionType: string,
    comment: string
  ) => void;
}

export const UnderwriterPortal: React.FC<UnderwriterPortalProps> = ({
  applications,
  evaluations,
  riskPolicy,
  selectedAppId,
  onSelectAppId,
  onToggleDocumentVerified,
  onUpdateDocumentStatus,
  onUpdateApplicationParams,
  onForwardToStatus,
  onOpenOfficialMemo,
  onSelectScenarioPreset,
  auditLogs = [],
  onAddReviewComment,
}) => {
  const selectedApp =
    applications.find((a) => a.id === selectedAppId) || applications[0];
  const evaluation = evaluations[selectedApp.id];

  const [showRawMutationTable, setShowRawMutationTable] = useState(false);
  const [stressRevenueDropPct, setStressRevenueDropPct] = useState(0);
  const [stressPlafondOverride, setStressPlafondOverride] = useState<number | null>(
    null
  );
  const [analystMemoInput, setAnalystMemoInput] = useState('');

  const [reviewerName, setReviewerName] = useState(
    'Dra. Meutia Rahmawati, Ak. (Risk Reviewer)'
  );
  const [reviewActionType, setReviewActionType] = useState(
    'REVIEWER_RECOMMENDATION'
  );
  const [reviewCommentText, setReviewCommentText] = useState('');

  const appAuditLogs = auditLogs.filter((l) => l.applicationId === selectedApp.id);

  const activeStressPlafond =
    stressPlafondOverride ?? selectedApp.requestedAmount;

  const stressedEvaluation = evaluateLoanApplication(
    {
      ...selectedApp,
      requestedAmount: activeStressPlafond,
      monthlyRevenue: Math.round(
        selectedApp.monthlyRevenue * (1 - stressRevenueDropPct / 100)
      ),
    },
    riskPolicy
  );

  const handleSelectApplication = (id: string) => {
    onSelectAppId(id);
    setStressRevenueDropPct(0);
    setStressPlafondOverride(null);
    setAnalystMemoInput('');
  };

  const handleApplyRecommendedPlafond = () => {
    const recPlafond = Math.max(50_000_000, evaluation.maxRecommendedPlafond);
    onUpdateApplicationParams(
      selectedApp.id,
      {
        requestedAmount: recPlafond,
        status: 'COMMITTEE_READY',
      },
      `Analis demo mengubah jumlah pengajuan menjadi ${formatIDR(recPlafond)} dan meneruskannya untuk tinjauan komite.`
    );
    setStressPlafondOverride(null);
  };

  return (
    <>
      <div className="adminlte-content-header">
        <div>
          <span className="swiss-kicker">
            PORTAL ANALIS KREDIT — PRA-SCREENING ATURAN DEMO
          </span>
          <h1 style={{ fontSize: '1.55rem', marginTop: '0.2rem' }}>
            Underwriting Debitur: {selectedApp.applicantName} ({selectedApp.id})
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={onOpenOfficialMemo}
          >
            Cetak Contoh Nota Analisa (PDF)
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              onForwardToStatus(
                selectedApp.id,
                'COMMITTEE_READY',
                analystMemoInput.trim() ||
                  `Rekomendasi analis demo untuk tinjauan komite (Skor demo ${evaluation.creditScore}; bukan persetujuan otomatis).`
              )
            }
          >
            Ajukan untuk tinjauan komite →
          </button>
          {!evaluation.calculationLimitations.length && evaluation.dscr < 1.25 && evaluation.maxRecommendedPlafond >= 50_000_000 && (
            <button
              type="button"
              className="btn btn-warn"
              onClick={handleApplyRecommendedPlafond}
            >
              Restrukturisasi Plafon ke {formatCompactIDR(evaluation.maxRecommendedPlafond)}
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger"
            onClick={() =>
              onForwardToStatus(
                selectedApp.id,
                'REJECTED',
                analystMemoInput.trim() ||
                  `Ditolak di tahap Underwriting: ${
                    evaluation.policyBreaches[0] || 'Risiko kredit melampaui ambang batas.'
                  }`
              )
            }
          >
            Tolak (Reject)
          </button>
        </div>
      </div>

      <div className="adminlte-content">
        {/* Preset Scenarios Card */}
        {onSelectScenarioPreset && (
          <div
            className="adminlte-card"
            style={{
              borderLeft: '4px solid var(--accent-primary)',
              backgroundColor: 'var(--bg-elevated)',
            }}
          >
            <div className="adminlte-card-body" style={{ padding: '0.85rem 1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.6rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span className="swiss-kicker" style={{ color: 'var(--accent-primary)' }}>
                    PAKET SKENARIO DEMO DETERMINISTIK (PILIHAN CEPAT)
                  </span>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Pulihkan profil debitur uji terarah berikut tanpa menghapus seluruh data browser.
                  </div>
                </div>
                <HelpTip
                  title="Paket Skenario Demo Siap Pakai"
                  description="Gunakan tombol skenario berikut untuk memuat contoh kasus deterministik yang memperagakan tiga profil risiko utama: kasus lancar lolos aturan, kasus batas (borderline) yang memerlukan restrukturisasi, dan kasus berisiko tinggi yang terdeteksi anomali."
                  steps={[
                    'Kasus Lancar (Prime): Arus kas sehat, DSCR 2.22x, dokumen terverifikasi.',
                    'Kasus Borderline: Kapasitas bayar mepet, DSR 34.6%, membutuhkan penyesuaian plafon/tenor.',
                    'Kasus Perlu Ditolak: Terindikasi window dressing 2.3x dan 2x tolakan kliring.',
                  ]}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {DEMO_SCENARIO_PRESETS.map((p) => {
                  const isSelected = selectedApp.id === p.appId;
                  return (
                    <div
                      key={p.key}
                      onClick={() => onSelectScenarioPreset(p.key)}
                      style={{
                        padding: '0.75rem 0.95rem',
                        borderRadius: '6px',
                        border: isSelected
                          ? '2px solid var(--accent-primary)'
                          : '1px solid var(--border-card)',
                        backgroundColor: isSelected
                          ? 'var(--accent-primary-soft)'
                          : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.3rem',
                        }}
                      >
                        <span className={`badge ${p.badgeClass}`} style={{ fontSize: '0.72rem' }}>
                          {p.badgeLabel}
                        </span>
                        <span className="font-mono-code" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.appId}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.2rem' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        {p.summary}
                      </div>
                      <div
                        className="num-financial"
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {p.keyMetrics}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Top Borrower Selector Pills Bar (Spacious AdminLTE Selector) */}
        <div className="adminlte-card">
          <div className="adminlte-card-body" style={{ padding: '0.9rem 1.25rem' }}>
            <div className="swiss-kicker" style={{ marginBottom: '0.5rem' }}>
              PILIH BERKAS DEBITUR DALAM ANTREAN UNDERWRITING ({applications.length} APLIKASI):
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {applications.map((app) => {
                const ev = evaluations[app.id];
                const active = app.id === selectedApp.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelectApplication(app.id)}
                    className={`btn btn-sm ${active ? 'btn-primary' : ''}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.85rem',
                    }}
                  >
                    <span className="font-mono-code">{app.id}</span>
                    <span>{app.applicantName}</span>
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
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 AdminLTE Small-Box Risk KPIs */}
        <section className="adminlte-kpi-grid">
          <div className="small-box">
            <div
              className="small-box-top-bar"
              style={{
                backgroundColor:
                  evaluation.riskSignalPct < 5
                    ? 'var(--status-safe)'
                    : evaluation.riskSignalPct < 20
                      ? 'var(--status-warn)'
                      : 'var(--status-danger)',
              }}
            />
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial">
                  {evaluation.riskSignalPct.toFixed(2)}%
                </div>
                <div className="small-box-label">Sinyal risiko demo (bukan PD)</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Skor demo: {evaluation.creditScore}</span>
              <span>Grade {evaluation.ratingGrade}</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-top-bar" style={{ backgroundColor: 'var(--accent-info)' }} />
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial">
                  {evaluation.lgdPct.toFixed(1)}%
                </div>
                <div className="small-box-label">Proxy kerugian agunan demo</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Haircut Agunan: {evaluation.collateralHaircutPct}%</span>
              <span>Likuidasi: {formatCompactIDR(evaluation.collateralLiquidationValue)}</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-top-bar" style={{ backgroundColor: 'var(--status-warn)' }} />
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial" style={{ color: 'var(--status-warn)' }}>
                  {formatIDR(evaluation.indicativeLossProxyAmount)}
                </div>
                <div className="small-box-label">Proxy kerugian ilustratif</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Jumlah pengajuan: {formatCompactIDR(evaluation.requestedExposureAmount)}</span>
              <span>Sinyal spread demo: {evaluation.indicativeRiskSpreadPct}%</span>
            </div>
          </div>

          <div className="small-box">
            <div
              className="small-box-top-bar"
              style={{
                backgroundColor:
                  evaluation.dscr >= 1.25
                    ? 'var(--status-safe)'
                    : 'var(--status-danger)',
              }}
            />
            <div className="small-box-inner">
              <div>
                <div
                  className="small-box-value num-financial"
                  style={{
                    color:
                      evaluation.dscr >= 1.25
                        ? 'var(--status-safe)'
                        : 'var(--status-danger)',
                  }}
                >
                  {evaluation.calculationLimitations.length ? '—' : `${evaluation.dscr.toFixed(2)}x`}
                </div>
                <div className="small-box-label">DSCR &amp; Altman Z&apos;&apos; ({evaluation.altmanZDoublePrime})</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Beban utang/omzet: {evaluation.calculationLimitations.length ? '—' : `${evaluation.dsrPct.toFixed(1)}%`}</span>
              <span>Zona {evaluation.altmanZone}</span>
            </div>
          </div>
        </section>

        {/* Visual Charts Row 1: Speedometer Gauge + Stress Test Slider AND SHAP Diverging Chart */}
        <section className="row-5-7">
          <div className="adminlte-card card-info">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  Speedometer Skor Kredit &amp; Simulator Uji Stres (What-If)
                </div>
                <div className="adminlte-card-subtitle">
                  Geser slider untuk menguji ketahanan debitur terhadap guncangan omzet
                </div>
              </div>
              <HelpTip
                title="Simulator Uji Stres (Stress Testing)"
                description="Fitur ini memungkinkan Credit Analyst menguji skenario buruk: bagaimana jika omzet debitur turun 10%–40% atau plafon pinjaman diubah?"
                steps={[
                  'Geser slider "Simulasi Penurunan Omzet Usaha" untuk melihat dampak penurunan pendapatan terhadap rasio arus kas dan sinyal risiko demo.',
                  'Geser slider "Simulasi Penyesuaian Plafon" untuk mencari titik plafon aman di mana DSCR tetap di atas batas kebijakan bank.',
                ]}
              />
            </div>
            <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <CreditScoreGaugeChart
                score={stressedEvaluation.creditScore}
                grade={stressedEvaluation.ratingGrade}
                riskSignalPct={stressedEvaluation.riskSignalPct}
                dscr={stressedEvaluation.calculationLimitations.length ? null : stressedEvaluation.dscr}
              />

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div>
                  <label
                    htmlFor="stress-rev-slider"
                    className="form-label"
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Simulasi Penurunan Omzet Usaha:</span>
                    <strong className="num-financial">-{stressRevenueDropPct}%</strong>
                  </label>
                  <input
                    id="stress-rev-slider"
                    type="range"
                    min={0}
                    max={40}
                    step={5}
                    value={stressRevenueDropPct}
                    onChange={(e) => setStressRevenueDropPct(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '0.3rem' }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="stress-plafond-slider"
                    className="form-label"
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Simulasi Penyesuaian Plafon Kredit:</span>
                    <strong className="num-financial">
                      {formatIDR(activeStressPlafond)}
                    </strong>
                  </label>
                  <input
                    id="stress-plafond-slider"
                    type="range"
                    min={50_000_000}
                    max={1_200_000_000}
                    step={25_000_000}
                    value={activeStressPlafond}
                    onChange={(e) => setStressPlafondOverride(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '0.3rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="adminlte-card card-success">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  Kontribusi Faktor pada Skor Demo
                </div>
                <div className="adminlte-card-subtitle">
                  Dekomposisi faktor yang menaikkan atau menurunkan skor kredit debitur
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-warn font-mono-code">ATURAN DEMO</span>
                <HelpTip
                  title="Kontribusi Faktor pada Skor Demo"
                  description="Grafik ini menunjukkan kontribusi yang ditetapkan oleh aturan demo. Ini bukan hasil SHAP atau penjelasan dari model machine learning terlatih."
                  formula="Transformasi poin ilustratif dari bobot aturan yang ditulis di creditEngine.ts"
                  steps={[
                    'Batang Hijau ke kanan (+ pts) adalah faktor kekuatan debitur yang menurunkan risiko gagal bayar.',
                    'Batang Merah ke kiri (- pts) adalah faktor kelemahan/pelanggaran yang menaikkan risiko gagal bayar.',
                  ]}
                />
              </div>
            </div>
            <div className="adminlte-card-body">
              <RiskFactorDivergingChart contributions={evaluation.riskFactorContributions} />
            </div>
          </div>
        </section>

        {/* Visual Charts Row 2: 6-Month Bank Statement Cashflow Area Chart & Anomaly Forensics */}
        <div className="adminlte-card card-warning">
          <div className="adminlte-card-header">
            <div>
              <div className="adminlte-card-title">
                Grafik Forensik Mutasi Rekening Koran 6 Bulan &amp; Deteksi Anomali
              </div>
              <div className="adminlte-card-subtitle">
                Retensi Saldo Akhir: {evaluation.mutationNetRetentionPct}% • Volatilitas (CV):{' '}
                {evaluation.mutationVolatilityCv}% • Rata-rata Inflow:{' '}
                {formatIDR(evaluation.mutationAvgInflow)}/bln
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowRawMutationTable((prev) => !prev)}
              >
                {showRawMutationTable
                  ? 'Sembunyikan Tabel Rincian Mutasi'
                  : 'Tampilkan Tabel Angka Mutasi 6 Bulan'}
              </button>
              <HelpTip
                title="Forensik Mutasi Rekening Koran 6 Bulan"
                description="Algoritma forensik memeriksa keaslian arus kas UMKM dari rekening koran 6 bulan terakhir untuk mendeteksi manipulasi laporan keuangan."
                steps={[
                  'Window Dressing: Mendeteksi lonjakan kas masuk tidak wajar (>1.65x) pada bulan terakhir menjelang pengajuan kredit.',
                  'Transaksi Bulat Sirkuler: Mendeteksi proporsi transfer nominal bulat sempurna yang tinggi antar-rekening afiliasi.',
                  'Tolakan Kliring / BG Kosong: Memberikan penalti risiko tinggi jika ditemukan cek/bilyet giro ditolak.',
                ]}
              />
            </div>
          </div>

          <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Anomaly Alert Banners */}
            {evaluation.anomalies.length === 0 ? (
              <div
                style={{
                  padding: '0.85rem 1.15rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--status-safe-bg)',
                  color: 'var(--status-safe)',
                  border: '1px solid var(--status-safe)',
                  fontWeight: 600,
                }}
              >
                FORENSIK REKENING BERSIH: Arus kas masuk konsisten dengan laporan omzet, tanpa
                lonjakan Window Dressing maupun tolakan kliring Bilyet Giro.
              </div>
            ) : (
              <div className="row-3-col">
                {evaluation.anomalies.map((anom) => (
                  <div
                    key={anom.code}
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: '4px',
                      border: '1px solid var(--status-danger)',
                      backgroundColor:
                        anom.severity === 'HIGH'
                          ? 'var(--status-danger-bg)'
                          : 'var(--status-warn-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span className={`badge ${anom.severity === 'HIGH' ? 'badge-danger' : 'badge-warn'}`}>
                        {anom.severity} // {anom.code}
                      </span>
                      <strong className="num-financial" style={{ fontSize: '0.82rem' }}>
                        {anom.metricValue}
                      </strong>
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{anom.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {anom.detail}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SVG Area & Line Chart */}
            <CashflowMutationTrendChart mutations={selectedApp.mutations} />

            {/* Optional Collapsible Raw Table */}
            {showRawMutationTable && (
              <div className="table-wrap" style={{ borderTop: '1px solid var(--border-grid)', paddingTop: '1rem' }}>
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>Bulan</th>
                      <th className="text-right">Mutasi Kredit (Inflow)</th>
                      <th className="text-right">Mutasi Debit (Outflow)</th>
                      <th className="text-right">Saldo Akhir</th>
                      <th className="text-center">Jumlah Tx</th>
                      <th className="text-center">Tx Bulat</th>
                      <th className="text-center">Tolakan Kliring</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedApp.mutations.map((m) => (
                      <tr key={m.month}>
                        <td className="font-mono-code" style={{ fontWeight: 700 }}>{m.month}</td>
                        <td className="text-right num-financial">{formatIDR(m.creditInflow)}</td>
                        <td className="text-right num-financial">{formatIDR(m.debitOutflow)}</td>
                        <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                          {formatIDR(m.endingBalance)}
                        </td>
                        <td className="text-center num-financial">{m.transactionCount}</td>
                        <td className="text-center num-financial">{m.roundNumberTxCount}</td>
                        <td className="text-center">
                          {m.bouncedCheckCount > 0 ? (
                            <span className="badge badge-danger">{m.bouncedCheckCount} Tolakan</span>
                          ) : (
                            <span className="badge badge-safe">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Document Checklist & Policy Covenant Memo */}
        <section className="row-2-col">
          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  Checklist Dokumen — Penelaahan Berjenjang Demo
                </div>
                <div className="adminlte-card-subtitle">
                  Penelaahan administratif lokal bertahap. Tidak mewakili verifikasi biro eksternal.
                </div>
              </div>
              <HelpTip
                title="Penelaahan Dokumen Berjenjang"
                description="Analis dapat memeriksa kelengkapan berkas fisik/digital secara bertahap dan mencatat status telaah serta catatan per dokumen."
                steps={[
                  'Pilih status: Belum Diperiksa, Sedang Ditelaah, Diverifikasi Valid, atau Perlu Revisi.',
                  'Tulis catatan temuan atau klarifikasi jika dokumen memerlukan penjelasan debitur.',
                  'Status verifikasi dokumen akan direfleksikan pada kalkulasi skor dan nota analisa kredit.',
                ]}
              />
            </div>

            {/* Checklist Progress Meter */}
            <div
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border-grid)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
              }}
            >
              {(() => {
                const total = selectedApp.documents.length;
                const verified = selectedApp.documents.filter(
                  (d) => d.verified || d.status === 'VERIFIED'
                ).length;
                const inReview = selectedApp.documents.filter(
                  (d) => d.status === 'IN_REVIEW'
                ).length;
                const needsRevision = selectedApp.documents.filter(
                  (d) => d.status === 'REJECTED_REVISION'
                ).length;
                const pct = Math.round((verified / (total || 1)) * 100);

                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="swiss-kicker" style={{ margin: 0 }}>
                        STATUS KELENGKAPAN:
                      </span>
                      <strong className="num-financial" style={{ fontSize: '0.88rem' }}>
                        {verified} dari {total} Dokumen Diperiksa ({pct}%)
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-safe">{verified} Valid</span>
                      {inReview > 0 && <span className="badge badge-info">{inReview} Ditelaah</span>}
                      {needsRevision > 0 && (
                        <span className="badge badge-danger">{needsRevision} Revisi</span>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {selectedApp.documents.map((doc) => {
                const currentStatus: DocumentReviewStatus =
                  doc.status ?? (doc.verified ? 'VERIFIED' : 'PENDING_REVIEW');
                const isVerified = currentStatus === 'VERIFIED';
                const isRevision = currentStatus === 'REJECTED_REVISION';
                const isInReview = currentStatus === 'IN_REVIEW';

                const badgeClass = isVerified
                  ? 'badge-safe'
                  : isRevision
                    ? 'badge-danger'
                    : isInReview
                      ? 'badge-info'
                      : 'badge-warn';

                const statusLabel = isVerified
                  ? 'Diverifikasi Valid'
                  : isRevision
                    ? 'Perlu Revisi / Klarifikasi'
                    : isInReview
                      ? 'Sedang Ditelaah'
                      : 'Belum Diperiksa';

                return (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '6px',
                      border: isVerified
                        ? '1px solid var(--border-card)'
                        : isRevision
                          ? '1px solid var(--status-danger)'
                          : '1px solid var(--border-grid)',
                      backgroundColor: isVerified
                        ? 'var(--bg-elevated)'
                        : isRevision
                          ? 'var(--status-danger-bg)'
                          : 'var(--bg-surface)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.8rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <span className="font-mono-code" style={{ color: 'var(--accent-primary)', marginRight: '0.4rem', fontWeight: 700 }}>
                          [{doc.code}]
                        </span>
                        <strong style={{ fontSize: '0.88rem' }}>{doc.label}</strong>
                      </div>
                      <span className={`badge ${badgeClass}`}>{statusLabel}</span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {doc.notes || 'Catatan sistem: dokumen sintetis tersimpan di browser.'}
                    </div>

                    {/* Review Actions & Inline Notes */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.6rem',
                        marginTop: '0.3rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        style={{ flex: 1, minWidth: '180px', fontSize: '0.78rem', height: '30px' }}
                        placeholder="Catatan penelaahan analis..."
                        value={doc.reviewNotes ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (onUpdateDocumentStatus) {
                            onUpdateDocumentStatus(selectedApp.id, doc.id, currentStatus, val);
                          }
                        }}
                      />

                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${isVerified ? 'btn-primary' : ''}`}
                          style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem' }}
                          onClick={() => {
                            if (onUpdateDocumentStatus) {
                              onUpdateDocumentStatus(
                                selectedApp.id,
                                doc.id,
                                isVerified ? 'PENDING_REVIEW' : 'VERIFIED'
                              );
                            } else {
                              onToggleDocumentVerified(selectedApp.id, doc.id);
                            }
                          }}
                        >
                          {isVerified ? 'Tandai Batal' : 'Valid ✓'}
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${isInReview ? 'btn-primary' : ''}`}
                          style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem' }}
                          onClick={() => {
                            if (onUpdateDocumentStatus) {
                              onUpdateDocumentStatus(
                                selectedApp.id,
                                doc.id,
                                isInReview ? 'PENDING_REVIEW' : 'IN_REVIEW'
                              );
                            }
                          }}
                        >
                          Telaah ⏳
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${isRevision ? 'btn-danger' : ''}`}
                          style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem' }}
                          onClick={() => {
                            if (onUpdateDocumentStatus) {
                              onUpdateDocumentStatus(
                                selectedApp.id,
                                doc.id,
                                isRevision ? 'PENDING_REVIEW' : 'REJECTED_REVISION'
                              );
                            }
                          }}
                        >
                          Revisi ⚠️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  Evaluasi Kepatuhan Kebijakan Kredit &amp; Memo Underwriter
                </div>
                <div className="adminlte-card-subtitle">
                  Plafon Maksimum Aman (DSCR ≥ 1.25x): {formatIDR(evaluation.maxRecommendedPlafond)}
                </div>
              </div>
            </div>
            <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {evaluation.policyBreaches.length > 0 && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid var(--status-danger)',
                    backgroundColor: 'var(--status-danger-bg)',
                  }}
                >
                  <div className="swiss-kicker" style={{ color: 'var(--status-danger)', marginBottom: '0.35rem' }}>
                    TEMUAN PELANGGARAN KEBIJAKAN ({evaluation.policyBreaches.length})
                  </div>
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.82rem' }}>
                    {evaluation.policyBreaches.map((b, i) => (
                      <li key={i} style={{ marginBottom: '0.2rem' }}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.strengths.length > 0 && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid var(--status-safe)',
                    backgroundColor: 'var(--status-safe-bg)',
                  }}
                >
                  <div className="swiss-kicker" style={{ color: 'var(--status-safe)', marginBottom: '0.35rem' }}>
                    FAKTOR PENGUAT KREDIT ({evaluation.strengths.length})
                  </div>
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.82rem' }}>
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} style={{ marginBottom: '0.2rem' }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="analyst-memo">
                  Catatan Risalah Underwriter untuk Komite Kredit
                </label>
                <textarea
                  id="analyst-memo"
                  rows={3}
                  className="form-control"
                  placeholder={selectedApp.analystNotes}
                  value={analystMemoInput}
                  onChange={(e) => setAnalystMemoInput(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Row 4: Four-Eyes Principle Reviewer Comments & Case Audit History */}
        <div className="adminlte-card">
          <div className="adminlte-card-header">
            <div>
              <div className="adminlte-card-title">
                Catatan Reviewer, Pemberi Saran &amp; Riwayat Tindakan Kasus ({appAuditLogs.length} Catatan)
              </div>
              <div className="adminlte-card-subtitle">
                Prinsip Four-Eyes Check: Rekam komentar berjenjang dari Analis, Reviewer Risiko, dan Penasihat Komite untuk berkas {selectedApp.id}
              </div>
            </div>
            <HelpTip
              title="Catatan Reviewer & Pemberi Saran (Four-Eyes Principle)"
              description="Dalam praktik perbankan nyata, satu berkas pengajuan diperiksa dan diberi catatan saran oleh lebih dari satu pejabat (Maker-Checker / Reviewer) sebelum diputuskan."
              steps={[
                'Lihat histori komentar dan saran mitigasi risiko yang sudah tercatat untuk debitur ini.',
                'Tambahkan saran baru (mis. syarat pencairan, permintaan invoice, atau catatan survei lapangan) melalui formulir di bawah.',
                'Semua komentar akan masuk otomatis ke Rekaman Riwayat Tindakan & Audit Log Global.',
              ]}
            />
          </div>

          <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Existing Case Comments Timeline */}
            {appAuditLogs.length === 0 ? (
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', padding: '0.75rem' }}>
                Belum ada riwayat komentar reviewer untuk berkas ini. Tambahkan saran pertama di bawah.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {appAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '6px',
                      borderLeft: log.actionType.includes('REJECT') || log.actionType.includes('FRAUD') || log.actionType.includes('ANOMALY')
                        ? '4px solid var(--status-danger)'
                        : log.actionType.includes('REVIEWER') || log.actionType.includes('COVENANT')
                          ? '4px solid var(--accent-primary)'
                          : '4px solid var(--accent-info)',
                      backgroundColor: 'var(--bg-elevated)',
                      borderTop: '1px solid var(--border-grid)',
                      borderRight: '1px solid var(--border-grid)',
                      borderBottom: '1px solid var(--border-grid)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.35rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.86rem' }}>{log.actorName}</strong>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          {log.actionType}
                        </span>
                      </div>
                      <span className="font-mono-code" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.timestamp}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      {log.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Reviewer Comment / Advisory Form */}
            {onAddReviewComment && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reviewCommentText.trim()) return;
                  onAddReviewComment(
                    selectedApp.id,
                    reviewerName,
                    reviewActionType,
                    reviewCommentText.trim()
                  );
                  setReviewCommentText('');
                }}
                style={{
                  padding: '1rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div className="swiss-kicker" style={{ color: 'var(--accent-primary)' }}>
                  TAMBAHKAN KOMENTAR / SARAN REVIEWER BARU
                </div>

                <div className="row-2-col" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>
                      Pejabat Reviewer / Pemberi Saran
                    </label>
                    <select
                      className="form-control"
                      style={{ fontSize: '0.82rem' }}
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                    >
                      <option value="Dra. Meutia Rahmawati, Ak. (Risk Reviewer)">
                        Dra. Meutia Rahmawati, Ak. (Risk Reviewer)
                      </option>
                      <option value="Bambang Wijaya, SE. (Senior Credit Reviewer)">
                        Bambang Wijaya, SE. (Senior Credit Reviewer)
                      </option>
                      <option value="H. Prabowo Suryo, MM. (Penasihat Komite)">
                        H. Prabowo Suryo, MM. (Penasihat Komite)
                      </option>
                      <option value="R. Aditya Pratama, CFA (Lead Underwriter)">
                        R. Aditya Pratama, CFA (Lead Underwriter)
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>
                      Kategori Saran / Tindakan
                    </label>
                    <select
                      className="form-control"
                      style={{ fontSize: '0.82rem' }}
                      value={reviewActionType}
                      onChange={(e) => setReviewActionType(e.target.value)}
                    >
                      <option value="REVIEWER_RECOMMENDATION">
                        Saran Mitigasi &amp; Rekomendasi Reviewer
                      </option>
                      <option value="REVIEWER_COVENANT_ADVICE">
                        Syarat Pencairan / Covenant Agunan
                      </option>
                      <option value="REVIEWER_CLARIFICATION_REQ">
                        Permintaan Klarifikasi / Dokumen Tambahan
                      </option>
                      <option value="FIELD_VERIFICATION_NOTE">
                        Catatan Survei / Kunjungan Lapangan
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    Uraian Komentar / Saran Profesional
                  </label>
                  <textarea
                    rows={2}
                    className="form-control"
                    style={{ fontSize: '0.82rem' }}
                    placeholder="Contoh: Saran Reviewer — Wajibkan penyerahan PO/kontrak offtaker asli dan asuransi All-Risk sebelum penandatanganan akad..."
                    value={reviewCommentText}
                    onChange={(e) => setReviewCommentText(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!reviewCommentText.trim()}
                  >
                    + Simpan Komentar Reviewer ke Audit Log
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

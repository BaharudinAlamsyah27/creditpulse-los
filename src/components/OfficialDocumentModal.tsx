import React from 'react';
import {
  BankHealthMetrics,
  CreditUnderwritingEvaluation,
  InternalBankProfile,
  LoanApplication,
} from '../types/credit';
import {
  formatCompactIDR,
  formatIDR,
  generateAmortizationSchedule,
} from '../engine/creditEngine';

export type OfficialDocType = 'MAK_CREDIT_MEMO' | 'SP3K_OFFERING' | 'ALCO_COMMITTEE_PACK';

interface OfficialDocumentModalProps {
  docType: OfficialDocType;
  onClose: () => void;
  onChangeDocType: (type: OfficialDocType) => void;
  selectedApp: LoanApplication;
  evaluation: CreditUnderwritingEvaluation;
  allApplications: LoanApplication[];
  allEvaluations: Record<string, CreditUnderwritingEvaluation>;
  bankProfile: InternalBankProfile;
  bankHealth: BankHealthMetrics;
}

export const OfficialDocumentModal: React.FC<OfficialDocumentModalProps> = ({
  docType,
  onClose,
  onChangeDocType,
  selectedApp,
  evaluation,
  allApplications,
  allEvaluations,
  bankProfile,
  bankHealth,
}) => {
  const schedule = generateAmortizationSchedule(
    selectedApp.requestedAmount,
    selectedApp.tenorMonths,
    selectedApp.annualRateOrMarginPct,
    selectedApp.scheme
  );

  const p2pFunded = selectedApp.p2pCommitments.reduce(
    (s, c) => s + c.committedAmount,
    0
  );
  const bankPortion = Math.max(0, selectedApp.requestedAmount - p2pFunded);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadHtmlReport = () => {
    const el = document.getElementById('printable-official-sheet');
    if (!el) return;
    const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Contoh Dokumen Demo - ${docType} - ${selectedApp.id}</title>
<style>
  body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #111417; margin: 32px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th, td { border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; }
  th { background: #F1F5F9; font-weight: 700; text-transform: uppercase; font-size: 11px; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
</style>
</head>
<body>
${el.innerHTML}
</body>
</html>`;
    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docType}_${selectedApp.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau Dokumen Contoh Demo"
      className="doc-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 14, 18, 0.72)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem 1rem',
        overflowY: 'auto',
      }}
    >
      {/* Top Action Toolbar (Hidden when printing) */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: '960px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div className="adminlte-tabs">
          <button
            type="button"
            className={`adminlte-tab-btn ${docType === 'MAK_CREDIT_MEMO' ? 'active' : ''}`}
            onClick={() => onChangeDocType('MAK_CREDIT_MEMO')}
          >
            1. Memorandum Analisa Kredit (MAK)
          </button>
          <button
            type="button"
            className={`adminlte-tab-btn ${docType === 'SP3K_OFFERING' ? 'active' : ''}`}
            onClick={() => onChangeDocType('SP3K_OFFERING')}
          >
            2. Surat Persetujuan (SP3K &amp; Angsuran)
          </button>
          <button
            type="button"
            className={`adminlte-tab-btn ${docType === 'ALCO_COMMITTEE_PACK' ? 'active' : ''}`}
            onClick={() => onChangeDocType('ALCO_COMMITTEE_PACK')}
          >
            3. Risalah Rapat Komite &amp; ALCO Bank
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handlePrintPdf}
          >
            Cetak / Simpan PDF (A4)
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleDownloadHtmlReport}
          >
            Unduh File (.HTML)
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onClose}
          >
            Tutup ✕
          </button>
        </div>
      </div>

      {/* A4 Printable Official Sheet */}
      <div
        id="printable-official-sheet"
        className="printable-sheet"
        style={{
          width: '100%',
          maxWidth: '960px',
          backgroundColor: '#FFFFFF',
          color: '#111417',
          borderRadius: '8px',
          padding: '2.5rem 2.75rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ border: '2px solid #B42318', color: '#B42318', padding: '0.65rem', textAlign: 'center', fontWeight: 800, letterSpacing: '0.06em', marginBottom: '1rem' }}>
          CONTOH DOKUMEN DEMO — BUKAN DOKUMEN RESMI ATAU INSTRUKSI PENCAIRAN
        </div>
        {/* Official Bank Letterhead / Kop Surat */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '1.1rem',
            borderBottom: '3px double #111417',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: '#162220',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}
            >
              BNK
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#111417' }}>
                {bankProfile.bankName.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#4B535C' }}>
                Dokumen simulasi portofolio • tidak mewakili institusi keuangan nyata
              </div>
            </div>
          </div>

          <div className="font-mono-code" style={{ textAlign: 'right', fontSize: '0.74rem', color: '#4B535C' }}>
            <div style={{ fontWeight: 700, color: '#111417' }}>
              CONTOH DOKUMEN DEMO
            </div>
            <div>No. Ref: {selectedApp.id}/MAK-CRV/XI/2026</div>
            <div>Tanggal Cetak: {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(new Date())}</div>
          </div>
        </div>

        {/* ====================================================================
            DOCUMENT 1: MEMORANDUM ANALISA KREDIT (MAK / CREDIT APPROVAL MEMO)
            ==================================================================== */}
        {docType === 'MAK_CREDIT_MEMO' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#2A6F5E' }}>
                DOKUMEN PUTUSAN UNDERWRITING &amp; KOMITE KREDIT
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem', color: '#111417' }}>
                MEMORANDUM ANALISA KREDIT &amp; PEMBIAYAAN (MAK)
              </h2>
            </div>

            {/* Section A: Borrower & Facility Structure */}
            <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.4rem', textTransform: 'uppercase', color: '#2A6F5E' }}>
              I. Identitas Pemohon &amp; Struktur Fasilitas Pembiayaan
            </div>
            <table className="swiss-table" style={{ border: '1px solid #CBD5E1', marginBottom: '1.25rem' }}>
              <tbody>
                <tr>
                  <td style={{ width: '25%', fontWeight: 600, backgroundColor: '#F8FAFC' }}>Nama Badan Usaha</td>
                  <td style={{ width: '25%', fontWeight: 700 }}>{selectedApp.applicantName}</td>
                  <td style={{ width: '25%', fontWeight: 600, backgroundColor: '#F8FAFC' }}>Jumlah pengajuan</td>
                  <td className="num-financial" style={{ width: '25%', fontWeight: 800 }}>{formatIDR(selectedApp.requestedAmount)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Penanggung Jawab</td>
                  <td>{selectedApp.ownerName}</td>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Skema Akad &amp; Tenor</td>
                  <td className="num-financial">{selectedApp.scheme.replace(/_/g, ' ')} ({selectedApp.tenorMonths} Bulan)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>NPWP / NIK &amp; Sektor</td>
                  <td>{selectedApp.npwpNik} • {selectedApp.businessSector}</td>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Margin / Bunga &amp; Cicilan</td>
                  <td className="num-financial">
                    {evaluation.calculationLimitations.length
                      ? `Nisbah demo ${selectedApp.nisbahBorrowerPct}% : ${100 - selectedApp.nisbahBorrowerPct}%; proyeksi hasil belum dimodelkan`
                      : `Asumsi demo ${selectedApp.annualRateOrMarginPct}% p.a. (${formatIDR(evaluation.proposedMonthlyInstallment)}/bln)`}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Sumber Pendanaan</td>
                  <td className="num-financial" colSpan={3}>
                    Kas Internal Bank: <strong>{formatIDR(bankPortion)}</strong> (Batas BMPK: {formatIDR(bankHealth.bmpkMaxSingleBorrower)}) • Co-Funding Sindikasi P2P: <strong>{formatIDR(p2pFunded)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Section B: Quantitative ML Scoring & Cashflow Ratios */}
            <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.4rem', textTransform: 'uppercase', color: '#2A6F5E' }}>
              II. Hasil Aturan Pra-Screening Demo &amp; Rasio Arus Kas Ilustratif
            </div>
            <table className="swiss-table" style={{ border: '1px solid #CBD5E1', marginBottom: '1.25rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9' }}>
                  <th>Skor demo</th>
                  <th>Rating Grade</th>
                  <th>Sinyal risiko demo</th>
                  <th>Proxy kerugian agunan demo</th>
                  <th>Proxy kerugian (bukan CKPN/ECL)</th>
                  <th>Rasio DSCR</th>
                  <th>Rasio DSR</th>
                  <th>Altman Z&apos;&apos;-Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="num-financial" style={{ fontWeight: 800, fontSize: '1rem' }}>{evaluation.creditScore} / 850</td>
                  <td style={{ fontWeight: 800 }}>{evaluation.ratingGrade}</td>
                  <td className="num-financial" style={{ fontWeight: 700 }}>{evaluation.riskSignalPct.toFixed(2)}%</td>
                  <td className="num-financial">{evaluation.lgdPct.toFixed(1)}%</td>
                  <td className="num-financial" style={{ fontWeight: 700 }}>{formatIDR(evaluation.indicativeLossProxyAmount)}</td>
                  <td className="num-financial" style={{ fontWeight: 800 }}>{evaluation.calculationLimitations.length ? '—' : `${evaluation.dscr.toFixed(2)}x`}</td>
                  <td className="num-financial">{evaluation.calculationLimitations.length ? '—' : `${evaluation.dsrPct.toFixed(1)}%`}</td>
                  <td className="num-financial">{evaluation.altmanZDoublePrime} ({evaluation.altmanZone})</td>
                </tr>
              </tbody>
            </table>

            {/* Section C: SHAP Feature Attribution Table */}
            <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.4rem', textTransform: 'uppercase', color: '#2A6F5E' }}>
              III. Faktor yang Digunakan oleh Aturan Skor Demo (bukan SHAP)
            </div>
            <table className="swiss-table" style={{ border: '1px solid #CBD5E1', marginBottom: '1.25rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9' }}>
                  <th>Variabel Penilaian Risiko</th>
                  <th>Nilai Aktual Debitur</th>
                  <th className="text-right">Dampak Log-Odds</th>
                  <th className="text-right">Kontribusi Poin Skor</th>
                  <th>Arah Risiko</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.riskFactorContributions.map((f) => (
                  <tr key={f.featureKey}>
                    <td style={{ fontWeight: 600 }}>{f.featureLabel}</td>
                    <td className="font-mono-code">{f.rawValueFormatted}</td>
                    <td className="text-right num-financial">{f.logOddsImpact > 0 ? `+${f.logOddsImpact}` : f.logOddsImpact}</td>
                    <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                      {f.pointsImpact > 0 ? `+${f.pointsImpact} pts` : `${f.pointsImpact} pts`}
                    </td>
                    <td>{f.direction === 'RISK_DECREASING' ? 'Menurunkan Risiko (Positif)' : 'Menaikkan Risiko (Negatif)'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Section D: Analyst Findings & Committee Recommendation */}
            <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.4rem', textTransform: 'uppercase', color: '#2A6F5E' }}>
              IV. Kesimpulan Forensik Rekening Koran, Rekomendasi Sistem &amp; Risalah Analis
            </div>
            <div
              style={{
                border: '1px solid #CBD5E1',
                padding: '0.9rem 1.1rem',
                borderRadius: '6px',
                backgroundColor: '#F8FAFC',
                marginBottom: '1.75rem',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ marginBottom: '0.4rem' }}>
                <strong>Rekomendasi Mesin Underwriting:</strong>{' '}
                <span style={{ fontWeight: 800, color: '#2A6F5E' }}>
                  {evaluation.ruleScreeningResult.replace(/_/g, ' ')}
                </span>{' '}
                • <strong>Plafon Maksimum Aman (DSCR ≥ 1.25x):</strong>{' '}
                <span className="num-financial">{formatIDR(evaluation.maxRecommendedPlafond)}</span>
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                <strong>Status Forensik Mutasi 6 Bulan:</strong> Rata-rata Inflow{' '}
                <span className="num-financial">{formatIDR(evaluation.mutationAvgInflow)}/bln</span> •{' '}
                {evaluation.anomalies.length === 0
                  ? '0 Anomali (Terekonsiliasi penuh dengan omzet)'
                  : evaluation.anomalies.map((a) => `${a.title} (${a.metricValue})`).join('; ')}
              </div>
              <div>
                <strong>Memo Analis &amp; Putusan:</strong> {selectedApp.analystNotes}
              </div>
            </div>

            {/* Official Signature Block */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.5rem',
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid #CBD5E1',
                textAlign: 'center',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Diusulkan Oleh (Underwriter)</div>
                <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2A6F5E', fontWeight: 700 }}>
                  [TERVERIFIKASI DIGITAL]
                </div>
                <div style={{ fontWeight: 700, textDecoration: 'underline' }}>R. Aditya Pratama, CFA</div>
                <div style={{ color: '#4B535C' }}>Lead Credit Analyst</div>
              </div>

              <div>
                <div style={{ fontWeight: 700 }}>Diperiksa Oleh (Risk &amp; Compliance)</div>
                <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2A6F5E', fontWeight: 700 }}>
                  [TERVERIFIKASI DIGITAL]
                </div>
                <div style={{ fontWeight: 700, textDecoration: 'underline' }}>Dra. Meutia Rahmawati, Ak.</div>
                <div style={{ color: '#4B535C' }}>Kepala Audit &amp; Risiko</div>
              </div>

              <div>
                <div style={{ fontWeight: 700 }}>Disetujui Oleh (Komite Kredit)</div>
                <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2A6F5E', fontWeight: 700 }}>
                  [STATUS: {selectedApp.status}]
                </div>
                <div style={{ fontWeight: 700, textDecoration: 'underline' }}>H. Prabowo Suryo, SE., MM.</div>
                <div style={{ color: '#4B535C' }}>Ketua Komite Kredit Eksekutif</div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            DOCUMENT 2: SP3K / OFFERING LETTER & AMORTIZATION SCHEDULE
            ==================================================================== */}
        {docType === 'SP3K_OFFERING' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#2A6F5E' }}>
                SURAT PENEGASAN PERSETUJUAN PENYEDIAAN KREDIT / PEMBIAYAAN (SP3K)
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem', color: '#111417' }}>
                LAMPIRAN KONTRAK AKAD &amp; JADWAL ANGSURAN DEBITUR
              </h2>
            </div>

            <p style={{ fontSize: '0.86rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              Kepada Yth. Pengurus <strong>{selectedApp.applicantName}</strong> ({selectedApp.ownerName}) di{' '}
              {selectedApp.region}. Berdasarkan hasil evaluasi kelayakan kredit dan sidang Komite
              Pembiayaan <strong>{bankProfile.bankName}</strong>, berikut adalah rincian fasilitas
              dan jadwal kewajiban angsuran bulanan Anda:
            </p>

            <table className="swiss-table" style={{ border: '1px solid #CBD5E1', marginBottom: '1.25rem' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Plafon Disetujui</td>
                  <td className="num-financial" style={{ fontWeight: 800 }}>{formatIDR(selectedApp.requestedAmount)}</td>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Skema Akad</td>
                  <td>{selectedApp.scheme.replace(/_/g, ' ')}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Tenor Jangka Waktu</td>
                  <td className="num-financial">{selectedApp.tenorMonths} Bulan</td>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Margin / Bunga Tahunan</td>
                  <td className="num-financial">{selectedApp.annualRateOrMarginPct}% p.a.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Agunan Dijaminkan</td>
                  <td>{selectedApp.collateralType.replace(/_/g, ' ')}</td>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Angsuran bulanan ilustratif</td>
                  <td className="num-financial" style={{ fontWeight: 800, color: '#2A6F5E' }}>
                    {evaluation.calculationLimitations.length ? 'Belum dimodelkan' : formatIDR(evaluation.proposedMonthlyInstallment)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.4rem', textTransform: 'uppercase', color: '#2A6F5E' }}>
              Tabel Jadwal Angsuran Bulanan (12 Bulan Pertama)
            </div>
            {schedule.length === 0 && (
              <div style={{ border: '1px solid #D97706', padding: '0.7rem', marginBottom: '0.7rem', color: '#92400E' }}>
                Jadwal bagi hasil belum dimodelkan. Dokumen ini hanya contoh demo, bukan penawaran pembiayaan.
              </div>
            )}
            <table className="swiss-table" style={{ border: '1px solid #CBD5E1', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9' }}>
                  <th className="text-center">Angsuran Ke-</th>
                  <th className="text-right">Saldo Pokok Awal</th>
                  <th className="text-right">Cicilan Pokok</th>
                  <th className="text-right">Porsi Margin / Bunga</th>
                  <th className="text-right">Total Kewajiban Bulanan</th>
                  <th className="text-right">Sisa Pokok Akhir</th>
                </tr>
              </thead>
              <tbody>
                {schedule.slice(0, 12).map((row) => (
                  <tr key={row.period}>
                    <td className="text-center font-mono-code">{row.period}</td>
                    <td className="text-right num-financial">{formatIDR(row.openingPrincipal)}</td>
                    <td className="text-right num-financial">{formatIDR(row.principalComponent)}</td>
                    <td className="text-right num-financial">{formatIDR(row.interestOrMarginComponent)}</td>
                    <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                      {formatIDR(row.totalInstallment)}
                    </td>
                    <td className="text-right num-financial">{formatIDR(row.closingPrincipal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                marginTop: '2rem',
                textAlign: 'center',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Pihak Bank / Pemberi Pembiayaan</div>
                <div style={{ height: '60px' }} />
                <div style={{ fontWeight: 700, textDecoration: 'underline' }}>H. Prabowo Suryo, SE., MM.</div>
                <div>Ketua Komite Pembiayaan</div>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Menyetujui, Pihak Debitur / Nasabah</div>
                <div style={{ height: '60px' }} />
                <div style={{ fontWeight: 700, textDecoration: 'underline' }}>{selectedApp.ownerName}</div>
                <div>Direksi / Pemilik {selectedApp.applicantName}</div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            DOCUMENT 3: RISALAH KOMITE KREDIT & ALCO TREASURY BOARD REPORT
            ==================================================================== */}
        {docType === 'ALCO_COMMITTEE_PACK' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#2A6F5E' }}>
                LAPORAN EKSEKUTIF DIREKSI, KOMITE KREDIT &amp; ALCO TREASURY
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem', color: '#111417' }}>
                RISALAH KESEHATAN NERACA BANK &amp; REKAPITULASI PUTUSAN PORTOFOLIO KREDIT
              </h2>
            </div>

            <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.4rem', textTransform: 'uppercase', color: '#2A6F5E' }}>
              I. Posisi Neraca &amp; Rasio Ilustratif (bukan laporan kepatuhan)
            </div>
            <table className="swiss-table" style={{ border: '1px solid #CBD5E1', marginBottom: '1.25rem' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Dana Pihak Ketiga (DPK)</td>
                  <td className="num-financial" style={{ fontWeight: 700 }}>{formatIDR(bankHealth.dpkDeposits)}</td>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Rasio FDR / LDR</td>
                  <td className="num-financial" style={{ fontWeight: 700 }}>{bankHealth.fdrLdrPct}% (ambang demo 92%)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Modal Inti (Tier-1 Capital)</td>
                  <td className="num-financial" style={{ fontWeight: 700 }}>{formatIDR(bankHealth.tier1Capital)}</td>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Rasio KPMM / CAR</td>
                  <td className="num-financial" style={{ fontWeight: 700 }}>{bankHealth.carKpmmPct}% (ambang demo 12%)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Kas Likuid Siap Salur</td>
                  <td className="num-financial" style={{ fontWeight: 800, color: '#2A6F5E' }}>{formatIDR(bankHealth.availableLiquidCash)}</td>
                  <td style={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Batas BMPK (1 Debitur)</td>
                  <td className="num-financial" style={{ fontWeight: 700 }}>{formatIDR(bankHealth.bmpkMaxSingleBorrower)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.4rem', textTransform: 'uppercase', color: '#2A6F5E' }}>
              II. Rekapitulasi Seluruh Berkas Pembiayaan dalam Portofolio ({allApplications.length} Debitur)
            </div>
            <table className="swiss-table" style={{ border: '1px solid #CBD5E1', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9' }}>
                  <th>No. Berkas</th>
                  <th>Nama Debitur</th>
                  <th>Skema Akad</th>
                  <th className="text-right">Jumlah pengajuan</th>
                  <th className="text-center">Skor / Grade</th>
                  <th className="text-right">Sinyal risiko demo</th>
                  <th className="text-right">Proxy kerugian ilustratif</th>
                  <th className="text-right">DSCR</th>
                  <th>Status Putusan</th>
                </tr>
              </thead>
              <tbody>
                {allApplications.map((app) => {
                  const ev = allEvaluations[app.id];
                  return (
                    <tr key={app.id}>
                      <td className="font-mono-code" style={{ fontWeight: 700 }}>{app.id}</td>
                      <td style={{ fontWeight: 600 }}>{app.applicantName}</td>
                      <td>{app.scheme.replace(/_/g, ' ')}</td>
                      <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                        {formatCompactIDR(app.requestedAmount)}
                      </td>
                      <td className="text-center num-financial">
                        {ev.creditScore} ({ev.ratingGrade})
                      </td>
                      <td className="text-right num-financial">{ev.riskSignalPct.toFixed(2)}%</td>
                      <td className="text-right num-financial">{formatCompactIDR(ev.indicativeLossProxyAmount)}</td>
                      <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                        {ev.calculationLimitations.length ? '—' : `${ev.dscr.toFixed(2)}x`}
                      </td>
                      <td style={{ fontWeight: 700 }}>{app.status.replace(/_/g, ' ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

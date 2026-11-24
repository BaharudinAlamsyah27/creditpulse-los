import React, { useMemo, useState } from 'react';
import {
  CollateralType,
  CreditUnderwritingEvaluation,
  FinancingScheme,
  LoanApplication,
  LoanPurpose,
} from '../types/credit';
import {
  evaluateLoanApplication,
  formatCompactIDR,
  formatIDR,
  generateAmortizationSchedule,
} from '../engine/creditEngine';
import {
  AmortizationStackedChart,
  CreditScoreGaugeChart,
} from './AdminCharts';
import { HelpTip } from './HelpTip';
import { RiskPolicyConfig } from '../types/credit';

interface BorrowerPortalProps {
  applications: LoanApplication[];
  evaluations: Record<string, CreditUnderwritingEvaluation>;
  riskPolicy: RiskPolicyConfig;
  onCreateApplication: (newApp: LoanApplication) => void;
  onSimulateOfferAcceptance: (appId: string) => void;
  onInspectInUnderwriter: (appId: string) => void;
}

export const BorrowerPortal: React.FC<BorrowerPortalProps> = ({
  applications,
  evaluations,
  riskPolicy,
  onCreateApplication,
  onSimulateOfferAcceptance,
  onInspectInUnderwriter,
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'simulator' | 'table' | 'tracker'>('simulator');

  const [applicantName, setApplicantName] = useState('PT Nusantara Pangan Sejahtera');
  const [ownerName, setOwnerName] = useState('Ir. Bagus Setiawan');
  const [npwpNik] = useState('08.291.774.3-412.000');
  const [businessSector, setBusinessSector] = useState('Pengolahan Pangan & Distribusi Retail');
  const [region, setRegion] = useState('Semarang, Jawa Tengah');
  const [yearsInBusiness, setYearsInBusiness] = useState(5);
  const [employeeCount] = useState(28);
  const [purpose, setPurpose] = useState<LoanPurpose>('MODAL_KERJA_UMKM');
  const [scheme, setScheme] = useState<FinancingScheme>('MURABAHAH_MARGIN');
  const [requestedAmount, setRequestedAmount] = useState(300_000_000);
  const [tenorMonths, setTenorMonths] = useState(24);
  const [annualRateOrMarginPct, setAnnualRateOrMarginPct] = useState(11.5);
  const [nisbahBorrowerPct] = useState(65);

  const [monthlyRevenue, setMonthlyRevenue] = useState(220_000_000);
  const [monthlyCogsAndOpex, setMonthlyCogsAndOpex] = useState(165_000_000);
  const [monthlyHouseholdExpense] = useState(10_000_000);
  const [existingMonthlyDebtService, setExistingMonthlyDebtService] = useState(5_500_000);

  const [collateralType, setCollateralType] = useState<CollateralType>('SHM_TANAH_BANGUNAN');
  const [collateralAppraisedValue, setCollateralAppraisedValue] = useState(520_000_000);

  const [submitBanner, setSubmitBanner] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Mudharabah / Musyarakah Profit-Sharing Interactive Simulation State
  const [profitShareProjectedRevenue, setProfitShareProjectedRevenue] = useState(monthlyRevenue);
  const [profitShareProjectedCogs, setProfitShareProjectedCogs] = useState(monthlyCogsAndOpex);
  const [profitShareNisbahBorrower, setProfitShareNisbahBorrower] = useState(nisbahBorrowerPct);

  const profitShareNetProfit = Math.max(0, profitShareProjectedRevenue - profitShareProjectedCogs);
  const profitShareNisbahInvestor = Math.max(0, 100 - profitShareNisbahBorrower);
  const profitShareInvestorMonthly = Math.round(profitShareNetProfit * (profitShareNisbahInvestor / 100));
  const profitShareBorrowerMonthly = Math.round(profitShareNetProfit * (profitShareNisbahBorrower / 100));
  const profitShareIndicativeAnnualReturnPct =
    requestedAmount > 0 ? ((profitShareInvestorMonthly * 12) / requestedAmount) * 100 : 0;

  const draftApplication: LoanApplication = useMemo(() => {
    const baseInflow = Math.max(10_000_000, monthlyRevenue);
    const baseOutflow = Math.max(5_000_000, monthlyCogsAndOpex + existingMonthlyDebtService);
    return {
      id: 'DRAFT-PREVIEW',
      submittedAt: 'Baru Saja',
      applicantName: applicantName.trim() || 'Debitur UMKM Baru',
      ownerName: ownerName.trim() || 'Pengurus Utama',
      npwpNik: npwpNik.trim() || '01.000.000.0-000.000',
      businessSector: businessSector.trim() || 'Perdagangan Umum',
      region: region.trim() || 'Indonesia',
      yearsInBusiness,
      employeeCount,
      purpose,
      scheme,
      requestedAmount,
      tenorMonths,
      annualRateOrMarginPct,
      nisbahBorrowerPct,
      monthlyRevenue,
      monthlyCogsAndOpex,
      monthlyHouseholdExpense,
      existingMonthlyDebtService,
      currentAssets: monthlyRevenue * 2.8,
      currentLiabilities: monthlyCogsAndOpex * 1.1,
      totalAssets: monthlyRevenue * 5.5 + collateralAppraisedValue,
      totalLiabilities: existingMonthlyDebtService * 24 + monthlyCogsAndOpex,
      retainedEarnings: monthlyRevenue * 1.8,
      collateralType,
      collateralAppraisedValue:
        collateralType === 'UNSECURED_CASHFLOW' ? 0 : collateralAppraisedValue,
      slikKol: 1,
      pastArrearsDaysMax: 0,
      status: 'SUBMITTED',
      analystNotes: 'Pengajuan baru dari Portal Debitur Digital (#4).',
      mutations: [
        {
          month: '2026-06',
          creditInflow: Math.round(baseInflow * 0.96),
          debitOutflow: Math.round(baseOutflow * 0.95),
          endingBalance: Math.round(baseInflow * 0.34),
          transactionCount: 88,
          roundNumberTxCount: 6,
          bouncedCheckCount: 0,
        },
        {
          month: '2026-07',
          creditInflow: Math.round(baseInflow * 0.99),
          debitOutflow: Math.round(baseOutflow * 0.97),
          endingBalance: Math.round(baseInflow * 0.36),
          transactionCount: 92,
          roundNumberTxCount: 7,
          bouncedCheckCount: 0,
        },
        {
          month: '2026-08',
          creditInflow: Math.round(baseInflow * 1.01),
          debitOutflow: Math.round(baseOutflow * 0.99),
          endingBalance: Math.round(baseInflow * 0.38),
          transactionCount: 95,
          roundNumberTxCount: 6,
          bouncedCheckCount: 0,
        },
        {
          month: '2026-09',
          creditInflow: Math.round(baseInflow * 0.98),
          debitOutflow: Math.round(baseOutflow * 0.96),
          endingBalance: Math.round(baseInflow * 0.39),
          transactionCount: 91,
          roundNumberTxCount: 5,
          bouncedCheckCount: 0,
        },
        {
          month: '2026-10',
          creditInflow: Math.round(baseInflow * 1.02),
          debitOutflow: Math.round(baseOutflow * 1.0),
          endingBalance: Math.round(baseInflow * 0.41),
          transactionCount: 97,
          roundNumberTxCount: 7,
          bouncedCheckCount: 0,
        },
        {
          month: '2026-11',
          creditInflow: Math.round(baseInflow * 1.04),
          debitOutflow: Math.round(baseOutflow * 1.01),
          endingBalance: Math.round(baseInflow * 0.43),
          transactionCount: 102,
          roundNumberTxCount: 8,
          bouncedCheckCount: 0,
        },
      ],
      documents: [
        {
          id: 'DOC-1',
          code: 'KYC-NIK-NPWP',
          label: 'e-KYC KTP Pengurus, NPWP & NIB (belum diverifikasi)',
          verified: false,
          notes: 'Dokumen contoh; belum ada unggahan atau pemeriksaan identitas.',
        },
        {
          id: 'DOC-2',
          code: 'SLIK-OJK',
          label: 'Persetujuan pengecekan biro kredit (simulasi)',
          verified: false,
          notes: 'Tidak ada tanda tangan digital atau koneksi ke SLIK.',
        },
        {
          id: 'DOC-3',
          code: 'BANK-STMT-6M',
          label: 'Data mutasi rekening contoh (6 bulan)',
          verified: false,
          notes: 'Angka sintetis untuk demo; belum ada dokumen yang diunggah atau diekstrak.',
        },
        {
          id: 'DOC-4',
          code: 'COLLATERAL-KJPP',
          label: 'Dokumen Kepemilikan Agunan (belum diverifikasi)',
          verified: false,
          notes:
            collateralType === 'UNSECURED_CASHFLOW'
              ? 'Tidak berlaku untuk skema tanpa agunan; tidak ada dokumen terlampir.'
              : 'Belum ada dokumen terlampir atau pemeriksaan agunan.',
        },
      ],
      p2pCommitments: [],
    };
  }, [
    applicantName,
    ownerName,
    npwpNik,
    businessSector,
    region,
    yearsInBusiness,
    employeeCount,
    purpose,
    scheme,
    requestedAmount,
    tenorMonths,
    annualRateOrMarginPct,
    nisbahBorrowerPct,
    monthlyRevenue,
    monthlyCogsAndOpex,
    monthlyHouseholdExpense,
    existingMonthlyDebtService,
    collateralType,
    collateralAppraisedValue,
  ]);

  const draftEval = useMemo(
    () => evaluateLoanApplication(draftApplication, riskPolicy),
    [draftApplication, riskPolicy]
  );

  const schedule = useMemo(
    () =>
      generateAmortizationSchedule(
        requestedAmount,
        tenorMonths,
        annualRateOrMarginPct,
        scheme
      ),
    [requestedAmount, tenorMonths, annualRateOrMarginPct, scheme]
  );

  const comparisonAnnuity = useMemo(
    () =>
      generateAmortizationSchedule(
        requestedAmount,
        tenorMonths,
        annualRateOrMarginPct,
        'ANUITAS_KONVENSIONAL'
      ),
    [requestedAmount, tenorMonths, annualRateOrMarginPct]
  );
  const comparisonMurabahah = useMemo(
    () =>
      generateAmortizationSchedule(
        requestedAmount,
        tenorMonths,
        annualRateOrMarginPct,
        'MURABAHAH_MARGIN'
      ),
    [requestedAmount, tenorMonths, annualRateOrMarginPct]
  );

  const totalAnnuityPayable = comparisonAnnuity.reduce(
    (s, r) => s + r.totalInstallment,
    0
  );
  const totalMurabahahPayable = comparisonMurabahah.reduce(
    (s, r) => s + r.totalInstallment,
    0
  );

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!applicantName.trim() || applicantName.trim().length < 3) {
      errors.push('Nama Badan Usaha / UMKM wajib diisi minimal 3 karakter.');
    }
    if (!ownerName.trim() || ownerName.trim().length < 3) {
      errors.push('Nama Pengurus / Penanggung Jawab wajib diisi.');
    }
    if (!businessSector.trim()) {
      errors.push('Sektor usaha wajib dipilih/diisi.');
    }
    if (!region.trim()) {
      errors.push('Wilayah operasional usaha wajib diisi.');
    }
    if (requestedAmount < 10_000_000) {
      errors.push('Jumlah plafon pengajuan minimal Rp 10.000.000.');
    }
    if (tenorMonths < 3) {
      errors.push('Tenor pembiayaan minimal 3 bulan.');
    }
    if (monthlyRevenue <= 0) {
      errors.push('Estimasi omzet bulanan harus lebih besar dari Rp 0.');
    }
    if (monthlyCogsAndOpex < 0) {
      errors.push('Beban operasional & HPP tidak boleh bernilai negatif.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setSubmitBanner(null);
      return;
    }

    setValidationErrors([]);
    const nextNum = 847 + applications.length;
    const newId = `LOS-2026-0${nextNum}`;
    const created: LoanApplication = {
      ...draftApplication,
      id: newId,
      submittedAt: new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'Asia/Jakarta',
      }).format(new Date()),
      status:
        scheme === 'MUDHARABAH_P2P' || scheme === 'MUSYARAKAH_P2P'
          ? 'P2P_FUNDING_OPEN'
          : 'UNDERWRITING_REVIEW',
    };
    onCreateApplication(created);
    setSubmitBanner(
      `Pengajuan ${newId} (${created.applicantName}) berhasil dikirim ke antrean Underwriting dengan Skor Pra-Screening ${draftEval.creditScore} (${draftEval.ratingGrade}).`
    );
  };

  const handleExportScheduleCsv = () => {
    const headers = [
      'Periode_Bulan',
      'Saldo_Pokok_Awal_IDR',
      'Cicilan_Pokok_IDR',
      'Bunga_Margin_IDR',
      'Total_Angsuran_IDR',
      'Saldo_Pokok_Akhir_IDR',
    ];
    const rows = schedule.map((r) =>
      [
        r.period,
        Math.round(r.openingPrincipal),
        Math.round(r.principalComponent),
        Math.round(r.interestOrMarginComponent),
        Math.round(r.totalInstallment),
        Math.round(r.closingPrincipal),
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jadwal_Angsuran_${scheme}_${requestedAmount}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="adminlte-content-header">
        <div>
          <span className="swiss-kicker">
            PORTAL DEBITUR &amp; PENGAJUAN PINJAMAN DIGITAL END-TO-END
          </span>
          <h1 style={{ fontSize: '1.55rem', marginTop: '0.2rem' }}>
            Origination Pembiayaan UMKM &amp; Visualisasi Jadwal Angsuran
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="adminlte-tabs">
            <button
              type="button"
              className={`adminlte-tab-btn ${activeViewTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('simulator')}
            >
              1. Form &amp; Grafik Simulasi
            </button>
            <button
              type="button"
              className={`adminlte-tab-btn ${activeViewTab === 'table' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('table')}
            >
              2. Tabel Rincian Angsuran ({schedule.length} Bln)
            </button>
            <button
              type="button"
              className={`adminlte-tab-btn ${activeViewTab === 'tracker' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('tracker')}
            >
              3. Pelacak Status Aplikasi ({applications.length})
            </button>
          </div>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleExportScheduleCsv}
          >
            Ekspor Jadwal (.CSV)
          </button>
        </div>
      </div>

      <div className="adminlte-content">
        {validationErrors.length > 0 && (
          <div
            role="alert"
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '6px',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              border: '1px solid var(--status-danger)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Mohon lengkapi dan periksa kembali data pengajuan:</span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setValidationErrors([])}
              >
                Tutup
              </button>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.84rem' }}>
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {submitBanner && (
          <div
            role="status"
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '4px',
              backgroundColor: 'var(--status-safe-bg)',
              color: 'var(--status-safe)',
              border: '1px solid var(--status-safe)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              fontWeight: 600,
            }}
          >
            <span>{submitBanner}</span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setSubmitBanner(null)}
            >
              Tutup
            </button>
          </div>
        )}

        {/* Top 4 Summary KPI Boxes for Borrower Simulation */}
        <section className="adminlte-kpi-grid">
          <div className="small-box">
            <div className="small-box-top-bar" style={{ backgroundColor: 'var(--accent-primary)' }} />
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial" style={{ color: 'var(--accent-primary)' }}>
                  {draftEval.calculationLimitations.length
                    ? 'Belum dimodelkan'
                    : formatIDR(draftEval.proposedMonthlyInstallment)}
                </div>
                <div className="small-box-label">Estimasi Angsuran / Bulan</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Tenor {tenorMonths} Bulan</span>
              <span>
                {scheme === 'MUDHARABAH_P2P' || scheme === 'MUSYARAKAH_P2P'
                  ? 'Bagi hasil belum dimodelkan'
                  : `${annualRateOrMarginPct}% p.a. (asumsi demo)`}
              </span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-top-bar" style={{ backgroundColor: 'var(--accent-info)' }} />
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial">
                  {draftEval.creditScore}{' '}
                  <span className="badge badge-info">{draftEval.ratingGrade}</span>
                </div>
                <div className="small-box-label">Skor Pra-Screening Aturan Demo</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Sinyal risiko demo: {draftEval.riskSignalPct.toFixed(2)}%</span>
              <span>{draftEval.ruleScreeningResult.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-top-bar" style={{ backgroundColor: 'var(--status-safe)' }} />
            <div className="small-box-inner">
              <div>
                <div
                  className="small-box-value num-financial"
                  style={{
                    color:
                      draftEval.dscr >= 1.25
                        ? 'var(--status-safe)'
                        : 'var(--status-danger)',
                  }}
                >
                  {draftEval.calculationLimitations.length ? '—' : `${draftEval.dscr.toFixed(2)}x`}
                </div>
                <div className="small-box-label">Kapasitas Bayar (DSCR)</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Beban utang/omzet: {draftEval.calculationLimitations.length ? '—' : `${draftEval.dsrPct.toFixed(1)}%`}</span>
              <span>Rasio indikatif demo</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-top-bar" style={{ backgroundColor: 'var(--accent-gold)' }} />
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial">
                  {formatCompactIDR(draftEval.maxRecommendedPlafond)}
                </div>
                <div className="small-box-label">Plafon Maksimum Direkomendasikan</div>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>LTV Agunan: {draftEval.ltvPct}%</span>
              <span>{formatIDR(draftEval.maxRecommendedPlafond)}</span>
            </div>
          </div>
        </section>

        {activeViewTab === 'simulator' && (
          <div className="row-2-col">
            {/* Left Card: Loan Origination Form */}
            <form onSubmit={handleSubmitForm} className="adminlte-card">
              <div className="adminlte-card-header">
                <div>
                  <div className="adminlte-card-title">
                    Formulir Pengajuan Pembiayaan Digital
                  </div>
                  <div className="adminlte-card-subtitle">
                    Ubah parameter plafon, skema akad, atau arus kas untuk melihat pembaruan grafik secara langsung
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-warn font-mono-code">DEMO LOKAL</span>
                  <HelpTip
                    title="Formulir Pengajuan & Simulator Debitur"
                    description="Formulir dan pra-screening dihitung di browser menggunakan aturan demo dan data sintetis. Pengajuan tersimpan hanya pada browser ini; tidak ada pemeriksaan biro kredit atau integrasi eksternal."
                    steps={[
                      'Isi identitas badan usaha, tujuan pembiayaan, dan pilih Skema Akad (Murabahah, Anuitas, atau P2P Bagi Hasil).',
                      'Masukkan plafon, tenor, serta data omzet dan biaya bulanan.',
                      'Perhatikan perubahan Skor Pra-Screening dan Grafik Angsuran di sebelah kanan.',
                      'Klik "Kirim Pengajuan Pembiayaan" untuk mendaftarkan berkas ke sistem.',
                    ]}
                  />
                </div>
              </div>

              <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="row-2-col" style={{ gap: '0.9rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="app-name">
                      Nama Badan Usaha / UMKM
                    </label>
                    <input
                      id="app-name"
                      type="text"
                      className="form-control"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="owner-name">
                      Penanggung Jawab / Direksi
                    </label>
                    <input
                      id="owner-name"
                      type="text"
                      className="form-control"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="sector">
                      Sektor Ekonomi Usaha
                    </label>
                    <input
                      id="sector"
                      type="text"
                      className="form-control"
                      value={businessSector}
                      onChange={(e) => setBusinessSector(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="region">
                      Kota / Wilayah Operasional
                    </label>
                    <input
                      id="region"
                      type="text"
                      className="form-control"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="purpose">
                      Tujuan Pembiayaan
                    </label>
                    <select
                      id="purpose"
                      className="form-control"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value as LoanPurpose)}
                    >
                      <option value="MODAL_KERJA_UMKM">Modal Kerja Operasional UMKM</option>
                      <option value="EKSPANSI_CAPEX">Investasi Alat / Ekspansi Capex</option>
                      <option value="INVOICE_FINANCING">Anjak Piutang / Invoice Financing</option>
                      <option value="MIKRO_PRODUKTIF">Pembiayaan Mikro Produktif</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="scheme">
                      Skema Akad Pembiayaan
                    </label>
                    <select
                      id="scheme"
                      className="form-control"
                      value={scheme}
                      onChange={(e) => setScheme(e.target.value as FinancingScheme)}
                    >
                      <option value="MURABAHAH_MARGIN">Syariah Murabahah (Margin Tetap)</option>
                      <option value="ANUITAS_KONVENSIONAL">Konvensional Anuitas (Efektif)</option>
                      <option value="MUDHARABAH_P2P">P2P Syariah Mudharabah (Bagi Hasil)</option>
                      <option value="MUSYARAKAH_P2P">P2P Syariah Musyarakah (Sindikasi)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="amount">
                      Plafon Pinjaman Diajukan (IDR)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step={10_000_000}
                      min={25_000_000}
                      className="form-control num-financial"
                      value={requestedAmount}
                      onChange={(e) =>
                        setRequestedAmount(Math.max(10_000_000, Number(e.target.value) || 0))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="tenor">
                      Tenor Pinjaman (Bulan)
                    </label>
                    <select
                      id="tenor"
                      className="form-control num-financial"
                      value={tenorMonths}
                      onChange={(e) => setTenorMonths(Number(e.target.value))}
                    >
                      <option value={6}>6 Bulan</option>
                      <option value={12}>12 Bulan (1 Tahun)</option>
                      <option value={18}>18 Bulan (1.5 Tahun)</option>
                      <option value={24}>24 Bulan (2 Tahun)</option>
                      <option value={36}>36 Bulan (3 Tahun)</option>
                      <option value={48}>48 Bulan (4 Tahun)</option>
                    </select>
                  </div>

                  {scheme === 'MUDHARABAH_P2P' || scheme === 'MUSYARAKAH_P2P' ? (
                    <div className="form-group">
                      <span className="form-label">Bagi hasil investor</span>
                      <div className="form-control" style={{ minHeight: 'auto' }}>
                        Nisbah demo: pemohon {nisbahBorrowerPct}% • investor {100 - nisbahBorrowerPct}%.
                        Proyeksi hasil belum dimodelkan.
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label" htmlFor="rate">
                        Margin / Bunga Tahunan Demo (% p.a.)
                      </label>
                      <input
                        id="rate"
                        type="number"
                        step={0.25}
                        min={4}
                        max={30}
                        className="form-control num-financial"
                        value={annualRateOrMarginPct}
                        onChange={(e) =>
                          setAnnualRateOrMarginPct(Math.max(1, Number(e.target.value) || 10))
                        }
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="vintage">
                      Usia Operasional Usaha (Tahun)
                    </label>
                    <input
                      id="vintage"
                      type="number"
                      min={1}
                      max={50}
                      className="form-control num-financial"
                      value={yearsInBusiness}
                      onChange={(e) => setYearsInBusiness(Number(e.target.value) || 1)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="rev">
                      Omzet Penjualan / Bulan (IDR)
                    </label>
                    <input
                      id="rev"
                      type="number"
                      step={5_000_000}
                      className="form-control num-financial"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="cogs">
                      HPP &amp; Biaya Operasional / Bulan (IDR)
                    </label>
                    <input
                      id="cogs"
                      type="number"
                      step={5_000_000}
                      className="form-control num-financial"
                      value={monthlyCogsAndOpex}
                      onChange={(e) => setMonthlyCogsAndOpex(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="existing-debt">
                      Cicilan Pinjaman Eksisting / Bulan (IDR)
                    </label>
                    <input
                      id="existing-debt"
                      type="number"
                      step={500_000}
                      className="form-control num-financial"
                      value={existingMonthlyDebtService}
                      onChange={(e) => setExistingMonthlyDebtService(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="col-type">
                      Jenis Agunan Utama
                    </label>
                    <select
                      id="col-type"
                      className="form-control"
                      value={collateralType}
                      onChange={(e) => setCollateralType(e.target.value as CollateralType)}
                    >
                      <option value="SHM_TANAH_BANGUNAN">SHM Tanah &amp; Bangunan (Haircut 25%)</option>
                      <option value="BPKB_KENDARAAN_NIAGA">BPKB Armada / Mesin (Haircut 45%)</option>
                      <option value="INVENTORY_RECEIVABLE">Persediaan / Piutang (Haircut 55%)</option>
                      <option value="DEPOSITO_BACKED">Deposito Dijaminkan (Haircut 5%)</option>
                      <option value="UNSECURED_CASHFLOW">Tanpa Agunan Fisik (Clean Loan)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="col-val">
                      Nilai Taksasi Agunan (IDR)
                    </label>
                    <input
                      id="col-val"
                      type="number"
                      step={10_000_000}
                      disabled={collateralType === 'UNSECURED_CASHFLOW'}
                      className="form-control num-financial"
                      value={collateralType === 'UNSECURED_CASHFLOW' ? 0 : collateralAppraisedValue}
                      onChange={(e) => setCollateralAppraisedValue(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="adminlte-card-footer">
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Disimpan di browser demo; tidak ada integrasi eksternal.
                </span>
                <button type="submit" className="btn btn-primary">
                  Kirim Pengajuan Pembiayaan →
                </button>
              </div>
            </form>

            {/* Right Column: Visual Charts (Speedometer + Stacked Amortization Bar Chart + Scheme Comparison) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div className="adminlte-card card-success">
                <div className="adminlte-card-header">
                  <div>
                    <div className="adminlte-card-title">
                      Grafik Pra-Screening Skor Demo &amp; Komparasi Skema Akad
                    </div>
                    <div className="adminlte-card-subtitle">
                      Simulasi kelayakan instan sebelum pengajuan dikirim ke analis kredit
                    </div>
                  </div>
                  <HelpTip
                    title="Pra-Screening Aturan Demo & Komparasi Akad"
                    description="Menampilkan estimasi skor kredit (300–850) dan membandingkan beban angsuran antara skema Konvensional Anuitas (bunga efektif) dengan Syariah Murabahah (margin jual-beli tetap)."
                    formula="Anuitas: A = P * [r(1+r)^n] / [(1+r)^n - 1] | Murabahah: (P + Margin) / n"
                  />
                </div>
                <div className="adminlte-card-body">
                  <div className="row-2-col" style={{ alignItems: 'center' }}>
                    <CreditScoreGaugeChart
                      score={draftEval.creditScore}
                      grade={draftEval.ratingGrade}
                      riskSignalPct={draftEval.riskSignalPct}
                      dscr={draftEval.calculationLimitations.length ? null : draftEval.dscr}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div
                        style={{
                          padding: '0.85rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-card)',
                          backgroundColor:
                            scheme === 'ANUITAS_KONVENSIONAL'
                              ? 'var(--accent-primary-soft)'
                              : 'var(--bg-elevated)',
                        }}
                      >
                        <div className="swiss-kicker">SKEMA ANUITAS KONVENSIONAL</div>
                        <div className="num-financial" style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '0.2rem' }}>
                          {formatIDR(comparisonAnnuity[0]?.totalInstallment ?? 0)} / bln
                        </div>
                        <div className="num-financial" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          Total Bunga: {formatIDR(totalAnnuityPayable - requestedAmount)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '0.85rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-card)',
                          backgroundColor:
                            scheme !== 'ANUITAS_KONVENSIONAL'
                              ? 'var(--accent-primary-soft)'
                              : 'var(--bg-elevated)',
                        }}
                      >
                        <div className="swiss-kicker">SKEMA SYARIAH MURABAHAH (FLAT)</div>
                        <div className="num-financial" style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '0.2rem' }}>
                          {formatIDR(comparisonMurabahah[0]?.totalInstallment ?? 0)} / bln
                        </div>
                        <div className="num-financial" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          Total Margin: {formatIDR(totalMurabahahPayable - requestedAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="adminlte-card card-info">
                <div className="adminlte-card-header">
                  <div>
                    <div className="adminlte-card-title">
                      Grafik Komposisi Angsuran Pokok vs Margin/Bunga per Bulan
                    </div>
                    <div className="adminlte-card-subtitle">
                      Visualisasi proporsi pembayaran pokok dan margin untuk skema {scheme.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setActiveViewTab('table')}
                    >
                      Lihat Tabel Angka →
                    </button>
                    <HelpTip
                      title="Grafik Komposisi Amortisasi Angsuran"
                      description="Batang hijau menunjukkan porsi pelunasan pokok pinjaman, sedangkan batang kuning emas menunjukkan porsi bunga/margin pada setiap bulan."
                      steps={[
                        'Pada skema Anuitas, porsi bunga lebih besar di awal bulan dan mengecil di akhir tenor.',
                        'Pada skema Syariah Murabahah, porsi pokok dan margin tetap sama (flat) sepanjang tenor.',
                      ]}
                    />
                  </div>
                </div>
                <div className="adminlte-card-body">
                  {schedule.length > 0 ? (
                    <AmortizationStackedChart schedule={schedule} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                      <div
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-card)',
                        }}
                      >
                        <span className="swiss-kicker" style={{ color: 'var(--accent-primary)' }}>
                          SIMULASI PROYEKSI BAGI HASIL BERBASIS LABA USAHA RIIL
                        </span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Akad {scheme.replace(/_/g, ' ')} tidak menggunakan bunga atau margin cicilan tetap. Pembagian didasarkan pada realisasi laba bersih usaha (prinsip bagi untung dan bagi rugi).
                        </div>
                      </div>

                      <div className="row-2-col" style={{ gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>
                            Proyeksi Omzet Bulanan (IDR)
                          </label>
                          <input
                            type="number"
                            step={5_000_000}
                            className="form-control num-financial"
                            value={profitShareProjectedRevenue}
                            onChange={(e) =>
                              setProfitShareProjectedRevenue(Math.max(0, Number(e.target.value) || 0))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>
                            Beban Pokok &amp; Opex (IDR)
                          </label>
                          <input
                            type="number"
                            step={5_000_000}
                            className="form-control num-financial"
                            value={profitShareProjectedCogs}
                            onChange={(e) =>
                              setProfitShareProjectedCogs(Math.max(0, Number(e.target.value) || 0))
                            }
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                          <span>Nisbah Nasabah: <strong>{profitShareNisbahBorrower}%</strong></span>
                          <span>Nisbah Investor: <strong>{profitShareNisbahInvestor}%</strong></span>
                        </div>
                        <input
                          type="range"
                          min={30}
                          max={90}
                          step={5}
                          value={profitShareNisbahBorrower}
                          onChange={(e) => setProfitShareNisbahBorrower(Number(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                        />
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.65rem',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          backgroundColor: 'var(--accent-primary-soft)',
                          border: '1px solid var(--accent-primary)',
                        }}
                      >
                        <div>
                          <div className="swiss-kicker">PROYEKSI BAGI HASIL INVESTOR</div>
                          <div className="num-financial" style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                            {formatIDR(profitShareInvestorMonthly)} / bln
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            Setara {profitShareIndicativeAnnualReturnPct.toFixed(1)}% p.a. (indikatif)
                          </div>
                        </div>

                        <div>
                          <div className="swiss-kicker">PROYEKSI NASABAH (PENGELOLA)</div>
                          <div className="num-financial" style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                            {formatIDR(profitShareBorrowerMonthly)} / bln
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            Dari Laba Bersih {formatIDR(profitShareNetProfit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeViewTab === 'table' && (
          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  {scheme === 'MUDHARABAH_P2P' || scheme === 'MUSYARAKAH_P2P'
                    ? `Matriks Proyeksi Bagi Hasil Usaha (${scheme.replace(/_/g, ' ')})`
                    : `Tabel Jadwal Angsuran Lengkap (${scheme.replace(/_/g, ' ')} — ${tenorMonths} Bulan)`}
                </div>
                <div className="adminlte-card-subtitle">
                  {scheme === 'MUDHARABAH_P2P' || scheme === 'MUSYARAKAH_P2P'
                    ? `Simulasi pembagian laba riil berdasarkan nisbah ${profitShareNisbahBorrower}% Nasabah : ${profitShareNisbahInvestor}% Pemodal`
                    : `Plafon ${formatIDR(requestedAmount)} dengan Margin/Bunga ${annualRateOrMarginPct}% p.a.`}
                </div>
              </div>
              {schedule.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleExportScheduleCsv}
                >
                  Unduh CSV Jadwal Angsuran
                </button>
              )}
            </div>

            {scheme === 'MUDHARABAH_P2P' || scheme === 'MUSYARAKAH_P2P' ? (
              <div className="table-wrap">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>Skenario Kinerja Usaha</th>
                      <th className="text-right">Proyeksi Laba Bersih / Bln</th>
                      <th className="text-right">Bagi Hasil Nasabah ({profitShareNisbahBorrower}%)</th>
                      <th className="text-right">Bagi Hasil Investor ({profitShareNisbahInvestor}%)</th>
                      <th className="text-center">Equivalent Return p.a.</th>
                      <th>Keterangan Prinsip Syariah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--status-safe)' }}>
                        Optimis (+20% Kenaikan Omzet)
                      </td>
                      <td className="text-right num-financial">
                        {formatIDR(Math.round(profitShareNetProfit * 1.2))}
                      </td>
                      <td className="text-right num-financial">
                        {formatIDR(Math.round(profitShareBorrowerMonthly * 1.2))}
                      </td>
                      <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                        {formatIDR(Math.round(profitShareInvestorMonthly * 1.2))}
                      </td>
                      <td className="text-center num-financial">
                        {(profitShareIndicativeAnnualReturnPct * 1.2).toFixed(1)}%
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Imbal hasil pemodal meningkat proporsional saat usaha menghasilkan laba lebih tinggi.
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                      <td style={{ fontWeight: 700 }}>
                        Realistis / Target Normal (Base)
                      </td>
                      <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                        {formatIDR(profitShareNetProfit)}
                      </td>
                      <td className="text-right num-financial">
                        {formatIDR(profitShareBorrowerMonthly)}
                      </td>
                      <td className="text-right num-financial" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {formatIDR(profitShareInvestorMonthly)}
                      </td>
                      <td className="text-center num-financial" style={{ fontWeight: 700 }}>
                        {profitShareIndicativeAnnualReturnPct.toFixed(1)}%
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Sesuai proyeksi Rencana Anggaran Biaya (RAB) dan kinerja historis UMKM.
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--status-warn)' }}>
                        Pelemahan (-20% Penurunan Omzet)
                      </td>
                      <td className="text-right num-financial">
                        {formatIDR(Math.round(profitShareNetProfit * 0.8))}
                      </td>
                      <td className="text-right num-financial">
                        {formatIDR(Math.round(profitShareBorrowerMonthly * 0.8))}
                      </td>
                      <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                        {formatIDR(Math.round(profitShareInvestorMonthly * 0.8))}
                      </td>
                      <td className="text-center num-financial">
                        {(profitShareIndicativeAnnualReturnPct * 0.8).toFixed(1)}%
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Beban nasabah berkurang karena setoran bagi hasil turun mengikuti laba riil.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th className="text-center">Bulan Ke-</th>
                      <th className="text-right">Saldo Pokok Awal</th>
                      <th className="text-right">Cicilan Pokok</th>
                      <th className="text-right">Porsi Margin / Bunga</th>
                      <th className="text-right">Total Angsuran</th>
                      <th className="text-right">Sisa Pokok Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
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
              </div>
            )}
          </div>
        )}

        {activeViewTab === 'tracker' && (
          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  Pelacak Status Pengajuan Pembiayaan Demo
                </div>
                <div className="adminlte-card-subtitle">
                  Pantau perubahan status lokal dari pengajuan hingga simulasi penerimaan penawaran dan pencatatan pencairan.
                </div>
              </div>
            </div>
            <div className="table-wrap">
              <table className="swiss-table">
                <thead>
                  <tr>
                    <th>No. Registrasi</th>
                    <th>Waktu Pengajuan</th>
                    <th>Nama Debitur / UMKM</th>
                    <th>Skema Akad</th>
                    <th className="text-right">Plafon</th>
                    <th className="text-right">Angsuran / Bln</th>
                    <th className="text-center">Status demo</th>
                    <th className="text-center">Skor demo</th>
                    <th className="text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const ev = evaluations[app.id];
                    const isP2PScheme = app.scheme === 'MUDHARABAH_P2P' || app.scheme === 'MUSYARAKAH_P2P';
                    const p2pCommitted = app.p2pCommitments.reduce((sum, item) => sum + item.committedAmount, 0);
                    const canAcceptOffer = !isP2PScheme || p2pCommitted >= app.requestedAmount;
                    return (
                      <tr key={app.id}>
                        <td className="font-mono-code" style={{ fontWeight: 700 }}>
                          {app.id}
                        </td>
                        <td className="font-mono-code" style={{ fontSize: '0.78rem' }}>
                          {app.submittedAt}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{app.applicantName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {app.ownerName} • {app.region}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral font-mono-code">
                            {app.scheme.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                          {formatIDR(app.requestedAmount)}
                        </td>
                        <td className="text-right num-financial">
                          {ev.calculationLimitations.length ? 'Belum dimodelkan' : formatIDR(ev.proposedMonthlyInstallment)}
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
                          {app.status === 'APPROVED_PENDING_ACCEPTANCE' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              style={{ display: 'block', margin: '0.35rem auto 0' }}
                              disabled={!canAcceptOffer}
                              onClick={() => onSimulateOfferAcceptance(app.id)}
                            >
                              {canAcceptOffer ? 'Simulasikan penerimaan penawaran' : 'Menunggu komitmen investor penuh'}
                            </button>
                          )}
                        </td>
                        <td className="text-center num-financial">
                          <strong>{ev.creditScore}</strong> ({ev.ratingGrade})
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => onInspectInUnderwriter(app.id)}
                          >
                            Buka di Underwriter →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

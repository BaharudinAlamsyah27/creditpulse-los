import React, { useMemo, useState } from 'react';
import {
  BankHealthMetrics,
  CreditUnderwritingEvaluation,
  InternalBankProfile,
  LoanApplication,
} from '../types/credit';
import {
  computeInternalBankHealth,
  formatCompactIDR,
  formatIDR,
} from '../engine/creditEngine';
import { HelpTip } from './HelpTip';

interface BankTreasuryPortalProps {
  applications: LoanApplication[];
  evaluations: Record<string, CreditUnderwritingEvaluation>;
  bankProfile: InternalBankProfile;
  bankHealth: BankHealthMetrics;
  onUpdateBankProfile: (nextBank: InternalBankProfile) => void;
  onSimulateDisbursement: (appId: string) => void;
  onInspectInUnderwriter: (appId: string) => void;
}

export const BankTreasuryPortal: React.FC<BankTreasuryPortalProps> = ({
  applications,
  evaluations,
  bankProfile,
  bankHealth,
  onUpdateBankProfile,
  onSimulateDisbursement,
  onInspectInUnderwriter,
}) => {
  const bankApplications = useMemo(
    () => applications.filter(
      (app) => app.scheme === 'ANUITAS_KONVENSIONAL' || app.scheme === 'MURABAHAH_MARGIN'
    ),
    [applications]
  );

  // 1. DPK Composition State (Giro, Tabungan, Deposito Berjangka)
  const [giroSharePct, setGiroSharePct] = useState(22); // CoF ~2.0%
  const [tabunganSharePct, setTabunganSharePct] = useState(36); // CoF ~3.25%
  const depositoSharePct = Math.max(0, 100 - giroSharePct - tabunganSharePct); // CoF ~6.0%

  // 2. SBDK (Suku Bunga Dasar Kredit / Base Lending Rate) Components
  const [overheadOpxPct, setOverheadOpxPct] = useState(2.85);
  const [targetProfitMarginPct, setTargetProfitMarginPct] = useState(2.5);
  const gwmReservePct = 7.5; // Parameter likuiditas ilustratif demo

  // 3. Liquidity & Deposit Run Stress Test Sliders
  const [depositRunWithdrawalPct, setDepositRunWithdrawalPct] = useState(0);
  const [nplShockAddPct, setNplShockAddPct] = useState(0);

  // Compute CASA & Weighted Cost of Fund (CoF)
  const casaRatioPct = giroSharePct + tabunganSharePct;
  const rawCostOfFundPct =
    (giroSharePct * 2.0 + tabunganSharePct * 3.25 + depositoSharePct * 6.0) /
    100;
  // Effective Cost of Loanable Funds after GWM Reserve
  const effectiveColfPct = Number(
    (rawCostOfFundPct / (1 - gwmReservePct / 100)).toFixed(2)
  );

  // Indicative risk premium from the demo loss proxy
  const totalRequested = Math.max(
    1,
    bankApplications.reduce((s, a) => s + a.requestedAmount, 0)
  );
  const totalEcl = bankApplications.reduce(
    (s, a) => s + (evaluations[a.id]?.indicativeLossProxyAmount ?? 0),
    0
  );
  const portfolioRiskPremiumPct = Number(
    Math.min(4.5, (totalEcl / totalRequested) * 100 * 0.45).toFixed(2)
  );

  // SBDK / Base Lending Rate recommendation
  const recommendedSbdkPct = Number(
    (
      effectiveColfPct +
      overheadOpxPct +
      portfolioRiskPremiumPct +
      targetProfitMarginPct
    ).toFixed(2)
  );

  // Compute Stressed Bank Health (when Depositors withdraw DPK or NPL spikes)
  const stressedBankProfile: InternalBankProfile = useMemo(() => {
    const remainingDpk = Math.round(
      bankProfile.dpkDeposits * (1 - depositRunWithdrawalPct / 100)
    );
    const extraNpl = Math.round(
      bankHealth.totalActiveFinancing * (nplShockAddPct / 100)
    );
    return {
      ...bankProfile,
      dpkDeposits: remainingDpk,
      existingNplAmount: bankProfile.existingNplAmount + extraNpl,
      tier1Capital: Math.max(
        500_000_000,
        bankProfile.tier1Capital - Math.round(extraNpl * 0.65)
      ),
    };
  }, [bankProfile, bankHealth.totalActiveFinancing, depositRunWithdrawalPct, nplShockAddPct]);

  const stressedHealth = useMemo(
    () =>
      computeInternalBankHealth(
        stressedBankProfile,
        bankApplications,
        evaluations,
        0
      ),
    [stressedBankProfile, bankApplications, evaluations]
  );

  // 4. Sectoral Concentration Limit & Exposure Analysis
  const sectorLimits = useMemo(() => {
    const definitions = [
      {
        sectorKey: 'Agribisnis',
        label: 'Agribisnis & Komoditas Ekspor',
        limitQuota: 1_200_000_000,
      },
      {
        sectorKey: 'Rantai Dingin',
        label: 'Logistik & Rantai Dingin (Cold Chain)',
        limitQuota: 1_100_000_000,
      },
      {
        sectorKey: 'Klinik',
        label: 'Kesehatan, Klinik & Alat Medis',
        limitQuota: 1_300_000_000,
      },
      {
        sectorKey: 'Konveksi',
        label: 'Manufaktur Tekstil & Pakaian Jadi',
        limitQuota: 600_000_000,
      },
      {
        sectorKey: 'Subkontraktor',
        label: 'Konstruksi Sipil & Fabrikasi Baja',
        limitQuota: 450_000_000,
      },
      {
        sectorKey: 'Perdagangan',
        label: 'Perdagangan Rempah & Pangan UMKM',
        limitQuota: 900_000_000,
      },
    ];

    return definitions.map((def) => {
      const matchedApps = bankApplications.filter(
        (a) =>
          a.status !== 'REJECTED' &&
          a.businessSector.toLowerCase().includes(def.sectorKey.toLowerCase())
      );
      const totalExposure = matchedApps.reduce(
        (s, a) => s + a.requestedAmount,
        0
      );
      const utilizationPct = Math.round(
        (totalExposure / Math.max(1, def.limitQuota)) * 100
      );

      return {
        ...def,
        appCount: matchedApps.length,
        totalExposure,
        utilizationPct,
      };
    });
  }, [bankApplications]);

  // 5. Illustrative bank health indicators; not regulatory calculations
  const regulatoryIndicators = [
    {
      code: 'CAR / KPMM',
      name: 'Kewajiban Penyediaan Modal Minimum',
      actualValue: `${stressedHealth.carKpmmPct.toFixed(2)}%`,
      ojkThreshold: 'Ilustrasi ≥ 12.00%',
      status:
        stressedHealth.carKpmmPct >= 14
          ? ('SEHAT' as const)
          : stressedHealth.carKpmmPct >= 12
            ? ('WASPADA' as const)
            : ('MELANGGAR' as const),
      detail: 'Modal Inti dibagi Aset Tertimbang Menurut Risiko (ATMR)',
    },
    {
      code: 'FDR / LDR',
      name: 'Financing / Loan to Deposit Ratio',
      actualValue: `${stressedHealth.fdrLdrPct.toFixed(2)}%`,
      ojkThreshold: 'Ilustrasi 78%–92%',
      status:
        stressedHealth.fdrLdrPct <= 92
          ? ('SEHAT' as const)
          : stressedHealth.fdrLdrPct <= 98
            ? ('WASPADA' as const)
            : ('MELANGGAR' as const),
      detail: 'Rasio total kredit yang disalurkan terhadap Dana Pihak Ketiga (DPK)',
    },
    {
      code: 'NPL / NPF GROSS',
      name: 'Rasio Pembiayaan Bermasalah Gross',
      actualValue: `${stressedHealth.nplGrossPct.toFixed(2)}%`,
      ojkThreshold: 'Ilustrasi ≤ 5.00%',
      status:
        stressedHealth.nplGrossPct <= 3.5
          ? ('SEHAT' as const)
          : stressedHealth.nplGrossPct <= 5.0
            ? ('WASPADA' as const)
            : ('MELANGGAR' as const),
      detail: 'Eksposur kredit Kolektibilitas 3, 4, dan 5 terhadap total pembiayaan',
    },
    {
      code: 'GWM LIKUIDITAS',
      name: 'Giro Wajib Minimum & Cadangan Primer',
      actualValue: `${gwmReservePct.toFixed(2)}%`,
      ojkThreshold: 'Ilustrasi ≥ 7.00%',
      status: 'SEHAT' as const,
      detail: 'Cadangan likuiditas wajib di Bank Sentral terhadap DPK',
    },
    {
      code: 'BOPO EFISIENSI',
      name: 'Biaya Operasional thd Pendapatan Operasional',
      actualValue: `${stressedHealth.bopoPct.toFixed(1)}%`,
      ojkThreshold: 'Ilustrasi ≤ 85.00%',
      status:
        stressedHealth.bopoPct <= 82
          ? ('SEHAT' as const)
          : ('WASPADA' as const),
      detail: 'Mengukur efisiensi biaya operasional dan biaya dana bank',
    },
    {
      code: 'BMPK KONSENTRASI',
      name: 'Batas Maksimum Pemberian Kredit (1 Debitur)',
      actualValue: formatCompactIDR(stressedHealth.bmpkMaxSingleBorrower),
      ojkThreshold: 'Ilustrasi ≤ 20% modal inti',
      status: 'SEHAT' as const,
      detail: 'Plafon di atas BMPK wajib di-co-funding lewat Sindikasi P2P',
    },
  ];

  // Simplified Bank Income Statement (Annualized)
  const annualInterestIncome = Math.round(
    stressedHealth.totalActiveFinancing * (recommendedSbdkPct / 100)
  );
  const annualInterestExpense = Math.round(
    stressedHealth.dpkDeposits * (rawCostOfFundPct / 100)
  );
  const netInterestIncome = annualInterestIncome - annualInterestExpense;
  const annualOperatingExpense = Math.round(
    stressedHealth.totalActiveFinancing * (overheadOpxPct / 100)
  );
  const annualPreProvisionProfit = netInterestIncome - annualOperatingExpense;
  const netBankProfitAfterProvision = Math.round(
    annualPreProvisionProfit - totalEcl * 0.35
  );

  // Donut Chart geometry for DPK CASA vs Time Deposit
  const cx = 80;
  const cy = 80;
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dpkSlices = [
    {
      label: 'Giro Korporasi (2.0% p.a.)',
      pct: giroSharePct,
      color: 'var(--accent-primary)',
    },
    {
      label: 'Tabungan Ritel (3.25% p.a.)',
      pct: tabunganSharePct,
      color: 'var(--accent-info)',
    },
    {
      label: 'Deposito Berjangka (6.0% p.a.)',
      pct: depositoSharePct,
      color: 'var(--accent-gold)',
    },
  ];
  let cum = 0;

  return (
    <>
      <div className="adminlte-content-header">
        <div>
          <span className="swiss-kicker">
            TREASURY DEMO • PROFIL BANK FIKTIF // {bankHealth.bankName}
          </span>
          <h1 style={{ fontSize: '1.6rem', marginTop: '0.2rem' }}>
            Likuiditas Simulasi, Kalkulator Harga Demo, Kuota Sektor &amp; Uji Stres
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() =>
              onUpdateBankProfile({
                ...bankProfile,
                dpkDeposits: bankProfile.dpkDeposits + 1_500_000_000,
              })
            }
          >
            + Injeksi Likuiditas DPK Rp 1,5 M
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setDepositRunWithdrawalPct(0);
              setNplShockAddPct(0);
            }}
          >
            Reset Simulasi Stres
          </button>
        </div>
      </div>

      <div className="adminlte-content">
        <div className="adminlte-card">
          <div className="adminlte-card-header">
            <div>
              <div className="adminlte-card-title">Antrean penawaran yang diterima — demo bank</div>
              <div className="adminlte-card-subtitle">
                Langkah ini hanya mengubah status lokal; tidak ada instruksi pembayaran atau transfer dana.
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="swiss-table">
              <thead>
                <tr>
                  <th>ID Berkas</th>
                  <th>Debitur</th>
                  <th>Skema</th>
                  <th className="text-right">Jumlah Pengajuan</th>
                  <th className="text-center">Aksi demo</th>
                </tr>
              </thead>
              <tbody>
                {applications.filter((app) =>
                  app.status === 'OFFER_ACCEPTED' &&
                  app.scheme !== 'MUDHARABAH_P2P' && app.scheme !== 'MUSYARAKAH_P2P'
                ).length === 0 ? (
                  <tr><td colSpan={5} className="text-center">Belum ada penawaran demo yang diterima.</td></tr>
                ) : applications.filter((app) =>
                  app.status === 'OFFER_ACCEPTED' &&
                  app.scheme !== 'MUDHARABAH_P2P' && app.scheme !== 'MUSYARAKAH_P2P'
                ).map((app) => (
                  <tr key={app.id}>
                    <td className="font-mono-code">{app.id}</td>
                    <td>{app.applicantName}</td>
                    <td>{app.scheme.replace(/_/g, ' ')}</td>
                    <td className="text-right num-financial">{formatIDR(app.requestedAmount)}</td>
                    <td className="text-center">
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => onSimulateDisbursement(app.id)}>
                        Catat pencairan demo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 4 Bank Balance Sheet KPI Cards */}
        <section className="adminlte-kpi-grid">
          <div className="small-box">
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial">
                  {formatCompactIDR(stressedHealth.dpkDeposits)}
                </div>
                <div className="small-box-label">Total Dana Pihak Ketiga (DPK)</div>
              </div>
              <div
                className="small-box-icon"
                style={{ backgroundColor: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Rasio CASA: {casaRatioPct}%</span>
              <span>CoF: {rawCostOfFundPct.toFixed(2)}%</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-inner">
              <div>
                <div
                  className="small-box-value num-financial"
                  style={{
                    color:
                      stressedHealth.availableLiquidCash > 500_000_000
                        ? 'var(--status-safe)'
                        : 'var(--status-danger)',
                  }}
                >
                  {formatCompactIDR(stressedHealth.availableLiquidCash)}
                </div>
                <div className="small-box-label">Kas Likuid Siap Disalurkan</div>
              </div>
              <div
                className="small-box-icon"
                style={{ backgroundColor: 'var(--status-safe-bg)', color: 'var(--status-safe)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>FDR/LDR: {stressedHealth.fdrLdrPct}%</span>
              <span>Batas Maks: {bankProfile.maxFdrLimitPct}%</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial" style={{ color: 'var(--accent-info)' }}>
                  {recommendedSbdkPct}% p.a.
                </div>
                <div className="small-box-label">Harga indikatif demo (bukan SBDK)</div>
              </div>
              <div
                className="small-box-icon"
                style={{ backgroundColor: 'var(--accent-info-soft)', color: 'var(--accent-info)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>CoLF: {effectiveColfPct}%</span>
              <span>Premi Risiko: {portfolioRiskPremiumPct}%</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-inner">
              <div>
                <div
                  className="small-box-value num-financial"
                  style={{
                    color:
                      netBankProfitAfterProvision >= 0
                        ? 'var(--status-safe)'
                        : 'var(--status-danger)',
                  }}
                >
                  {formatCompactIDR(netBankProfitAfterProvision)}
                </div>
                <div className="small-box-label">Proyeksi laba ilustratif / tahun</div>
              </div>
              <div
                className="small-box-icon"
                style={{ backgroundColor: 'var(--accent-gold-soft)', color: 'var(--accent-gold)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>CAR/KPMM: {stressedHealth.carKpmmPct}%</span>
              <span>ROA: {stressedHealth.roaPct}%</span>
            </div>
          </div>
        </section>

        {/* Module 1 & 2: DPK CASA Composition + Cost of Fund (SBDK) Calculator AND Balance Sheet & Income Statement */}
        <section className="row-2-col">
          {/* Left: Cost of Fund (CoF) & Base Lending Rate (SBDK) Pricing Engine */}
          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  1. Komposisi Dana Simulasi &amp; Kalkulator Harga Pembiayaan Demo
                </div>
                <div className="adminlte-card-subtitle">
                  Menentukan bunga/margin minimum yang wajib dipasang bank agar menutupi Biaya Dana &amp; Risiko
                </div>
              </div>
              <HelpTip
                title="Kalkulator biaya dana dan harga demo"
                description="Kalkulator demo menggabungkan biaya dana, overhead, proxy kerugian, dan margin target. Ini bukan SBDK resmi atau parameter harga produk bank."
                formula="Harga indikatif demo = biaya dana + overhead + proxy risiko + margin"
                steps={[
                  'Atur komposisi dana murah CASA (Giro & Tabungan) vs dana mahal (Deposito).',
                  'Semakin tinggi rasio CASA, semakin murah Cost of Fund bank sehingga bunga kredit ke UMKM bisa lebih kompetitif.',
                ]}
              />
            </div>

            <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <svg width="160" height="160" viewBox="0 0 160 160" aria-label="Donut Chart Komposisi DPK">
                  <g transform={`rotate(-90 ${cx} ${cy})`}>
                    {dpkSlices.map((s) => {
                      const dash = `${(s.pct / 100) * circ} ${circ}`;
                      const offset = -(cum / 100) * circ;
                      cum += s.pct;
                      return (
                        <circle
                          key={s.label}
                          cx={cx}
                          cy={cy}
                          r={r}
                          fill="transparent"
                          stroke={s.color}
                          strokeWidth="20"
                          strokeDasharray={dash}
                          strokeDashoffset={offset}
                        />
                      );
                    })}
                  </g>
                  <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-muted)">
                    CASA RATIO
                  </text>
                  <text x={cx} y={cy + 14} textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--text-primary)" className="num-financial">
                    {casaRatioPct}%
                  </text>
                </svg>

                <div style={{ flex: 1, minWidth: '210px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div>
                    <label className="form-label" htmlFor="giro-slider" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Porsi Giro (Bunga 2.0%):</span>
                      <strong className="num-financial">{giroSharePct}%</strong>
                    </label>
                    <input
                      id="giro-slider"
                      type="range"
                      min={10}
                      max={45}
                      value={giroSharePct}
                      onChange={(e) => setGiroSharePct(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="tabungan-slider" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Porsi Tabungan (Bunga 3.25%):</span>
                      <strong className="num-financial">{tabunganSharePct}%</strong>
                    </label>
                    <input
                      id="tabungan-slider"
                      type="range"
                      min={15}
                      max={50}
                      value={tabunganSharePct}
                      onChange={(e) => setTabunganSharePct(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="num-financial" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Porsi Deposito Berjangka (6.0%):</span>
                    <strong>{depositoSharePct}%</strong>
                  </div>
                </div>
              </div>

              {/* SBDK Breakdown Bar */}
              <div
                style={{
                  padding: '0.95rem 1.1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-grid)',
                }}
              >
                <div className="swiss-kicker" style={{ marginBottom: '0.5rem' }}>
                  KOMPONEN HARGA INDIKATIF DEMO ({recommendedSbdkPct}% p.a.)
                </div>
                <div className="row-2-col" style={{ gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div className="num-financial">
                    • Cost of Loanable Funds (GWM {gwmReservePct}%): <strong>{effectiveColfPct}%</strong>
                  </div>
                  <div className="num-financial">
                    • Premi risiko indikatif demo: <strong>{portfolioRiskPremiumPct}%</strong>
                  </div>
                  <div className="num-financial" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>• Overhead Operasional (%):</span>
                    <input
                      type="number"
                      step={0.15}
                      value={overheadOpxPct}
                      onChange={(e) => setOverheadOpxPct(Number(e.target.value) || 2.0)}
                      className="form-control num-financial"
                      style={{ width: '76px', minHeight: '28px', padding: '0.15rem 0.4rem' }}
                      aria-label="Overhead Operasional Persen"
                    />
                  </div>
                  <div className="num-financial" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>• Target ROA / Profit Margin (%):</span>
                    <input
                      type="number"
                      step={0.25}
                      value={targetProfitMarginPct}
                      onChange={(e) => setTargetProfitMarginPct(Number(e.target.value) || 2.0)}
                      className="form-control num-financial"
                      style={{ width: '76px', minHeight: '28px', padding: '0.15rem 0.4rem' }}
                      aria-label="Target Margin Laba Persen"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Bank Balance Sheet & Income Statement Summary */}
          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  2. Ringkasan Neraca &amp; Proyeksi Laba-Rugi Internal Bank
                </div>
                <div className="adminlte-card-subtitle">
                  Posisi Aktiva (Kredit &amp; Cadangan), Pasiva (DPK &amp; Modal Inti), dan Net Interest Income
                </div>
              </div>
              <HelpTip
                title="Neraca & Laba-Rugi Internal Bank"
                description="Menampilkan perubahan profil bank fiktif dari status pencairan demo. Perhitungan berjalan lokal dan tidak terhubung ke neraca atau sistem bank."
              />
            </div>

            <div className="adminlte-card-body">
              <table className="swiss-table">
                <thead>
                  <tr>
                    <th>Pos Laporan Keuangan Internal Bank</th>
                    <th>Kategori</th>
                    <th className="text-right">Nominal (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Pembiayaan Eksisting + Pencairan LOS Bank</td>
                    <td><span className="badge badge-info">AKTIVA PRODUKTIF</span></td>
                    <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                      {formatIDR(stressedHealth.totalActiveFinancing)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Kas Likuid Tersedia &amp; Penempatan BI</td>
                    <td><span className="badge badge-safe">AKTIVA LIKUID</span></td>
                    <td className="text-right num-financial" style={{ fontWeight: 700, color: 'var(--status-safe)' }}>
                      {formatIDR(stressedHealth.availableLiquidCash)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Dana Pihak Ketiga (Giro, Tabungan, Deposito)</td>
                    <td><span className="badge badge-neutral">LIABILITAS DPK</span></td>
                    <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                      {formatIDR(stressedHealth.dpkDeposits)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Modal Inti Bank (Tier-1 Capital)</td>
                    <td><span className="badge badge-neutral">EKUITAS BANK</span></td>
                    <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                      {formatIDR(stressedHealth.tier1Capital)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Pendapatan Bunga/Margin Tahunan (Gross)</td>
                    <td><span className="badge badge-safe">LABA-RUGI</span></td>
                    <td className="text-right num-financial">
                      {formatIDR(annualInterestIncome)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Beban Bagi Hasil / Bunga DPK (CoF {rawCostOfFundPct.toFixed(2)}%)</td>
                    <td><span className="badge badge-warn">BIAYA DANA</span></td>
                    <td className="text-right num-financial">
                      - {formatIDR(annualInterestExpense)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800 }}>Estimasi laba ilustratif setelah proxy kerugian</td>
                    <td><span className="badge badge-safe">NET PROFIT</span></td>
                    <td className="text-right num-financial" style={{ fontWeight: 800, color: 'var(--status-safe)' }}>
                      {formatIDR(netBankProfitAfterProvision)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Module 3 & 4: Liquidity Stress Test (Deposit Run) AND OJK / Basel III Regulatory Traffic Lights */}
        <section className="row-5-7">
          {/* Left: Bank Deposit Run & NPL Shock Simulator */}
          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  3. Uji Stres Ketahanan Likuiditas Bank (Deposit Run &amp; NPL Shock)
                </div>
                <div className="adminlte-card-subtitle">
                  Simulasikan penarikan dana DPK serentak oleh deposan atau lonjakan kredit macet
                </div>
              </div>
              <HelpTip
                title="Simulasi Penarikan Dana (Deposit Run) & Stres Bank"
                description="Sesuai proyek Stress Testing Bank, fitur ini menguji apakah bank masih sanggup mencairkan pinjaman baru apabila deposan besar tiba-tiba menarik dananya (DPK turun) atau rasio kredit macet (NPL) melonjak."
                steps={[
                  'Geser slider Penarikan Dana DPK untuk melihat kenaikan drastis rasio FDR/LDR dan penyusutan Kas Likuid.',
                  'Geser slider Lonjakan Kredit Macet (NPL Shock) untuk melihat penurunan rasio kecukupan modal CAR/KPMM di tabel sebelah kanan.',
                ]}
              />
            </div>

            <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div
                style={{
                  padding: '1.1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-grid)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div>
                  <label className="form-label" htmlFor="deposit-run-slider" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Simulasi Penarikan Dana DPK (Deposit Run):</span>
                    <strong className="num-financial" style={{ color: depositRunWithdrawalPct > 0 ? 'var(--status-danger)' : 'inherit' }}>
                      -{depositRunWithdrawalPct}% DPK ({formatCompactIDR(bankProfile.dpkDeposits * (depositRunWithdrawalPct / 100))})
                    </strong>
                  </label>
                  <input
                    id="deposit-run-slider"
                    type="range"
                    min={0}
                    max={30}
                    step={5}
                    value={depositRunWithdrawalPct}
                    onChange={(e) => setDepositRunWithdrawalPct(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '0.35rem' }}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="npl-shock-slider" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Simulasi Lonjakan Kredit Macet (NPL Shock):</span>
                    <strong className="num-financial" style={{ color: nplShockAddPct > 0 ? 'var(--status-danger)' : 'inherit' }}>
                      +{nplShockAddPct}% NPL Baru
                    </strong>
                  </label>
                  <input
                    id="npl-shock-slider"
                    type="range"
                    min={0}
                    max={8}
                    step={1}
                    value={nplShockAddPct}
                    onChange={(e) => setNplShockAddPct(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '0.35rem' }}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-card)',
                  backgroundColor:
                    stressedHealth.fdrLdrPct > 92 || stressedHealth.carKpmmPct < 12
                      ? 'var(--status-danger-bg)'
                      : 'var(--status-safe-bg)',
                  color:
                    stressedHealth.fdrLdrPct > 92 || stressedHealth.carKpmmPct < 12
                      ? 'var(--status-danger)'
                      : 'var(--status-safe)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  lineHeight: 1.55,
                }}
              >
                {stressedHealth.fdrLdrPct > 92 || stressedHealth.carKpmmPct < 12 ? (
                  <>
                    PERINGATAN SIMULASI: Pada skenario demo ini, rasio pembiayaan/DPK naik ke{' '}
                    <strong>{stressedHealth.fdrLdrPct}%</strong> dan CAR turun ke{' '}
                    <strong>{stressedHealth.carKpmmPct}%</strong>. Angka melewati ambang ilustratif yang diatur pada demo.
                  </>
                ) : (
                  <>
                    HASIL SIMULASI: Kas likuid ilustratif masih tersisa{' '}
                    <strong>{formatIDR(stressedHealth.availableLiquidCash)}</strong> dengan FDR{' '}
                    <strong>{stressedHealth.fdrLdrPct}%</strong> dan CAR ilustratif{' '}
                    <strong>{stressedHealth.carKpmmPct}%</strong>. Angka bukan penilaian regulator.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: OJK & Basel III Regulatory Traffic Lights */}
          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  4. Indikator Kesehatan Bank — Ilustrasi Demo
                </div>
                <div className="adminlte-card-subtitle">
                  Rasio dan ambang di bawah hanya simulasi; bukan perhitungan kepatuhan regulator.
                </div>
              </div>
              <HelpTip
                title="Indikator Ilustratif Demo"
                description="Menampilkan rasio profil bank fiktif dengan ambang ilustratif. Implementasi ini tidak menghitung kepatuhan OJK atau Basel."
              />
            </div>

            <div className="table-wrap">
              <table className="swiss-table">
                <thead>
                  <tr>
                    <th>Indikator</th>
                    <th>Nama Indikator Kesehatan</th>
                    <th className="text-right">Posisi Aktual</th>
                    <th className="text-center">Ambang ilustratif</th>
                    <th className="text-center">Status demo</th>
                  </tr>
                </thead>
                <tbody>
                  {regulatoryIndicators.map((ind) => (
                    <tr key={ind.code}>
                      <td className="font-mono-code" style={{ fontWeight: 700 }}>{ind.code}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ind.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {ind.detail}
                        </div>
                      </td>
                      <td className="text-right num-financial" style={{ fontWeight: 800 }}>
                        {ind.actualValue}
                      </td>
                      <td className="text-center font-mono-code" style={{ fontSize: '0.78rem' }}>
                        {ind.ojkThreshold}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            ind.status === 'SEHAT'
                              ? 'badge-safe'
                              : ind.status === 'WASPADA'
                                ? 'badge-warn'
                                : 'badge-danger'
                          }`}
                        >
                          {ind.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Module 5: Sectoral Credit Quota & Concentration Risk Allocation */}
        <div className="adminlte-card">
          <div className="adminlte-card-header">
            <div>
              <div className="adminlte-card-title">
                5. Alokasi Kuota Kredit per Sektor Ekonomi (Sectoral Concentration Limit)
              </div>
              <div className="adminlte-card-subtitle">
                Memastikan portofolio bank terdiversifikasi dan tidak terkonsentrasi berlebihan pada satu sektor usaha
              </div>
            </div>
            <HelpTip
              title="Batas Konsentrasi Kredit Sektoral"
              description="Tabel ini hanya menghitung pengajuan skenario bank. Kuota dan ambangnya adalah asumsi demo, bukan batas regulator atau keputusan otomatis."
            />
          </div>

          <div className="table-wrap">
            <table className="swiss-table">
              <thead>
                <tr>
                  <th>Sektor Ekonomi</th>
                  <th className="text-center">Jumlah Debitur</th>
                  <th className="text-right">Kuota Maksimum Bank</th>
                  <th className="text-right">Total Eksposur Pengajuan</th>
                  <th className="text-right">Eksposur skenario bank</th>
                  <th style={{ width: '210px' }}>Utilisasi Kuota Sektor</th>
                </tr>
              </thead>
              <tbody>
                {sectorLimits.map((sec) => (
                  <tr key={sec.sectorKey}>
                    <td style={{ fontWeight: 700 }}>{sec.label}</td>
                    <td className="text-center num-financial">{sec.appCount} Berkas</td>
                    <td className="text-right num-financial">{formatIDR(sec.limitQuota)}</td>
                    <td className="text-right num-financial" style={{ fontWeight: 700 }}>
                      {formatIDR(sec.totalExposure)}
                    </td>
                    <td className="text-right num-financial">
                      {formatIDR(sec.totalExposure)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                        <span className="num-financial" style={{ fontWeight: 700 }}>{sec.utilizationPct}%</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Sisa {formatCompactIDR(Math.max(0, sec.limitQuota - sec.totalExposure))}
                        </span>
                      </div>
                      <div className="swiss-meter">
                        <div
                          className="swiss-meter-fill"
                          style={{
                            width: `${Math.min(100, sec.utilizationPct)}%`,
                            backgroundColor:
                              sec.utilizationPct > 85
                                ? 'var(--status-danger)'
                                : sec.utilizationPct > 65
                                  ? 'var(--status-warn)'
                                  : 'var(--status-safe)',
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="adminlte-card-footer">
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Ingin memeriksa detail berkas debitur pada sektor dengan utilisasi tinggi?
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onInspectInUnderwriter(applications[0].id)}
            >
              Buka Antrean Credit Analyst →
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

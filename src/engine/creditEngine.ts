import {
  AmortizationInstallment,
  BankHealthMetrics,
  CollateralType,
  CreditUnderwritingEvaluation,
  FinancingScheme,
  InternalBankProfile,
  LoanApplication,
  MonthlyMutationRecord,
  MutationAnomalyFlag,
  RiskPolicyConfig,
  RiskFactorContribution,
} from '../types/credit';

export const DEFAULT_BANK_PROFILE: InternalBankProfile = {
  bankName: 'PT Bank Nusantara Kencana Syariah & Komersial (Simulasi)',
  bankLicenseCode: 'DEMO-PROFILE // BUKAN IDENTITAS ATAU IZIN BANK',
  tier1Capital: 3_500_000_000, // Modal Inti Rp 3,50 Miliar
  dpkDeposits: 18_500_000_000, // Dana Pihak Ketiga (DPK) Rp 18,50 Miliar
  existingLoanPortfolio: 14_200_000_000, // Portofolio kredit berjalan Rp 14,20 Miliar
  existingRwaAtmr: 11_800_000_000, // ATMR eksisting Rp 11,80 Miliar
  existingNplAmount: 310_000_000, // NPL/NPF dasar Rp 310 Juta
  bopoRatioPct: 76.4,
  nimMarginPct: 6.85,
  maxFdrLimitPct: 92.0,
  minCarLimitPct: 12.0,
  bmpkLimitPct: 20.0, // Maks Rp 700 Jt dari kas internal bank ke 1 debitur (sisanya wajib sindikasi P2P)
};

export const DEFAULT_RISK_POLICY: RiskPolicyConfig = {
  minDscrPolicy: 1.25,
  maxDsrPolicy: 35,
  favorableReviewScore: 700,
  windowDressingSpikeThreshold: 1.65,
  slikAutoSync: true,
  dukcapilKycActive: true,
};

const COLLATERAL_HAIRCUT: Record<CollateralType, number> = {
  DEPOSITO_BACKED: 0.05,
  SHM_TANAH_BANGUNAN: 0.25,
  BPKB_KENDARAAN_NIAGA: 0.45,
  INVENTORY_RECEIVABLE: 0.55,
  UNSECURED_CASHFLOW: 1.0,
};

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  return 'Rp ' + rounded.toLocaleString('id-ID');
}

export function formatCompactIDR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(2)} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1)} Jt`;
  }
  return formatIDR(amount);
}

/**
 * Generates an illustrative schedule for conventional annuity or Murabahah.
 * P2P profit-sharing contracts are not represented by a fixed-margin schedule.
 */
export function generateAmortizationSchedule(
  principal: number,
  tenorMonths: number,
  annualRateOrMarginPct: number,
  scheme: FinancingScheme
): AmortizationInstallment[] {
  const safePrincipal = Math.max(0, principal);
  const safeTenor = Math.max(1, Math.round(tenorMonths));
  const monthlyRate = Math.max(0, annualRateOrMarginPct) / 100 / 12;

  const schedule: AmortizationInstallment[] = [];

  if (scheme === 'ANUITAS_KONVENSIONAL') {
    const monthlyPayment =
      monthlyRate === 0
        ? safePrincipal / safeTenor
        : (safePrincipal * (monthlyRate * Math.pow(1 + monthlyRate, safeTenor))) /
          (Math.pow(1 + monthlyRate, safeTenor) - 1);

    let balance = safePrincipal;
    for (let period = 1; period <= safeTenor; period++) {
      const interestComp = balance * monthlyRate;
      const principalComp =
        period === safeTenor ? balance : Math.min(balance, monthlyPayment - interestComp);
      const closing = Math.max(0, balance - principalComp);

      schedule.push({
        period,
        openingPrincipal: balance,
        principalComponent: principalComp,
        interestOrMarginComponent: interestComp,
        totalInstallment: principalComp + interestComp,
        closingPrincipal: closing,
      });
      balance = closing;
    }
  } else if (scheme === 'MURABAHAH_MARGIN') {
    // Illustrative linear principal + fixed margin. This is not a contract quote.
    const principalPerMonth = safePrincipal / safeTenor;
    const marginPerMonth = safePrincipal * monthlyRate;
    let balance = safePrincipal;

    for (let period = 1; period <= safeTenor; period++) {
      const principalComp = period === safeTenor ? balance : principalPerMonth;
      const closing = Math.max(0, balance - principalComp);
      schedule.push({
        period,
        openingPrincipal: balance,
        principalComponent: principalComp,
        interestOrMarginComponent: marginPerMonth,
        totalInstallment: principalComp + marginPerMonth,
        closingPrincipal: closing,
      });
      balance = closing;
    }
  } else {
    // Mudharabah/Musyarakah need profit and capital-sharing assumptions absent here.
    return [];
  }

  return schedule;
}

/**
 * Forensics detector on 6-month bank account mutations (#19)
 */
export function analyzeBankMutations(
  mutations: MonthlyMutationRecord[],
  spikeThreshold = 1.65
): {
  avgInflow: number;
  avgOutflow: number;
  netRetentionPct: number;
  volatilityCv: number;
  totalBouncedChecks: number;
  roundNumberRatioPct: number;
  anomalies: MutationAnomalyFlag[];
} {
  if (!mutations || mutations.length === 0) {
    return {
      avgInflow: 0,
      avgOutflow: 0,
      netRetentionPct: 0,
      volatilityCv: 0,
      totalBouncedChecks: 0,
      roundNumberRatioPct: 0,
      anomalies: [],
    };
  }

  const n = mutations.length;
  const totalInflow = mutations.reduce((acc, m) => acc + m.creditInflow, 0);
  const totalOutflow = mutations.reduce((acc, m) => acc + m.debitOutflow, 0);
  const avgInflow = totalInflow / n;
  const avgOutflow = totalOutflow / n;

  const variance =
    mutations.reduce((acc, m) => acc + Math.pow(m.creditInflow - avgInflow, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const volatilityCv = avgInflow > 0 ? stdDev / avgInflow : 0;

  const avgEndingBalance = mutations.reduce((acc, m) => acc + m.endingBalance, 0) / n;
  const netRetentionPct = avgInflow > 0 ? (avgEndingBalance / avgInflow) * 100 : 0;

  const totalTx = mutations.reduce((acc, m) => acc + m.transactionCount, 0);
  const totalRoundTx = mutations.reduce((acc, m) => acc + m.roundNumberTxCount, 0);
  const totalBouncedChecks = mutations.reduce((acc, m) => acc + m.bouncedCheckCount, 0);
  const roundNumberRatioPct = totalTx > 0 ? (totalRoundTx / totalTx) * 100 : 0;

  const anomalies: MutationAnomalyFlag[] = [];

  // 1. Bounced Check / Tolakan Kliring
  if (totalBouncedChecks > 0) {
    anomalies.push({
      code: 'NSF_BOUNCED_CLEARING',
      severity: 'HIGH',
      title: 'Tolakan Kliring / Bilyet Giro Kosong Terdeteksi',
      detail: `Terdapat ${totalBouncedChecks} kejadian tolakan kliring/autodebit gagal dalam 6 bulan terakhir.`,
      metricValue: `${totalBouncedChecks} Kejadian`,
    });
  }

  // 2. Window Dressing / Sudden Last-Month Inflow Spike
  const lastMonth = mutations[mutations.length - 1];
  const priorAvg =
    mutations.length > 1
      ? mutations.slice(0, -1).reduce((s, m) => s + m.creditInflow, 0) / (mutations.length - 1)
      : avgInflow;
  if (priorAvg > 0 && lastMonth.creditInflow > priorAvg * spikeThreshold) {
    const spikeRatio = lastMonth.creditInflow / priorAvg;
    anomalies.push({
      code: 'WINDOW_DRESSING_SPIKE',
      severity: 'HIGH',
      title: 'Indikasi Window Dressing Bulan Terakhir',
      detail: `Mutasi masuk bulan ${lastMonth.month} melonjak ${spikeRatio.toFixed(2)}x dibanding rata-rata 5 bulan sebelumnya.`,
      metricValue: `+${((spikeRatio - 1) * 100).toFixed(0)}% Lonjakan`,
    });
  }

  // 3. Round-number circular transfer suspicion
  if (roundNumberRatioPct >= 28) {
    anomalies.push({
      code: 'CIRCULAR_ROUND_TX',
      severity: roundNumberRatioPct >= 40 ? 'HIGH' : 'MEDIUM',
      title: 'Proporsi Transaksi Nominal Bulat Tinggi',
      detail: `${roundNumberRatioPct.toFixed(1)}% transaksi bernominal bulat sempurna (indikasi transfer antar-rekening afiliasi).`,
      metricValue: `${roundNumberRatioPct.toFixed(1)}% Tx Bulat`,
    });
  }

  // 4. Cash Pass-Through / Low Retention
  if (netRetentionPct < 9.5) {
    anomalies.push({
      code: 'PASS_THROUGH_LOW_RETENTION',
      severity: 'MEDIUM',
      title: 'Retensi Saldo Akhir Sangat Tipis (Pass-Through)',
      detail: `Rata-rata saldo mengendap akhir bulan hanya ${netRetentionPct.toFixed(1)}% dari arus kas masuk bulanan.`,
      metricValue: `${netRetentionPct.toFixed(1)}% Retensi`,
    });
  }

  // 5. High Revenue Volatility
  if (volatilityCv > 0.35) {
    anomalies.push({
      code: 'CASHFLOW_VOLATILITY',
      severity: 'LOW',
      title: 'Fluktuasi Arus Kas Musiman Tinggi',
      detail: `Koefisien variasi (CV) arus kas masuk mencapai ${(volatilityCv * 100).toFixed(1)}% (di atas ambang stabil 35%).`,
      metricValue: `CV ${(volatilityCv * 100).toFixed(1)}%`,
    });
  }

  return {
    avgInflow,
    avgOutflow,
    netRetentionPct,
    volatilityCv,
    totalBouncedChecks,
    roundNumberRatioPct,
    anomalies,
  };
}

/**
 * Computes Altman Z''-Score (Emerging Market / Non-Manufacturing SME Model)
 * Z'' = 3.25 + 6.56*X1 + 3.26*X2 + 6.72*X3 + 1.05*X4
 */
export function computeAltmanZScore(app: LoanApplication): {
  zScore: number;
  zone: 'SAFE' | 'GREY_WATCH' | 'DISTRESS';
} {
  const totalAssets = Math.max(1, app.totalAssets);
  const totalLiabilities = Math.max(1, app.totalLiabilities);
  const workingCapital = app.currentAssets - app.currentLiabilities;
  const annualEbit = (app.monthlyRevenue - app.monthlyCogsAndOpex) * 12;
  const bookEquity = Math.max(0, app.totalAssets - app.totalLiabilities);

  const x1 = clamp(workingCapital / totalAssets, -0.5, 0.8);
  const x2 = clamp(app.retainedEarnings / totalAssets, -0.5, 0.8);
  const x3 = clamp(annualEbit / totalAssets, -0.5, 0.9);
  const x4 = clamp(bookEquity / totalLiabilities, 0, 3.5);

  const zScore = 3.25 + 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4;
  const zone = zScore > 5.85 ? 'SAFE' : zScore >= 4.15 ? 'GREY_WATCH' : 'DISTRESS';

  return { zScore: Number(zScore.toFixed(2)), zone };
}

/**
 * Deterministic pre-screening rules for the portfolio demo (#5 & #19).
 */
export function evaluateLoanApplication(
  app: LoanApplication,
  policy: RiskPolicyConfig = DEFAULT_RISK_POLICY
): CreditUnderwritingEvaluation {
  const schedule = generateAmortizationSchedule(
    app.requestedAmount,
    app.tenorMonths,
    app.annualRateOrMarginPct,
    app.scheme
  );
  const isProfitSharingScheme =
    app.scheme === 'MUDHARABAH_P2P' || app.scheme === 'MUSYARAKAH_P2P';
  const calculationLimitations = isProfitSharingScheme
    ? ['Proyeksi angsuran, DSCR, dan DSR bagi hasil belum dimodelkan untuk skema ini.']
    : [];
  const proposedMonthlyInstallment =
    schedule.length > 0 ? schedule[0].totalInstallment : 0;

  const netOperatingCashFlow = app.monthlyRevenue - app.monthlyCogsAndOpex;
  const disposableCashFlow = netOperatingCashFlow - app.monthlyHouseholdExpense;
  const totalMonthlyDebtService = Math.max(
    1,
    app.existingMonthlyDebtService + proposedMonthlyInstallment
  );

  const dscr = Number((disposableCashFlow / totalMonthlyDebtService).toFixed(2));
  const dsrPct =
    app.monthlyRevenue > 0
      ? Number(((totalMonthlyDebtService / app.monthlyRevenue) * 100).toFixed(1))
      : 199.9;

  const netProfitMarginPct =
    app.monthlyRevenue > 0
      ? Number(((netOperatingCashFlow / app.monthlyRevenue) * 100).toFixed(1))
      : 0;

  const currentRatio =
    app.currentLiabilities > 0
      ? Number((app.currentAssets / app.currentLiabilities).toFixed(2))
      : 3.0;

  const haircut = COLLATERAL_HAIRCUT[app.collateralType];
  const collateralLiquidationValue = Math.round(app.collateralAppraisedValue * (1 - haircut));
  const ltvPct =
    app.collateralAppraisedValue > 0
      ? Number(((app.requestedAmount / app.collateralAppraisedValue) * 100).toFixed(1))
      : 150.0;

  const { zScore: altmanZDoublePrime, zone: altmanZone } = computeAltmanZScore(app);
  const forensics = analyzeBankMutations(
    app.mutations,
    policy.windowDressingSpikeThreshold
  );

  // =========================================================================
  // Hand-authored log-odds-like rules. These are not trained logistic regression
  // coefficients and do not produce a calibrated probability of default.
  // =========================================================================
  const baseLogOdds = -2.35;

  // 1. DSCR Contribution
  const dscrLogImpact = isProfitSharingScheme
    ? 0
    : dscr >= 1.75
      ? -0.95
      : dscr >= 1.4
        ? -0.6
        : dscr >= 1.25
          ? -0.25
          : dscr >= 1.05
            ? 0.48
            : 1.35;

  // 2. SLIK OJK Collectibility & Arrears History
  const slikLogImpact =
    app.slikKol === 1 && app.pastArrearsDaysMax <= 5
      ? -0.75
      : app.slikKol === 1
        ? -0.3
        : app.slikKol === 2
          ? 0.65
          : app.slikKol === 3
            ? 1.55
            : 2.45;

  // 3. Collateral Coverage & LTV
  const collateralCoverageRatio =
    app.requestedAmount > 0 ? collateralLiquidationValue / app.requestedAmount : 0;
  const collateralLogImpact =
    collateralCoverageRatio >= 1.15
      ? -0.55
      : collateralCoverageRatio >= 0.85
        ? -0.25
        : collateralCoverageRatio >= 0.5
          ? 0.25
          : 0.72;

  // 4. Business Vintage (Years in Business)
  const vintageLogImpact =
    app.yearsInBusiness >= 6
      ? -0.45
      : app.yearsInBusiness >= 3
        ? -0.2
        : app.yearsInBusiness >= 2
          ? 0.15
          : 0.55;

  // 5. Bank Statement Forensics & Anomaly Penalty
  const highSeverityCount = forensics.anomalies.filter((a) => a.severity === 'HIGH').length;
  const medSeverityCount = forensics.anomalies.filter((a) => a.severity === 'MEDIUM').length;
  const forensicsLogImpact =
    highSeverityCount === 0 && medSeverityCount === 0
      ? -0.42
      : highSeverityCount * 0.75 + medSeverityCount * 0.32;

  // 6. Altman Z'' Balance Sheet Resilience
  const altmanLogImpact =
    altmanZone === 'SAFE' ? -0.38 : altmanZone === 'GREY_WATCH' ? 0.18 : 0.78;

  // 7. Revenue Realism vs Bank Mutation Inflow Alignment
  const mutationToReportedRatio =
    app.monthlyRevenue > 0 ? forensics.avgInflow / app.monthlyRevenue : 1;
  const alignmentLogImpact =
    mutationToReportedRatio >= 0.92
      ? -0.3
      : mutationToReportedRatio >= 0.75
        ? 0.25
        : 0.88;

  const rawFeatures: Array<{
    key: string;
    label: string;
    formatted: string;
    logImpact: number;
  }> = [
    {
      key: 'DSCR_CAPACITY',
      label: 'Kapasitas Arus Kas (DSCR)',
      formatted: isProfitSharingScheme
        ? 'Belum dihitung untuk akad bagi hasil'
        : `${dscr.toFixed(2)}x (beban utang/omzet ${dsrPct.toFixed(1)}%)`,
      logImpact: dscrLogImpact,
    },
    {
      key: 'SLIK_BUREAU',
      label: 'Riwayat SLIK OJK & Tunggakan',
      formatted: `KOL-${app.slikKol} (Max ${app.pastArrearsDaysMax} hr)`,
      logImpact: slikLogImpact,
    },
    {
      key: 'FORENSIC_MUTATION',
      label: 'Forensik Mutasi Rekening 6 Bulan',
      formatted: `${forensics.anomalies.length} Temuan Anomali`,
      logImpact: forensicsLogImpact,
    },
    {
      key: 'COLLATERAL_LTV',
      label: 'Penutupan Agunan Likuidasi',
      formatted: `${(collateralCoverageRatio * 100).toFixed(0)}% (LTV ${ltvPct.toFixed(0)}%)`,
      logImpact: collateralLogImpact,
    },
    {
      key: 'ALTMAN_BALANCE',
      label: 'Ketahanan Neraca (Altman Z\'\')',
      formatted: `${altmanZDoublePrime.toFixed(2)} (${altmanZone})`,
      logImpact: altmanLogImpact,
    },
    {
      key: 'REVENUE_VERIFICATION',
      label: 'Rekonsiliasi Omzet vs Mutasi Bank',
      formatted: `${(mutationToReportedRatio * 100).toFixed(0)}% Terverifikasi`,
      logImpact: alignmentLogImpact,
    },
    {
      key: 'BUSINESS_VINTAGE',
      label: 'Usia Operasional Usaha',
      formatted: `${app.yearsInBusiness} Tahun`,
      logImpact: vintageLogImpact,
    },
  ];

  const totalLogOdds =
    baseLogOdds + rawFeatures.reduce((sum, item) => sum + item.logImpact, 0);
  const pdRaw = 1 / (1 + Math.exp(-totalLogOdds));
  const riskSignalPct = Number(clamp(pdRaw * 100, 0.35, 96.5).toFixed(2));

  // Illustrative points transform used only for consistent demo ordering.
  const pdoFactor = 45 / Math.LN2;
  const rawScore = 515 - pdoFactor * totalLogOdds;
  const creditScore = Math.round(clamp(rawScore, 300, 850));

  const riskFactorContributions: RiskFactorContribution[] = rawFeatures
    .map((f) => {
      const pointsImpact = Math.round(-f.logImpact * pdoFactor);
      return {
        featureKey: f.key,
        featureLabel: f.label,
        rawValueFormatted: f.formatted,
        logOddsImpact: Number(f.logImpact.toFixed(2)),
        pointsImpact,
        direction:
          f.logImpact < -0.05
            ? ('RISK_DECREASING' as const)
            : f.logImpact > 0.05
              ? ('RISK_INCREASING' as const)
              : ('NEUTRAL' as const),
      };
    })
    .sort((a, b) => Math.abs(b.logOddsImpact) - Math.abs(a.logOddsImpact));

  const ratingGrade: CreditUnderwritingEvaluation['ratingGrade'] =
    creditScore >= 790
      ? 'AAA'
      : creditScore >= 740
        ? 'AA'
        : creditScore >= 690
          ? 'A'
          : creditScore >= 640
            ? 'BBB'
            : creditScore >= 580
              ? 'BB'
              : creditScore >= 510
                ? 'B'
                : creditScore >= 430
                  ? 'CCC'
                  : 'D';

  // Requested amount and a simple collateral-loss proxy; not EAD, ECL, or CKPN.
  const requestedExposureAmount = Math.round(app.requestedAmount);
  const rawLgd =
    requestedExposureAmount > 0
      ? clamp(1 - collateralLiquidationValue / requestedExposureAmount, 0.1, 0.92)
      : 0.45;
  const lgdPct = Number((rawLgd * 100).toFixed(1));
  const indicativeLossProxyAmount = Math.round((riskSignalPct / 100) * rawLgd * requestedExposureAmount);

  // Indicative pricing signal for the demo only.
  const expectedLossAnnualPct = (riskSignalPct / 100) * rawLgd * 100;
  const indicativeRiskSpreadPct = Number((5.25 + expectedLossAnnualPct * 1.35).toFixed(2));

  // Max safe plafond based on target DSCR >= policy.minDscrPolicy
  const targetDscr = Math.max(0.8, policy.minDscrPolicy);
  const maxSafeNewInstallment = Math.max(
    0,
    disposableCashFlow / targetDscr - app.existingMonthlyDebtService
  );
  const installmentPerRupiah =
    app.requestedAmount > 0 ? proposedMonthlyInstallment / app.requestedAmount : 0.05;
  const maxRecommendedPlafond =
    installmentPerRupiah > 0
      ? Math.floor(maxSafeNewInstallment / installmentPerRupiah / 5_000_000) * 5_000_000
      : 0;

  const policyBreaches: string[] = [];
  const strengths: string[] = [];

  if (isProfitSharingScheme) {
    policyBreaches.push(
      'Perhitungan arus kas untuk akad bagi hasil belum tersedia; wajib ditinjau manual dalam demo.'
    );
  }

  if (!isProfitSharingScheme && dscr < policy.minDscrPolicy) {
    policyBreaches.push(
      `DSCR ${dscr.toFixed(2)}x berada di bawah batas minimum kebijakan kredit (${policy.minDscrPolicy.toFixed(2)}x).`
    );
  } else if (!isProfitSharingScheme) {
    strengths.push(`Arus kas bersih kuat dengan DSCR ${dscr.toFixed(2)}x (≥ ${policy.minDscrPolicy.toFixed(2)}x).`);
  }

  if (!isProfitSharingScheme && dsrPct > policy.maxDsrPolicy) {
    policyBreaches.push(`Rasio cicilan terhadap pendapatan (DSR ${dsrPct.toFixed(1)}%) melebihi batas ${policy.maxDsrPolicy}%.`);
  }

  if (app.slikKol >= 3) {
    policyBreaches.push(`Kolektibilitas SLIK OJK KOL-${app.slikKol} melanggar syarat kelayakan kredit produktif.`);
  } else if (app.slikKol === 1 && app.pastArrearsDaysMax <= 5) {
    strengths.push('Rekam jejak SLIK OJK KOL-1 bersih tanpa riwayat tunggakan.');
  }

  if (forensics.totalBouncedChecks > 0) {
    policyBreaches.push(`Ditemukan ${forensics.totalBouncedChecks} tolakan kliring/BG kosong pada rekening koran.`);
  }

  if (mutationToReportedRatio < 0.78) {
    policyBreaches.push(
      `Mutasi kredit rekening koran (${(mutationToReportedRatio * 100).toFixed(0)}%) tidak mendukung klaim omzet laporan keuangan.`
    );
  } else if (mutationToReportedRatio >= 0.95) {
    strengths.push(
      `Omzet terverifikasi penuh oleh mutasi masuk rekening koran (${(mutationToReportedRatio * 100).toFixed(0)}%).`
    );
  }

  if (collateralCoverageRatio >= 1.0) {
    strengths.push(
      `Nilai likuidasi agunan menutup ${(collateralCoverageRatio * 100).toFixed(0)}% eksposur pinjaman (LGD rendah ${lgdPct}%).`
    );
  }

  let ruleScreeningResult: CreditUnderwritingEvaluation['ruleScreeningResult'] =
    'MANUAL_REVIEW';

  if (isProfitSharingScheme) {
    ruleScreeningResult = 'MANUAL_REVIEW';
  } else if (
    creditScore >= policy.favorableReviewScore &&
    dscr >= policy.minDscrPolicy &&
    app.slikKol === 1 &&
    highSeverityCount === 0 &&
    policyBreaches.length === 0
  ) {
    ruleScreeningResult = 'FAVORABLE_REVIEW';
  } else if (
    app.slikKol >= 3 ||
    dscr < 0.95 ||
    creditScore < 500 ||
    forensics.totalBouncedChecks >= 2
  ) {
    ruleScreeningResult = 'UNFAVORABLE_REVIEW';
  } else if (dscr < policy.minDscrPolicy && maxRecommendedPlafond >= app.requestedAmount * 0.5) {
    ruleScreeningResult = 'RESTRUCTURE_REVIEW';
  }

  return {
    creditScore,
    ratingGrade,
    riskSignalPct,
    lgdPct,
    requestedExposureAmount,
    indicativeLossProxyAmount,
    indicativeRiskSpreadPct,
    riskFactorContributions,
    proposedMonthlyInstallment: Math.round(proposedMonthlyInstallment),
    calculationLimitations,
    netOperatingCashFlow,
    disposableCashFlow,
    dscr,
    dsrPct,
    netProfitMarginPct,
    currentRatio,
    ltvPct,
    collateralHaircutPct: Number((haircut * 100).toFixed(0)),
    collateralLiquidationValue,
    altmanZDoublePrime,
    altmanZone,
    mutationAvgInflow: Math.round(forensics.avgInflow),
    mutationAvgOutflow: Math.round(forensics.avgOutflow),
    mutationNetRetentionPct: Number(forensics.netRetentionPct.toFixed(1)),
    mutationVolatilityCv: Number((forensics.volatilityCv * 100).toFixed(1)),
    anomalies: forensics.anomalies,
    ruleScreeningResult,
    maxRecommendedPlafond: Math.max(0, maxRecommendedPlafond),
    policyBreaches,
    strengths,
  };
}

/**
 * Computes illustrative bank-profile ratios for the demo. These figures are
 * not regulatory CAR/KPMM, FDR/LDR, or BMPK calculations.
 */
export function computeInternalBankHealth(
  bank: InternalBankProfile,
  applications: LoanApplication[],
  evaluations: Record<string, CreditUnderwritingEvaluation>,
  extraSimulatedDisbursement = 0
): BankHealthMetrics {
  let disbursedFromLosBalanceSheet = 0;
  let disbursedFromP2PSyndication = 0;
  let additionalAtmr = 0;
  let additionalEcl = 0;
  let additionalNpl = 0;

  for (const app of applications) {
    const p2pFunded = app.p2pCommitments.reduce((s, c) => s + c.committedAmount, 0);
    const bankPortion = Math.max(0, app.requestedAmount - p2pFunded);
    const ev = evaluations[app.id];

    if (app.status === 'P2P_FUNDS_RELEASED') {
      disbursedFromP2PSyndication += Math.min(app.requestedAmount, p2pFunded);
    }

    if (
      app.status === 'APPROVED_DISBURSED' &&
      (app.scheme === 'ANUITAS_KONVENSIONAL' || app.scheme === 'MURABAHAH_MARGIN')
    ) {
      disbursedFromLosBalanceSheet += bankPortion;
      disbursedFromP2PSyndication += Math.min(app.requestedAmount, p2pFunded);
      // Risk weight (ATMR): secured SME ~75%, unsecured/low-grade ~100%
      const riskWeight = ev && ev.creditScore >= 680 ? 0.75 : 1.0;
      additionalAtmr += bankPortion * riskWeight;
      additionalEcl += ev ? ev.indicativeLossProxyAmount * (bankPortion / Math.max(1, app.requestedAmount)) : 0;
      if (app.slikKol >= 3) {
        additionalNpl += bankPortion;
      }
    }
  }

  const totalBankDisbursed = disbursedFromLosBalanceSheet + extraSimulatedDisbursement;
  const totalActiveFinancing = bank.existingLoanPortfolio + totalBankDisbursed;

  const maxAllowedFinancingByFdr = bank.dpkDeposits * (bank.maxFdrLimitPct / 100);
  const availableLiquidCash = Math.max(0, maxAllowedFinancingByFdr - totalActiveFinancing);

  const fdrLdrPct =
    bank.dpkDeposits > 0
      ? Number(((totalActiveFinancing / bank.dpkDeposits) * 100).toFixed(2))
      : 0;

  const totalRwa = Math.max(1, bank.existingRwaAtmr + additionalAtmr + extraSimulatedDisbursement * 0.85);
  const effectiveCapital = Math.max(0, bank.tier1Capital - additionalEcl);
  const carKpmmPct = Number(((effectiveCapital / totalRwa) * 100).toFixed(2));

  const bmpkMaxSingleBorrower = Math.round(bank.tier1Capital * (bank.bmpkLimitPct / 100));

  const nplGrossPct =
    totalActiveFinancing > 0
      ? Number((((bank.existingNplAmount + additionalNpl) / totalActiveFinancing) * 100).toFixed(2))
      : 0;

  const roaPct = Number((2.45 - nplGrossPct * 0.18).toFixed(2));

  return {
    bankName: bank.bankName,
    tier1Capital: bank.tier1Capital,
    dpkDeposits: bank.dpkDeposits,
    disbursedFromLosBalanceSheet: totalBankDisbursed,
    disbursedFromP2PSyndication,
    totalActiveFinancing,
    availableLiquidCash,
    fdrLdrPct,
    carKpmmPct,
    bmpkMaxSingleBorrower,
    nplGrossPct,
    roaPct,
    bopoPct: bank.bopoRatioPct,
    nimPct: bank.nimMarginPct,
  };
}


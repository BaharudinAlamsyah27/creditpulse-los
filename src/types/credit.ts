export type ThemeMode = 'cream' | 'light' | 'dark';

export type WorkspaceRole =
  | 'brochure'
  | 'borrower'
  | 'underwriter'
  | 'committee'
  | 'treasury'
  | 'admin';

export type FinancingScheme =
  | 'ANUITAS_KONVENSIONAL'
  | 'MURABAHAH_MARGIN'
  | 'MUDHARABAH_P2P'
  | 'MUSYARAKAH_P2P';

export type LoanPurpose =
  | 'MODAL_KERJA_UMKM'
  | 'EKSPANSI_CAPEX'
  | 'INVOICE_FINANCING'
  | 'MIKRO_PRODUKTIF';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDERWRITING_REVIEW'
  | 'P2P_FUNDING_OPEN'
  | 'COMMITTEE_READY'
  | 'APPROVED_PENDING_ACCEPTANCE'
  | 'OFFER_ACCEPTED'
  | 'APPROVED_DISBURSED'
  | 'P2P_FUNDS_RELEASED'
  | 'RESTRUCTURE_HOLD'
  | 'REJECTED';

export type SlikKolStatus = 1 | 2 | 3 | 4 | 5;

export type CollateralType =
  | 'SHM_TANAH_BANGUNAN'
  | 'BPKB_KENDARAAN_NIAGA'
  | 'INVENTORY_RECEIVABLE'
  | 'DEPOSITO_BACKED'
  | 'UNSECURED_CASHFLOW';

export interface MonthlyMutationRecord {
  month: string; // e.g. '2026-06'
  creditInflow: number;
  debitOutflow: number;
  endingBalance: number;
  transactionCount: number;
  roundNumberTxCount: number;
  bouncedCheckCount: number;
}

export type DocumentReviewStatus =
  | 'PENDING_REVIEW'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED_REVISION';

export interface DocumentVerification {
  id: string;
  label: string;
  code: string;
  verified: boolean;
  notes?: string;
  status?: DocumentReviewStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type DemoScenarioKey =
  | 'PRIME_COFFEE'
  | 'BORDERLINE_TEXTILE'
  | 'HIGH_RISK_CONSTRUCTION';

export interface P2PInvestorCommitment {
  id: string;
  investorName: string;
  investorType: 'DANA_PENSIUN' | 'BPRS_SYNDICATION' | 'FAMILY_OFFICE' | 'IMPACT_FUND';
  committedAmount: number;
  nisbahInvestorPct: number; // % bagi hasil ke pemodal
  timestamp: string;
}

export interface LoanApplication {
  id: string;
  submittedAt: string;
  applicantName: string;
  ownerName: string;
  npwpNik: string;
  businessSector: string;
  region: string;
  yearsInBusiness: number;
  employeeCount: number;
  purpose: LoanPurpose;
  scheme: FinancingScheme;
  requestedAmount: number;
  tenorMonths: number;
  annualRateOrMarginPct: number; // % p.a.
  nisbahBorrowerPct: number; // For Mudharabah/Musyarakah (e.g. 65% borrower : 35% investor)

  // Cash flow & Balance sheet inputs (Monthly / Current IDR)
  monthlyRevenue: number;
  monthlyCogsAndOpex: number;
  monthlyHouseholdExpense: number;
  existingMonthlyDebtService: number;
  currentAssets: number;
  currentLiabilities: number;
  totalAssets: number;
  totalLiabilities: number;
  retainedEarnings: number;

  // Collateral & Bureau
  collateralType: CollateralType;
  collateralAppraisedValue: number;
  slikKol: SlikKolStatus;
  pastArrearsDaysMax: number;

  // Forensics & Verification
  mutations: MonthlyMutationRecord[];
  documents: DocumentVerification[];

  // P2P Matching (#28)
  p2pCommitments: P2PInvestorCommitment[];

  // Workflow & Governance
  status: ApplicationStatus;
  analystNotes: string;
  committeeDecisionNote?: string;
}

export interface RiskFactorContribution {
  featureKey: string;
  featureLabel: string;
  rawValueFormatted: string;
  logOddsImpact: number; // Internal contribution used by this deterministic demo rule set
  pointsImpact: number; // Estimated points impact inside the demo score
  direction: 'RISK_DECREASING' | 'RISK_INCREASING' | 'NEUTRAL';
}

export interface MutationAnomalyFlag {
  code: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  detail: string;
  metricValue: string;
}

export interface AmortizationInstallment {
  period: number;
  openingPrincipal: number;
  principalComponent: number;
  interestOrMarginComponent: number;
  totalInstallment: number;
  closingPrincipal: number;
}

export interface CreditUnderwritingEvaluation {
  // Deterministic demo pre-screen; not a trained or validated credit model.
  creditScore: number; // Illustrative score, 300 - 850
  ratingGrade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';
  riskSignalPct: number; // Uncalibrated demo risk signal; not Probability of Default
  lgdPct: number; // Indicative collateral-loss proxy
  requestedExposureAmount: number; // Requested amount; not Exposure at Default
  indicativeLossProxyAmount: number; // Illustrative proxy; not ECL/CKPN
  indicativeRiskSpreadPct: number;
  riskFactorContributions: RiskFactorContribution[];

  // Cash-Flow & Financial Ratios (#19)
  proposedMonthlyInstallment: number;
  calculationLimitations: string[];
  netOperatingCashFlow: number;
  disposableCashFlow: number;
  dscr: number; // Debt Service Coverage Ratio (x)
  dsrPct: number; // Debt Service Ratio (%)
  netProfitMarginPct: number;
  currentRatio: number;
  ltvPct: number;
  collateralHaircutPct: number;
  collateralLiquidationValue: number;
  altmanZDoublePrime: number;
  altmanZone: 'SAFE' | 'GREY_WATCH' | 'DISTRESS';

  // Bank Statement Forensics (#19)
  mutationAvgInflow: number;
  mutationAvgOutflow: number;
  mutationNetRetentionPct: number;
  mutationVolatilityCv: number;
  anomalies: MutationAnomalyFlag[];

  // Rule-screening output; never a final approval or rejection.
  ruleScreeningResult: 'FAVORABLE_REVIEW' | 'MANUAL_REVIEW' | 'RESTRUCTURE_REVIEW' | 'UNFAVORABLE_REVIEW';
  maxRecommendedPlafond: number;
  policyBreaches: string[];
  strengths: string[];
}

export interface RiskPolicyConfig {
  minDscrPolicy: number;
  maxDsrPolicy: number;
  favorableReviewScore: number;
  windowDressingSpikeThreshold: number;
  slikAutoSync: boolean;
  dukcapilKycActive: boolean;
}

export interface InternalBankProfile {
  bankName: string;
  bankLicenseCode: string;
  tier1Capital: number; // Modal Inti Bank (IDR)
  dpkDeposits: number; // Dana Pihak Ketiga: Tabungan, Giro, Deposito (IDR)
  existingLoanPortfolio: number; // Pembiayaan eksisting di luar antrean LOS (IDR)
  existingRwaAtmr: number; // Aset Tertimbang Menurut Risiko eksisting (IDR)
  existingNplAmount: number; // Pembiayaan bermasalah eksisting (IDR)
  bopoRatioPct: number; // Biaya Operasional terhadap Pendapatan Operasional (%)
  nimMarginPct: number; // Net Interest / Imbal Hasil Margin (%)
  maxFdrLimitPct: number; // Batas atas sehat LDR/FDR internal (mis. 92%)
  minCarLimitPct: number; // Batas minimum KPMM/CAR OJK (mis. 12%)
  bmpkLimitPct: number; // Batas Maksimum Pemberian Kredit ke 1 pihak (% dari Modal Inti, mis. 20%)
}

export interface BankHealthMetrics {
  bankName: string;
  tier1Capital: number;
  dpkDeposits: number;
  disbursedFromLosBalanceSheet: number; // Porsi yang didanai kas internal bank
  disbursedFromP2PSyndication: number; // Porsi yang didanai pemodal P2P/Sindikasi
  totalActiveFinancing: number; // existingLoanPortfolio + disbursedFromLosBalanceSheet
  availableLiquidCash: number; // Kas likuid tersedia sebelum menyentuh batas FDR maksimum
  fdrLdrPct: number; // (totalActiveFinancing / dpkDeposits) * 100
  carKpmmPct: number; // ((tier1Capital - totalEcl) / totalRwaAtmr) * 100
  bmpkMaxSingleBorrower: number; // tier1Capital * (bmpkLimitPct / 100)
  nplGrossPct: number;
  roaPct: number;
  bopoPct: number;
  nimPct: number;
}

export interface GovernanceAuditEntry {
  id: string;
  timestamp: string;
  actorRole: 'BORROWER_PORTAL' | 'CREDIT_UNDERWRITER' | 'CREDIT_COMMITTEE' | 'P2P_INVESTOR_DEMO' | 'BANK_TREASURY_DEMO';
  actorName: string;
  applicationId: string;
  applicantName: string;
  actionType: string;
  summary: string;
  snapshotRiskSignalPct: number;
  snapshotDscr: number;
}

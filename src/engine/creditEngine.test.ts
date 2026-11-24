import { describe, expect, it } from 'vitest';
import {
  analyzeBankMutations,
  computeInternalBankHealth,
  DEFAULT_BANK_PROFILE,
  evaluateLoanApplication,
  generateAmortizationSchedule,
} from './creditEngine';
import { INITIAL_LOAN_APPLICATIONS } from '../data/demoApplications';

describe('CreditPulse Quantitative & ML Underwriting Engine', () => {
  it('generates exact principal amortization for both Annuity and Murabahah schemes', () => {
    const principal = 120_000_000;
    const tenor = 12;
    const rate = 12;

    const annuity = generateAmortizationSchedule(
      principal,
      tenor,
      rate,
      'ANUITAS_KONVENSIONAL'
    );
    expect(annuity).toHaveLength(12);
    const totalAnnuityPrincipal = annuity.reduce((s, r) => s + r.principalComponent, 0);
    expect(Math.round(totalAnnuityPrincipal)).toBe(principal);
    expect(annuity[11].closingPrincipal).toBeCloseTo(0, 2);

    const murabahah = generateAmortizationSchedule(
      principal,
      tenor,
      rate,
      'MURABAHAH_MARGIN'
    );
    expect(murabahah).toHaveLength(12);
    expect(murabahah[0].principalComponent).toBe(10_000_000);
    expect(murabahah[0].interestOrMarginComponent).toBe(1_200_000);
    expect(murabahah[0].totalInstallment).toBe(11_200_000);
  });

  it('correctly differentiates low-risk prime SME from high-risk anomaly SME', () => {
    const primeApp = INITIAL_LOAN_APPLICATIONS[0];
    const riskyApp = INITIAL_LOAN_APPLICATIONS.find((a) => a.slikKol >= 3)!;

    const primeEval = evaluateLoanApplication(primeApp);
    const riskyEval = evaluateLoanApplication(riskyApp);

    expect(primeEval.creditScore).toBeGreaterThan(700);
    expect(primeEval.riskSignalPct).toBeLessThan(5);
    expect(primeEval.dscr).toBeGreaterThanOrEqual(1.25);
    expect(primeEval.ruleScreeningResult).toBe('FAVORABLE_REVIEW');

    expect(riskyEval.creditScore).toBeLessThan(520);
    expect(riskyEval.riskSignalPct).toBeGreaterThan(25);
    expect(riskyEval.ruleScreeningResult).toBe('UNFAVORABLE_REVIEW');
    expect(riskyEval.policyBreaches.length).toBeGreaterThan(0);
  });

  it('detects bank statement window dressing and bounced checks accurately', () => {
    const anomalyApp = INITIAL_LOAN_APPLICATIONS.find((a) =>
      a.mutations.some((m) => m.bouncedCheckCount > 0)
    )!;
    const forensics = analyzeBankMutations(anomalyApp.mutations);

    expect(forensics.totalBouncedChecks).toBeGreaterThan(0);
    expect(
      forensics.anomalies.some((a) => a.code === 'NSF_BOUNCED_CLEARING')
    ).toBe(true);
  });

  it('tracks internal bank liquidity (DPK, FDR, CAR, BMPK) dynamically upon disbursement', () => {
    const evals: Record<string, ReturnType<typeof evaluateLoanApplication>> = {};
    for (const app of INITIAL_LOAN_APPLICATIONS) {
      evals[app.id] = evaluateLoanApplication(app);
    }

    const baseHealth = computeInternalBankHealth(
      DEFAULT_BANK_PROFILE,
      INITIAL_LOAN_APPLICATIONS,
      evals,
      0
    );
    const stressedHealth = computeInternalBankHealth(
      DEFAULT_BANK_PROFILE,
      INITIAL_LOAN_APPLICATIONS,
      evals,
      500_000_000
    );

    expect(baseHealth.bmpkMaxSingleBorrower).toBe(700_000_000);
    expect(stressedHealth.availableLiquidCash).toBeLessThan(
      baseHealth.availableLiquidCash
    );
    expect(stressedHealth.fdrLdrPct).toBeGreaterThan(baseHealth.fdrLdrPct);
  });
});

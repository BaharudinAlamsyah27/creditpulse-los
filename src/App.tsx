import React, { useEffect, useMemo, useState } from 'react';
import {
  ApplicationStatus,
  CreditUnderwritingEvaluation,
  DemoScenarioKey,
  DocumentReviewStatus,
  GovernanceAuditEntry,
  InternalBankProfile,
  LoanApplication,
  RiskPolicyConfig,
  ThemeMode,
  WorkspaceRole,
} from './types/credit';
import {
  DEMO_SCENARIO_PRESETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_LOAN_APPLICATIONS,
  INSTITUTIONAL_INVESTOR_POOLS,
} from './data/demoApplications';
import {
  computeInternalBankHealth,
  DEFAULT_BANK_PROFILE,
  DEFAULT_RISK_POLICY,
  evaluateLoanApplication,
  formatIDR,
} from './engine/creditEngine';
import { AdminSidebar, AdminTopbar } from './components/HeaderBar';
import { LandingBrochure } from './components/LandingBrochure';
import { BorrowerPortal } from './components/BorrowerPortal';
import { UnderwriterPortal } from './components/UnderwriterPortal';
import { CommitteePortal } from './components/CommitteePortal';
import { BankTreasuryPortal } from './components/BankTreasuryPortal';
import { AdminSettingsPortal } from './components/AdminSettingsPortal';
import {
  OfficialDocType,
  OfficialDocumentModal,
} from './components/OfficialDocumentModal';

const STORAGE_KEY_APPS = 'creditpulse_los_apps_v2';
const STORAGE_KEY_AUDIT = 'creditpulse_los_audit_v2';
const STORAGE_KEY_THEME = 'creditpulse_los_theme_v2';

const formatJakartaTimestamp = () =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'cream' || saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'cream';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeRole, setActiveRole] = useState<WorkspaceRole>('brochure');

  const [applications, setApplications] = useState<LoanApplication[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_APPS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((app: LoanApplication) => {
            const isP2PScheme =
              app.scheme === 'MUDHARABAH_P2P' || app.scheme === 'MUSYARAKAH_P2P';
            if (!isP2PScheme) return { ...app, p2pCommitments: [] };
            const p2pCommitments = app.p2pCommitments.map((commitment) => {
              const normalized = { ...commitment } as typeof commitment & {
                expectedYieldAnnualPct?: number;
              };
              delete normalized.expectedYieldAnnualPct;
              return normalized;
            });
            return { ...app, p2pCommitments };
          });
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_LOAN_APPLICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<GovernanceAuditEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [selectedAppId, setSelectedAppId] = useState<string>(
    INITIAL_LOAN_APPLICATIONS[0].id
  );
  const [riskPolicy, setRiskPolicy] = useState<RiskPolicyConfig>(
    DEFAULT_RISK_POLICY
  );
  const [bankProfile, setBankProfile] = useState<InternalBankProfile>(
    DEFAULT_BANK_PROFILE
  );
  const [officialDocModalOpen, setOfficialDocModalOpen] = useState(false);
  const [officialDocType, setOfficialDocType] =
    useState<OfficialDocType>('MAK_CREDIT_MEMO');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(applications));
    } catch {
      // Ignore
    }
  }, [applications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));
    } catch {
      // Ignore
    }
  }, [auditLogs]);

  const evaluations: Record<string, CreditUnderwritingEvaluation> = useMemo(() => {
    const map: Record<string, CreditUnderwritingEvaluation> = {};
    for (const app of applications) {
      map[app.id] = evaluateLoanApplication(app, riskPolicy);
    }
    return map;
  }, [applications, riskPolicy]);

  const bankHealth = useMemo(
    () => computeInternalBankHealth(bankProfile, applications, evaluations, 0),
    [bankProfile, applications, evaluations]
  );

  const committeeReadyCount = useMemo(
    () => applications.filter((a) => a.status === 'COMMITTEE_READY').length,
    [applications]
  );

  const anomalyAppsCount = useMemo(
    () =>
      applications.filter((a) => (evaluations[a.id]?.anomalies.length ?? 0) > 0)
        .length,
    [applications, evaluations]
  );

  const appendAuditLog = (
    entry: Omit<GovernanceAuditEntry, 'id' | 'timestamp'>
  ) => {
    const nextId = `AUD-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
    const newEntry: GovernanceAuditEntry = {
      ...entry,
      id: nextId,
      timestamp: formatJakartaTimestamp(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const handleNavigateRole = (role: WorkspaceRole, targetAppId?: string) => {
    if (targetAppId) {
      setSelectedAppId(targetAppId);
    }
    setActiveRole(role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateApplication = (newApp: LoanApplication) => {
    const ev = evaluateLoanApplication(newApp);
    setApplications((prev) => [newApp, ...prev]);
    setSelectedAppId(newApp.id);
    appendAuditLog({
      actorRole: 'BORROWER_PORTAL',
      actorName: `Debitur demo: ${newApp.applicantName}`,
      applicationId: newApp.id,
      applicantName: newApp.applicantName,
      actionType: 'NEW_LOAN_ORIGINATION',
      summary: `Pengajuan baru ${newApp.scheme} sebesar ${formatIDR(
        newApp.requestedAmount
      )} (${newApp.tenorMonths} bln). Skor pra-screening aturan demo: ${ev.creditScore} (${
        ev.ratingGrade
      }).`,
      snapshotRiskSignalPct: ev.riskSignalPct,
      snapshotDscr: ev.dscr,
    });
  };

  const handleToggleDocumentVerified = (appId: string, docId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        return {
          ...app,
          documents: app.documents.map((d) =>
            d.id === docId ? { ...d, verified: !d.verified } : d
          ),
        };
      })
    );
  };

  const handleUpdateDocumentStatus = (
    appId: string,
    docId: string,
    status: DocumentReviewStatus,
    notes?: string
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        return {
          ...app,
          documents: app.documents.map((d) => {
            if (d.id !== docId) return d;
            return {
              ...d,
              verified: status === 'VERIFIED',
              status,
              reviewNotes: notes !== undefined ? notes : d.reviewNotes,
              reviewedBy: 'R. Aditya Pratama, CFA (Analis Demo)',
              reviewedAt: new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'short',
                timeStyle: 'medium',
                timeZone: 'Asia/Jakarta',
              }).format(new Date()),
            };
          }),
        };
      })
    );

    const targetApp = applications.find((a) => a.id === appId);
    const targetDoc = targetApp?.documents.find((d) => d.id === docId);
    appendAuditLog({
      actorRole: 'CREDIT_UNDERWRITER',
      actorName: 'R. Aditya Pratama, CFA (Analis Demo)',
      applicationId: appId,
      applicantName: targetApp?.applicantName ?? 'Debitur',
      actionType: `DOC_${status}`,
      summary: `Status dokumen [${targetDoc?.code || docId}] diubah menjadi ${status}. ${
        notes ? `Catatan: "${notes}"` : ''
      }`,
      snapshotRiskSignalPct: evaluations[appId]?.riskSignalPct ?? 0,
      snapshotDscr: evaluations[appId]?.dscr ?? 0,
    });
  };

  const handleSelectScenarioPreset = (presetKey: DemoScenarioKey) => {
    const preset = DEMO_SCENARIO_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;

    const baselineApp = INITIAL_LOAN_APPLICATIONS.find((a) => a.id === preset.appId);
    if (baselineApp) {
      setApplications((prev) => {
        const exists = prev.some((a) => a.id === baselineApp.id);
        if (exists) {
          return prev.map((a) => (a.id === baselineApp.id ? { ...baselineApp } : a));
        }
        return [baselineApp, ...prev];
      });
    }

    setSelectedAppId(preset.appId);
    setActiveRole('underwriter');

    appendAuditLog({
      actorRole: 'CREDIT_UNDERWRITER',
      actorName: 'R. Aditya Pratama, CFA (Analis Demo)',
      applicationId: preset.appId,
      applicantName: preset.name,
      actionType: 'LOAD_SCENARIO_PRESET',
      summary: `Memuat paket skenario demo "${preset.badgeLabel}": ${preset.summary}`,
      snapshotRiskSignalPct: evaluations[preset.appId]?.riskSignalPct ?? 0,
      snapshotDscr: evaluations[preset.appId]?.dscr ?? 0,
    });
  };

  const handleUpdateApplicationParams = (
    appId: string,
    updates: Partial<LoanApplication>,
    auditSummary: string
  ) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;
    const updatedApp = { ...targetApp, ...updates };
    const ev = evaluateLoanApplication(updatedApp);

    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? updatedApp : app))
    );

    appendAuditLog({
      actorRole: 'CREDIT_UNDERWRITER',
      actorName: 'Analis Risiko Senior — R. Aditya Pratama, CFA',
      applicationId: appId,
      applicantName: targetApp.applicantName,
      actionType: 'UNDERWRITING_RESTRUCTURE',
      summary: auditSummary,
      snapshotRiskSignalPct: ev.riskSignalPct,
      snapshotDscr: ev.dscr,
    });
  };

  const handleForwardToStatus = (
    appId: string,
    newStatus: ApplicationStatus,
    note: string
  ) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;
    const ev = evaluations[appId];

    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              status: newStatus,
              analystNotes: note,
            }
          : app
      )
    );

    appendAuditLog({
      actorRole: 'CREDIT_UNDERWRITER',
      actorName: 'Analis Risiko Senior — R. Aditya Pratama, CFA',
      applicationId: appId,
      applicantName: targetApp.applicantName,
      actionType: `STATUS_CHANGED_TO_${newStatus}`,
      summary: note,
      snapshotRiskSignalPct: ev.riskSignalPct,
      snapshotDscr: ev.dscr,
    });
  };

  const handleBatchCommitteeDecision = (
    appIds: string[],
    decision: ApplicationStatus,
    committeeNote: string
  ) => {
    const eligibleIds = new Set(
      applications
        .filter((app) => appIds.includes(app.id) && app.status === 'COMMITTEE_READY')
        .map((app) => app.id)
    );
    if (eligibleIds.size === 0) return;

    setApplications((prev) =>
      prev.map((app) =>
        eligibleIds.has(app.id)
          ? {
              ...app,
              status: decision,
              committeeDecisionNote: committeeNote,
            }
          : app
      )
    );

    eligibleIds.forEach((id) => {
      const app = applications.find((a) => a.id === id);
      const ev = evaluations[id];
      if (!app || !ev) return;
      appendAuditLog({
        actorRole: 'CREDIT_COMMITTEE',
        actorName: 'Komite demo',
        applicationId: id,
        applicantName: app.applicantName,
        actionType: `BATCH_${decision}`,
        summary: `${committeeNote} (Plafon ${formatIDR(app.requestedAmount)}, Rating demo ${
          ev.ratingGrade
        })`,
        snapshotRiskSignalPct: ev.riskSignalPct,
        snapshotDscr: ev.dscr,
      });
    });
  };

  const handleSimulateOfferAcceptance = (appId: string) => {
    const targetApp = applications.find((app) => app.id === appId);
    if (!targetApp || targetApp.status !== 'APPROVED_PENDING_ACCEPTANCE') return;
    const isProfitSharingScheme =
      targetApp.scheme === 'MUDHARABAH_P2P' || targetApp.scheme === 'MUSYARAKAH_P2P';
    const committedAmount = targetApp.p2pCommitments.reduce(
      (sum, commitment) => sum + commitment.committedAmount,
      0
    );
    if (isProfitSharingScheme && committedAmount < targetApp.requestedAmount) return;
    const ev = evaluations[appId];

    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, status: 'OFFER_ACCEPTED' } : app
      )
    );
    appendAuditLog({
      actorRole: 'BORROWER_PORTAL',
      actorName: `Debitur demo: ${targetApp.applicantName}`,
      applicationId: appId,
      applicantName: targetApp.applicantName,
      actionType: 'DEMO_OFFER_ACCEPTED',
      summary: 'Penerimaan penawaran dicatat sebagai simulasi demo.',
      snapshotRiskSignalPct: ev.riskSignalPct,
      snapshotDscr: ev.dscr,
    });
  };

  const handleSimulateDisbursement = (appId: string) => {
    const targetApp = applications.find((app) => app.id === appId);
    if (
      !targetApp ||
      targetApp.status !== 'OFFER_ACCEPTED' ||
      targetApp.scheme === 'MUDHARABAH_P2P' ||
      targetApp.scheme === 'MUSYARAKAH_P2P'
    ) return;
    const ev = evaluations[appId];

    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, status: 'APPROVED_DISBURSED' } : app
      )
    );
    appendAuditLog({
      actorRole: 'BANK_TREASURY_DEMO',
      actorName: 'Treasury demo',
      applicationId: appId,
      applicantName: targetApp.applicantName,
      actionType: 'DEMO_DISBURSEMENT',
      summary: 'Pencairan demo dicatat secara lokal; tidak ada dana yang ditransfer.',
      snapshotRiskSignalPct: ev.riskSignalPct,
      snapshotDscr: ev.dscr,
    });
  };

  const handleSimulateP2PRelease = (appId: string) => {
    const targetApp = applications.find((app) => app.id === appId);
    if (
      !targetApp ||
      targetApp.status !== 'OFFER_ACCEPTED' ||
      (targetApp.scheme !== 'MUDHARABAH_P2P' && targetApp.scheme !== 'MUSYARAKAH_P2P')
    ) return;
    const committedAmount = targetApp.p2pCommitments.reduce(
      (sum, commitment) => sum + commitment.committedAmount,
      0
    );
    if (committedAmount < targetApp.requestedAmount) return;
    const ev = evaluations[appId];

    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, status: 'P2P_FUNDS_RELEASED' } : app
      )
    );
    appendAuditLog({
      actorRole: 'P2P_INVESTOR_DEMO',
      actorName: 'Operasional pool investor demo',
      applicationId: appId,
      applicantName: targetApp.applicantName,
      actionType: 'P2P_DEMO_FUNDS_RELEASED',
      summary: `Pelepasan dana demo tercatat setelah komitmen investor mencapai ${formatIDR(committedAmount)}; tidak ada transfer dana.`,
      snapshotRiskSignalPct: ev.riskSignalPct,
      snapshotDscr: ev.dscr,
    });
  };

  const handleAllocateP2PFunding = (
    appId: string,
    investorPoolId: string,
    amount: number
  ) => {
    const targetApp = applications.find((a) => a.id === appId);
    const pool = INSTITUTIONAL_INVESTOR_POOLS.find((p) => p.id === investorPoolId);
    if (
      !targetApp ||
      !pool ||
      amount < 10_000_000 ||
      (targetApp.scheme !== 'MUDHARABAH_P2P' && targetApp.scheme !== 'MUSYARAKAH_P2P')
    ) return;

    const ev = evaluations[appId];
    if (!ev) return;
    const ratingRank = { AAA: 0, AA: 1, A: 2, BBB: 3, BB: 4, B: 5, CCC: 6, D: 7 } as const;
    if (ratingRank[ev.ratingGrade] > ratingRank[pool.minRatingGrade]) return;

    const currentCommitted = targetApp.p2pCommitments.reduce(
      (s, c) => s + c.committedAmount,
      0
    );
    const poolCommitted = applications.reduce(
      (sum, app) =>
      sum + app.p2pCommitments
        .filter(() => app.scheme === 'MUDHARABAH_P2P' || app.scheme === 'MUSYARAKAH_P2P')
          .filter((commitment) => commitment.investorName === pool.name)
          .reduce((appSum, commitment) => appSum + commitment.committedAmount, 0),
      0
    );
    const maxAllocatable = Math.max(
      0,
      Math.min(
        targetApp.requestedAmount - currentCommitted,
        pool.availableLiquidity - poolCommitted
      )
    );
    if (amount > maxAllocatable) return;

    const newCommitment = {
      id: `P2P-C${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      investorName: pool.name,
      investorType: pool.investorType,
      committedAmount: amount,
      nisbahInvestorPct: 100 - targetApp.nisbahBorrowerPct,
      timestamp: formatJakartaTimestamp(),
    };
    const isNowFull = currentCommitted + amount >= targetApp.requestedAmount;

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        return {
          ...app,
          status:
            isNowFull && app.status === 'P2P_FUNDING_OPEN'
              ? 'COMMITTEE_READY'
              : app.status,
          p2pCommitments: [...app.p2pCommitments, newCommitment],
        };
      })
    );

    appendAuditLog({
      actorRole: 'P2P_INVESTOR_DEMO',
      actorName: pool.name,
      applicationId: appId,
      applicantName: targetApp.applicantName,
      actionType: isNowFull ? 'P2P_DEMO_100PCT_READY' : 'P2P_DEMO_ALLOCATION',
      summary: `Komitmen pendanaan ${formatIDR(amount)} tercatat di pool investor simulasi (${
        targetApp.scheme
      }). ${isNowFull ? 'Target demo terpenuhi, status naik ke COMMITTEE_READY.' : ''}`,
      snapshotRiskSignalPct: ev.riskSignalPct,
      snapshotDscr: ev.dscr,
    });
  };

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY_APPS);
    localStorage.removeItem(STORAGE_KEY_AUDIT);
    setApplications(INITIAL_LOAN_APPLICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSelectedAppId(INITIAL_LOAN_APPLICATIONS[0].id);
  };

  if (activeRole === 'brochure') {
    return (
      <LandingBrochure
        applications={applications}
        evaluations={evaluations}
        onNavigateRole={handleNavigateRole}
        theme={theme}
        onSelectTheme={setTheme}
      />
    );
  }

  return (
    <div className="adminlte-wrapper">
      <AdminSidebar
        activeRole={activeRole}
        onSelectRole={(role) => handleNavigateRole(role)}
        collapsed={sidebarCollapsed}
        totalApplications={applications.length}
        committeeReadyCount={committeeReadyCount}
        anomalyAppsCount={anomalyAppsCount}
      />

      <div className="adminlte-main">
        <AdminTopbar
          activeRole={activeRole}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onNavigateRole={(role) => handleNavigateRole(role)}
          onOpenOfficialDoc={() => {
            if (activeRole === 'borrower') {
              setOfficialDocType('SP3K_OFFERING');
            } else if (activeRole === 'committee' || activeRole === 'treasury') {
              setOfficialDocType('ALCO_COMMITTEE_PACK');
            } else {
              setOfficialDocType('MAK_CREDIT_MEMO');
            }
            setOfficialDocModalOpen(true);
          }}
          theme={theme}
          onSelectTheme={setTheme}
          bankHealth={bankHealth}
          onResetDemo={handleResetDemo}
          onSelectScenarioPreset={handleSelectScenarioPreset}
        />

        <main style={{ flex: 1 }}>
          <div style={{ margin: '1rem 2rem 0', padding: '0.75rem 1rem', border: '1px solid var(--status-warn)', borderRadius: '8px', background: 'var(--status-warn-bg)', color: 'var(--text-primary)', fontSize: '0.82rem' }}>
            <strong>Prototipe demo:</strong> data sintetis, perhitungan aturan lokal, dan status tersimpan di browser. Tidak ada autentikasi, koneksi regulator, rekening, atau perpindahan dana.
          </div>
          {activeRole === 'borrower' && (
            <BorrowerPortal
              applications={applications}
              evaluations={evaluations}
              riskPolicy={riskPolicy}
              onCreateApplication={handleCreateApplication}
              onSimulateOfferAcceptance={handleSimulateOfferAcceptance}
              onInspectInUnderwriter={(appId) =>
                handleNavigateRole('underwriter', appId)
              }
            />
          )}

          {activeRole === 'underwriter' && (
            <UnderwriterPortal
              applications={applications}
              evaluations={evaluations}
              riskPolicy={riskPolicy}
              selectedAppId={selectedAppId}
              onSelectAppId={setSelectedAppId}
              onToggleDocumentVerified={handleToggleDocumentVerified}
              onUpdateDocumentStatus={handleUpdateDocumentStatus}
              onUpdateApplicationParams={handleUpdateApplicationParams}
              onForwardToStatus={handleForwardToStatus}
              onOpenOfficialMemo={() => {
                setOfficialDocType('MAK_CREDIT_MEMO');
                setOfficialDocModalOpen(true);
              }}
              onSelectScenarioPreset={handleSelectScenarioPreset}
              auditLogs={auditLogs}
              onAddReviewComment={(appId, reviewerName, actionType, comment) => {
                const targetApp = applications.find((a) => a.id === appId);
                appendAuditLog({
                  actorRole: reviewerName.includes('Komite')
                    ? 'CREDIT_COMMITTEE'
                    : 'CREDIT_UNDERWRITER',
                  actorName: reviewerName,
                  applicationId: appId,
                  applicantName: targetApp?.applicantName ?? 'Debitur',
                  actionType,
                  summary: comment,
                  snapshotRiskSignalPct: evaluations[appId]?.riskSignalPct ?? 0,
                  snapshotDscr: evaluations[appId]?.dscr ?? 0,
                });
              }}
            />
          )}

          {activeRole === 'committee' && (
            <CommitteePortal
              applications={applications}
              evaluations={evaluations}
              bankProfile={bankProfile}
              bankHealth={bankHealth}
              auditLogs={auditLogs}
              onBatchCommitteeDecision={handleBatchCommitteeDecision}
              onAllocateP2PFunding={handleAllocateP2PFunding}
              onSimulateP2PRelease={handleSimulateP2PRelease}
              onInspectInUnderwriter={(appId) =>
                handleNavigateRole('underwriter', appId)
              }
            />
          )}

          {activeRole === 'treasury' && (
            <BankTreasuryPortal
              applications={applications}
              evaluations={evaluations}
              bankProfile={bankProfile}
              bankHealth={bankHealth}
              onUpdateBankProfile={setBankProfile}
              onSimulateDisbursement={handleSimulateDisbursement}
              onInspectInUnderwriter={(appId) =>
                handleNavigateRole('underwriter', appId)
              }
            />
          )}

          {activeRole === 'admin' && (
            <AdminSettingsPortal
              applications={applications}
              auditLogs={auditLogs}
              riskPolicy={riskPolicy}
              onUpdateRiskPolicy={(nextPolicy) => {
                setRiskPolicy(nextPolicy);
                appendAuditLog({
                  actorRole: 'CREDIT_COMMITTEE',
                  actorName: 'Administrator Sistem — Fajar Nugroho',
                  applicationId: 'SYS-POLICY',
                  applicantName: 'Kebijakan Risiko Global',
                  actionType: 'RISK_POLICY_UPDATED',
                  summary: `Parameter aturan demo diperbarui: Min DSCR ${nextPolicy.minDscrPolicy}x, beban utang/omzet maks. ${nextPolicy.maxDsrPolicy}%, ambang hasil favorable ${nextPolicy.favorableReviewScore}.`,
                  snapshotRiskSignalPct: 0,
                  snapshotDscr: nextPolicy.minDscrPolicy,
                });
              }}
              bankProfile={bankProfile}
              onUpdateBankProfile={(nextBank) => {
                setBankProfile(nextBank);
              }}
              onResetDemo={handleResetDemo}
            />
          )}
        </main>

        <footer
          style={{
            padding: '0.9rem 2rem',
            borderTop: '1px solid var(--border-card)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <strong>CreditPulse / CrediVault</strong> — prototipe demo origination dan underwriting UMKM.
          </div>
          <div>
            Skenario bank dan investor dipisahkan • Data sintetis
          </div>
        </footer>

        {officialDocModalOpen && (
          <OfficialDocumentModal
            docType={officialDocType}
            onClose={() => setOfficialDocModalOpen(false)}
            onChangeDocType={setOfficialDocType}
            selectedApp={
              applications.find((a) => a.id === selectedAppId) || applications[0]
            }
            evaluation={
              evaluations[selectedAppId] || evaluations[applications[0].id]
            }
            allApplications={applications}
            allEvaluations={evaluations}
            bankProfile={bankProfile}
            bankHealth={bankHealth}
          />
        )}
      </div>
    </div>
  );
};

export default App;

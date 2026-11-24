import React, { useState } from 'react';
import {
  GovernanceAuditEntry,
  InternalBankProfile,
  LoanApplication,
  RiskPolicyConfig,
} from '../types/credit';
import { formatCompactIDR, formatIDR } from '../engine/creditEngine';
import { HelpTip } from './HelpTip';

interface AdminSettingsPortalProps {
  applications: LoanApplication[];
  auditLogs: GovernanceAuditEntry[];
  riskPolicy: RiskPolicyConfig;
  onUpdateRiskPolicy: (nextPolicy: RiskPolicyConfig) => void;
  bankProfile: InternalBankProfile;
  onUpdateBankProfile: (nextBank: InternalBankProfile) => void;
  onResetDemo: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  roleTitle: string;
  department: string;
  accessLevel: string;
  status: 'AKTIF' | 'CUTI';
  lastLogin: string;
}

export const AdminSettingsPortal: React.FC<AdminSettingsPortalProps> = ({
  applications,
  auditLogs,
  riskPolicy,
  onUpdateRiskPolicy,
  bankProfile,
  onUpdateBankProfile,
  onResetDemo,
}) => {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'USR-01',
      name: 'R. Aditya Pratama, CFA',
      roleTitle: 'Lead Credit Analyst & Underwriter',
      department: 'Divisi Risiko Kredit UMKM',
      accessLevel: 'UNDERWRITER_FULL',
      status: 'AKTIF',
      lastLogin: 'Hari ini, 13:45 WIB',
    },
    {
      id: 'USR-02',
      name: 'H. Prabowo Suryo, SE., MM.',
      roleTitle: 'Ketua Komite Kredit Eksekutif',
      department: 'Komite Kredit & Pembiayaan',
      accessLevel: 'COMMITTEE_APPROVER',
      status: 'AKTIF',
      lastLogin: 'Hari ini, 13:20 WIB',
    },
    {
      id: 'USR-03',
      name: 'Dra. Meutia Rahmawati, Ak.',
      roleTitle: 'Kepala Audit Internal & Kepatuhan OJK',
      department: 'Satuan Kerja Audit Intern (SKAI)',
      accessLevel: 'GOVERNANCE_AUDITOR',
      status: 'AKTIF',
      lastLogin: 'Hari ini, 11:10 WIB',
    },
    {
      id: 'USR-04',
      name: 'Fajar Nugroho, S.Kom',
      roleTitle: 'Administrator Sistem & Data Scientist',
      department: 'IT Core Banking & ML Ops',
      accessLevel: 'SUPER_ADMIN',
      status: 'AKTIF',
      lastLogin: 'Sedang Online',
    },
  ]);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Credit Officer Regional');
  const [newMemberAccess, setNewMemberAccess] = useState('UNDERWRITER_FULL');

  const [draftPolicy, setDraftPolicy] = useState<RiskPolicyConfig>(riskPolicy);
  const [draftBank, setDraftBank] = useState<InternalBankProfile>(bankProfile);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterActor, setLogFilterActor] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchActor = logFilterActor === 'ALL' || log.actorRole === logFilterActor;
    const q = logSearchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      log.applicantName.toLowerCase().includes(q) ||
      log.applicationId.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      log.summary.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q);
    return matchActor && matchSearch;
  });

  const handleExportAuditCsv = () => {
    const headers = [
      'Event_ID',
      'Waktu_WIB',
      'Peran_Aktor',
      'Nama_Aktor',
      'ID_Aplikasi',
      'Nama_Debitur',
      'Jenis_Aksi',
      'Ringkasan',
      'Sinyal_Risiko_Pct',
      'Snapshot_DSCR',
      'Sumber_Data',
    ];
    const rows = filteredLogs.map((log) =>
      [
        log.id,
        `"${log.timestamp}"`,
        log.actorRole,
        `"${log.actorName}"`,
        log.applicationId,
        `"${log.applicantName.replace(/"/g, '""')}"`,
        log.actionType,
        `"${log.summary.replace(/"/g, '""')}"`,
        log.snapshotRiskSignalPct,
        log.snapshotDscr,
        '"DATA_SINTETIS_DEMO_LOKAL"',
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Log_Demo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAuditJson = () => {
    const data = {
      disclaimer:
        'Catatan Demo Lokal - Seluruh Data Bersifat Sintetis untuk Kebutuhan Simulasi Portofolio',
      exportedAt: new Date().toISOString(),
      totalEntries: filteredLogs.length,
      logs: filteredLogs,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Log_Demo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const next: TeamMember = {
      id: `USR-0${members.length + 1}`,
      name: newMemberName.trim(),
      roleTitle: newMemberRole,
      department: 'Operasional Kredit',
      accessLevel: newMemberAccess,
      status: 'AKTIF',
      lastLogin: 'Baru ditambahkan',
    };
    setMembers((prev) => [...prev, next]);
    setNewMemberName('');
    setSavedNotice(`Anggota baru "${next.name}" berhasil ditambahkan ke daftar akses portal.`);
  };

  const handleSaveSettings = () => {
    onUpdateRiskPolicy(draftPolicy);
    onUpdateBankProfile(draftBank);
    setSavedNotice(
      `Konfigurasi parameter risiko & Neraca Bank (DPK ${formatCompactIDR(
        draftBank.dpkDeposits
      )}, Modal Inti ${formatCompactIDR(
        draftBank.tier1Capital
      )}, Min DSCR ${draftPolicy.minDscrPolicy}x) berhasil diterapkan.`
    );
  };

  const totalExposure = applications.reduce((s, a) => s + a.requestedAmount, 0);

  return (
    <>
      <div className="adminlte-content-header">
        <div>
          <span className="swiss-kicker">
            PORTAL ADMINISTRATOR, MANAJEMEN ANGGOTA &amp; PENGATURAN SISTEM
          </span>
          <h1 style={{ fontSize: '1.6rem', marginTop: '0.2rem' }}>
            Pengaturan Pra-Screening dan Profil Demo
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveSettings}
          >
            Simpan Parameter Aturan Demo
          </button>
          <button type="button" className="btn" onClick={onResetDemo}>
            Reset Seluruh Data Demo
          </button>
        </div>
      </div>

      <div className="adminlte-content">
        {savedNotice && (
          <div
            role="status"
            style={{
              padding: '0.95rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: 'var(--status-safe-bg)',
              color: 'var(--status-safe)',
              border: '1px solid var(--status-safe)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 600,
            }}
          >
            <span>{savedNotice}</span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setSavedNotice(null)}
            >
              Tutup
            </button>
          </div>
        )}

        <section className="adminlte-kpi-grid">
          <div className="small-box">
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial">{members.length}</div>
                <div className="small-box-label">Pejabat &amp; Anggota Terdaftar</div>
              </div>
              <div
                className="small-box-icon"
                style={{ backgroundColor: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <div className="small-box-footer">
              <span>Peran navigasi demo</span>
              <span>Tanpa autentikasi</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial">{riskPolicy.minDscrPolicy}x</div>
                <div className="small-box-label">Ambang Minimum DSCR Aktif</div>
              </div>
              <div
                className="small-box-icon"
                style={{ backgroundColor: 'var(--accent-info-soft)', color: 'var(--accent-info)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4" />
                </svg>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Batas demo: {riskPolicy.maxDsrPolicy}%</span>
              <span>Ambang hasil favorable: {riskPolicy.favorableReviewScore}</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial">{auditLogs.length}</div>
                <div className="small-box-label">Rekaman Jejak Audit Sistem</div>
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
            <div className="small-box-footer">
              <span>Riwayat demo lokal</span>
              <span>Browser ini saja</span>
            </div>
          </div>

          <div className="small-box">
            <div className="small-box-inner">
              <div>
                <div className="small-box-value num-financial" style={{ color: 'var(--status-safe)' }}>
                  Belum tersedia
                </div>
                <div className="small-box-label">Backend / model terlatih</div>
              </div>
              <div
                className="small-box-icon"
                style={{ backgroundColor: 'var(--status-safe-bg)', color: 'var(--status-safe)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
            </div>
            <div className="small-box-footer num-financial">
              <span>Volume: {formatIDR(totalExposure)}</span>
            </div>
          </div>
        </section>

        <div className="row-7-5">
          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  Manajemen Anggota &amp; Hak Akses Operasional (Role-Based Access)
                </div>
                <div className="adminlte-card-subtitle">
                  Daftar analis kredit, pejabat komite, dan auditor internal yang memiliki otorisasi portal
                </div>
              </div>
              <HelpTip
                title="Manajemen Anggota & Otorisasi Peran"
                description="Kelola daftar pejabat bank yang memiliki akses ke masing-masing meja kerja (Credit Analyst, Komite Kredit, Auditor SKAI, atau Super Admin)."
                steps={[
                  'Periksa daftar pejabat aktif beserta waktu login terakhir.',
                  'Gunakan baris input di bagian bawah tabel untuk menambahkan anggota tim baru.',
                ]}
              />
            </div>

            <div className="table-wrap">
              <table className="swiss-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama Pejabat / Anggota</th>
                    <th>Jabatan &amp; Unit Kerja</th>
                    <th>Level Akses</th>
                    <th className="text-center">Status</th>
                    <th>Aktivitas Terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="font-mono-code" style={{ fontWeight: 700 }}>{m.id}</td>
                      <td style={{ fontWeight: 700 }}>{m.name}</td>
                      <td>
                        <div>{m.roleTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {m.department}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info font-mono-code">{m.accessLevel}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-safe">{m.status}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {m.lastLogin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form
              onSubmit={handleAddMember}
              className="adminlte-card-footer"
              style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: '0.75rem' }}
            >
              <input
                type="text"
                className="form-control"
                placeholder="Nama lengkap anggota baru..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                required
              />
              <input
                type="text"
                className="form-control"
                placeholder="Jabatan..."
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
              />
              <select
                className="form-control"
                value={newMemberAccess}
                onChange={(e) => setNewMemberAccess(e.target.value)}
              >
                <option value="UNDERWRITER_FULL">UNDERWRITER_FULL</option>
                <option value="COMMITTEE_APPROVER">COMMITTEE_APPROVER</option>
                <option value="GOVERNANCE_AUDITOR">GOVERNANCE_AUDITOR</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
              <button type="submit" className="btn btn-primary">
                + Tambah Anggota
              </button>
            </form>
          </div>

          <div className="adminlte-card">
            <div className="adminlte-card-header">
              <div>
                <div className="adminlte-card-title">
                  Konfigurasi Kebijakan Pra-Screening Demo
                </div>
                <div className="adminlte-card-subtitle">
                  Perubahan disimpan di browser ini dan memengaruhi aturan pra-screening demo.
                </div>
              </div>
              <HelpTip
                title="Parameter Aturan Demo"
                description="Parameter lokal mengubah hasil aturan deterministik di browser. Hasil tidak disetujui otomatis dan bukan keputusan kredit."
                steps={[
                  'Atur batas DSCR dan rasio beban utang terhadap omzet untuk simulasi.',
                  'Atur ambang untuk hasil pra-screening favorable dan sensitivitas anomali mutasi sintetis.',
                  'Klik "Terapkan Parameter" untuk menyinkronkan ke seluruh portal.',
                ]}
              />
            </div>

            <div className="adminlte-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="row-2-col" style={{ gap: '0.9rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="cfg-dscr">
                    Minimum DSCR Wajib (x)
                  </label>
                  <input
                    id="cfg-dscr"
                    type="number"
                    step={0.05}
                    className="form-control num-financial"
                    value={draftPolicy.minDscrPolicy}
                    onChange={(e) =>
                      setDraftPolicy((p) => ({
                        ...p,
                        minDscrPolicy: Number(e.target.value) || 1.0,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cfg-dsr">
                    Batas demo beban utang/omzet (%)
                  </label>
                  <input
                    id="cfg-dsr"
                    type="number"
                    step={1}
                    className="form-control num-financial"
                    value={draftPolicy.maxDsrPolicy}
                    onChange={(e) =>
                      setDraftPolicy((p) => ({
                        ...p,
                        maxDsrPolicy: Number(e.target.value) || 30,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cfg-score">
                    Ambang Skor Pra-Screen Favorable (300–850)
                  </label>
                  <input
                    id="cfg-score"
                    type="number"
                    step={10}
                    className="form-control num-financial"
                    value={draftPolicy.favorableReviewScore}
                    onChange={(e) =>
                      setDraftPolicy((p) => ({
                        ...p,
                        favorableReviewScore: Number(e.target.value) || 650,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cfg-spike">
                    Sensitivitas Window Dressing (x Lipat)
                  </label>
                  <input
                    id="cfg-spike"
                    type="number"
                    step={0.05}
                    className="form-control num-financial"
                    value={draftPolicy.windowDressingSpikeThreshold}
                    onChange={(e) =>
                      setDraftPolicy((p) => ({
                        ...p,
                        windowDressingSpikeThreshold: Number(e.target.value) || 1.5,
                      }))
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-grid)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div className="swiss-kicker">
                  PARAMETER NERACA INTERNAL BANK ({draftBank.bankName})
                </div>

                <div className="row-2-col" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="cfg-dpk">
                      Dana Pihak Ketiga / DPK (IDR)
                    </label>
                    <input
                      id="cfg-dpk"
                      type="number"
                      step={500_000_000}
                      className="form-control num-financial"
                      value={draftBank.dpkDeposits}
                      onChange={(e) =>
                        setDraftBank((b) => ({
                          ...b,
                          dpkDeposits: Number(e.target.value) || 10_000_000_000,
                        }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="cfg-capital">
                      Modal Inti / Tier-1 Capital (IDR)
                    </label>
                    <input
                      id="cfg-capital"
                      type="number"
                      step={250_000_000}
                      className="form-control num-financial"
                      value={draftBank.tier1Capital}
                      onChange={(e) =>
                        setDraftBank((b) => ({
                          ...b,
                          tier1Capital: Number(e.target.value) || 2_000_000_000,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-grid)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div className="swiss-kicker">INTEGRASI EKSTERNAL — BELUM TERSEDIA</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Toggle berikut dihapus dari alur operasional karena belum ada konektor ke layanan eksternal.
                </div>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', cursor: 'pointer' }}>
                  <span>Pengecekan biro kredit / SLIK</span>
                  <strong>Belum terhubung</strong>
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', cursor: 'pointer' }}>
                  <span>Verifikasi e-KYC / OSS</span>
                  <strong>Belum terhubung</strong>
                </label>
              </div>
            </div>

            <div className="adminlte-card-footer">
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Aturan deterministik demo • tanpa kalibrasi model dan tanpa perhitungan CKPN/ECL
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveSettings}
              >
                Terapkan Parameter
              </button>
            </div>
          </div>
        </div>

        {/* Audit Trail & Action History Section (#28 Governance) */}
        <div className="adminlte-card" style={{ marginTop: '1.25rem' }}>
          <div className="adminlte-card-header">
            <div>
              <div className="adminlte-card-title">
                Rekaman Riwayat Tindakan &amp; Jejak Audit Demo ({filteredLogs.length} Entri)
              </div>
              <div className="adminlte-card-subtitle">
                Catatan lokal browser untuk menelusuri alur tindakan aktor (Borrower, Analis, Komite, Investor, Treasury).
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleExportAuditCsv}
                disabled={filteredLogs.length === 0}
              >
                Ekspor Riwayat (.CSV)
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleExportAuditJson}
                disabled={filteredLogs.length === 0}
              >
                Ekspor Riwayat (.JSON)
              </button>
              <HelpTip
                title="Pencarian & Ekspor Riwayat Audit Demo"
                description="Catatan audit mencatat setiap perubahan status, pengajuan baru, persetujuan komite, komitmen pemodal, dan pencairan demo lokal."
                steps={[
                  'Gunakan kolom pencarian untuk menyaring berdasarkan nama debitur, ID aplikasi, atau kata kunci aksi.',
                  'Gunakan filter Aktor untuk melihat tindakan khusus Analis, Komite, atau Treasury.',
                  'Klik Ekspor CSV/JSON untuk mengunduh log audit lokal dengan cap data sintetis.',
                ]}
              />
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-grid)',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Cari nama debitur, nomor aplikasi (LOS-...), atau jenis aksi..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Filter Aktor:</span>
              <select
                className="form-control"
                style={{ fontSize: '0.82rem', padding: '0.3rem 0.6rem', height: '36px' }}
                value={logFilterActor}
                onChange={(e) => setLogFilterActor(e.target.value)}
              >
                <option value="ALL">Semua Peran Aktor ({auditLogs.length})</option>
                <option value="CREDIT_UNDERWRITER">CREDIT_UNDERWRITER</option>
                <option value="CREDIT_COMMITTEE">CREDIT_COMMITTEE</option>
                <option value="BORROWER_PORTAL">BORROWER_PORTAL</option>
                <option value="BANK_TREASURY_DEMO">BANK_TREASURY_DEMO</option>
                <option value="P2P_INVESTOR_DEMO">P2P_INVESTOR_DEMO</option>
              </select>
            </div>

            {logSearchQuery && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setLogSearchQuery('')}
              >
                Reset Cari
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table className="swiss-table">
              <thead>
                <tr>
                  <th>Waktu (WIB)</th>
                  <th>Peran &amp; Nama Aktor</th>
                  <th>ID &amp; Nama Debitur</th>
                  <th>Jenis Aksi</th>
                  <th>Ringkasan Tindakan</th>
                  <th className="text-right">Sinyal Risiko</th>
                  <th className="text-right">DSCR</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center" style={{ padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                      Tidak ada rekaman audit yang sesuai dengan kata kunci pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono-code" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {log.timestamp}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{log.actorName}</div>
                        <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                          {log.actorRole}
                        </span>
                      </td>
                      <td>
                        <div className="font-mono-code" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                          {log.applicationId}
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>{log.applicantName}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            log.actionType.includes('REJECT')
                              ? 'badge-danger'
                              : log.actionType.includes('APPROV') || log.actionType.includes('DISBURSE')
                                ? 'badge-safe'
                                : 'badge-warn'
                          }`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {log.actionType}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: '340px' }}>
                        {log.summary}
                      </td>
                      <td className="text-right num-financial" style={{ fontSize: '0.82rem' }}>
                        {log.snapshotRiskSignalPct > 0 ? `${log.snapshotRiskSignalPct.toFixed(1)}%` : '—'}
                      </td>
                      <td className="text-right num-financial" style={{ fontSize: '0.82rem' }}>
                        {log.snapshotDscr > 0 ? `${log.snapshotDscr.toFixed(2)}x` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

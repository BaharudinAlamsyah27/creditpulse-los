import React from 'react';
import {
  AmortizationInstallment,
  CreditUnderwritingEvaluation,
  LoanApplication,
  MonthlyMutationRecord,
  RiskFactorContribution,
} from '../types/credit';
import { formatCompactIDR, formatIDR } from '../engine/creditEngine';

/* ============================================================================
   1. Credit Score Speedometer Gauge (300 - 850) + Rating Badge
   ============================================================================ */
export const CreditScoreGaugeChart: React.FC<{
  score: number;
  grade: string;
  riskSignalPct: number;
  dscr: number | null;
}> = ({ score, grade, riskSignalPct, dscr }) => {
  const clamped = Math.max(300, Math.min(850, score));
  const ratio = (clamped - 300) / (850 - 300); // 0..1
  const angleDeg = -180 + ratio * 180; // -180 to 0
  const angleRad = (angleDeg * Math.PI) / 180;

  const cx = 130;
  const cy = 115;
  const r = 86;
  const needleX = cx + (r - 12) * Math.cos(angleRad);
  const needleY = cy + (r - 12) * Math.sin(angleRad);

  const arcPath = (startRatio: number, endRatio: number) => {
    const a1 = (-180 + startRatio * 180) * (Math.PI / 180);
    const a2 = (-180 + endRatio * 180) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg
        viewBox="0 0 260 150"
        width="100%"
        style={{ maxWidth: '280px', overflow: 'visible' }}
        aria-label={`Grafik Skor Kredit ${score} Grade ${grade}`}
      >
        {/* Background segments: High Risk (300-520), Watch (520-660), Prime (660-850) */}
        <path
          d={arcPath(0, 0.4)}
          fill="none"
          stroke="var(--status-danger)"
          strokeWidth="18"
          strokeOpacity="0.85"
        />
        <path
          d={arcPath(0.4, 0.68)}
          fill="none"
          stroke="var(--status-warn)"
          strokeWidth="18"
          strokeOpacity="0.85"
        />
        <path
          d={arcPath(0.68, 1)}
          fill="none"
          stroke="var(--status-safe)"
          strokeWidth="18"
          strokeOpacity="0.9"
        />

        {/* Scale labels */}
        <text x="32" y="135" fontSize="10" fill="var(--text-muted)" className="num-financial">
          300 (D)
        </text>
        <text x="115" y="18" fontSize="10" fill="var(--text-muted)" className="num-financial">
          580 (BB)
        </text>
        <text x="205" y="135" fontSize="10" fill="var(--text-muted)" className="num-financial">
          850 (AAA)
        </text>

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="var(--text-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="7" fill="var(--text-primary)" />

        {/* Score Readout */}
        <text
          x={cx}
          y={cy - 22}
          textAnchor="middle"
          fontSize="26"
          fontWeight="800"
          fill="var(--text-primary)"
          className="num-financial"
        >
          {score}
        </text>
      </svg>

      <div
        className="num-financial"
        style={{
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-0.25rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          className={`badge ${
            score >= 690 ? 'badge-safe' : score >= 580 ? 'badge-warn' : 'badge-danger'
          }`}
        >
          RATING {grade}
        </span>
        <span className="badge badge-neutral">Sinyal risiko demo: {riskSignalPct.toFixed(2)}%</span>
        <span
          className={`badge ${
            dscr === null ? 'badge-neutral' : dscr >= 1.25 ? 'badge-safe' : dscr >= 1.0 ? 'badge-warn' : 'badge-danger'
          }`}
        >
          {dscr === null ? 'DSCR belum dihitung' : `DSCR: ${dscr.toFixed(2)}x`}
        </span>
      </div>
    </div>
  );
};

/* ============================================================================
   2. 6-Month Bank Mutation Cashflow Area & Line Chart (#19)
   ============================================================================ */
export const CashflowMutationTrendChart: React.FC<{
  mutations: MonthlyMutationRecord[];
}> = ({ mutations }) => {
  if (!mutations || mutations.length === 0) return null;

  const width = 560;
  const height = 225;
  const padLeft = 58;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 34;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(
    1,
    ...mutations.map((m) => Math.max(m.creditInflow, m.debitOutflow, m.endingBalance))
  );

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(1, mutations.length - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - (val / maxVal) * plotH;

  const inflowPoints = mutations.map((m, i) => `${getX(i)},${getY(m.creditInflow)}`).join(' ');
  const outflowPoints = mutations.map((m, i) => `${getX(i)},${getY(m.debitOutflow)}`).join(' ');
  const balancePoints = mutations
    .map((m, i) => `${getX(i)},${getY(m.endingBalance)}`)
    .join(' ');

  const inflowArea = `${getX(0)},${padTop + plotH} ${inflowPoints} ${getX(
    mutations.length - 1
  )},${padTop + plotH}`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.6rem',
          fontSize: '0.78rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--status-safe)',
                display: 'inline-block',
                borderRadius: '2px',
              }}
            />
            <strong>Mutasi Kredit (Inflow)</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--status-danger)',
                display: 'inline-block',
                borderRadius: '2px',
              }}
            />
            <strong>Mutasi Debit (Outflow)</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: '12px',
                height: '3px',
                backgroundColor: 'var(--accent-info)',
                display: 'inline-block',
              }}
            />
            <span>Saldo Akhir Mengendap</span>
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Grafik Tren Mutasi Rekening 6 Bulan"
      >
        {/* Horizontal grid lines */}
        {yTicks.map((t) => {
          const val = maxVal * t;
          const y = getY(val);
          return (
            <g key={t}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="var(--border-grid)"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
                className="num-financial"
              >
                {(val / 1_000_000).toFixed(0)} Jt
              </text>
            </g>
          );
        })}

        {/* Inflow Shaded Area */}
        <polygon points={inflowArea} fill="var(--status-safe)" fillOpacity="0.13" />

        {/* Lines */}
        <polyline
          fill="none"
          stroke="var(--status-safe)"
          strokeWidth="2.5"
          points={inflowPoints}
        />
        <polyline
          fill="none"
          stroke="var(--status-danger)"
          strokeWidth="2.2"
          strokeDasharray="5 3"
          points={outflowPoints}
        />
        <polyline
          fill="none"
          stroke="var(--accent-info)"
          strokeWidth="2"
          points={balancePoints}
        />

        {/* Data points & X-axis labels */}
        {mutations.map((m, i) => {
          const x = getX(i);
          const yIn = getY(m.creditInflow);
          const yOut = getY(m.debitOutflow);
          const yBal = getY(m.endingBalance);
          return (
            <g key={m.month}>
              <circle cx={x} cy={yIn} r="4.5" fill="var(--status-safe)">
                <title>
                  {m.month} Inflow: {formatIDR(m.creditInflow)}
                </title>
              </circle>
              <circle cx={x} cy={yOut} r="3.5" fill="var(--status-danger)">
                <title>
                  {m.month} Outflow: {formatIDR(m.debitOutflow)}
                </title>
              </circle>
              <circle cx={x} cy={yBal} r="3.5" fill="var(--accent-info)">
                <title>
                  {m.month} Saldo Akhir: {formatIDR(m.endingBalance)}
                </title>
              </circle>
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="600"
                fill="var(--text-secondary)"
                className="font-mono-code"
              >
                {m.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ============================================================================
   3. Portfolio Allocation & Risk Grade Distribution Donut + Bar Chart
   ============================================================================ */
export const PortfolioDistributionCharts: React.FC<{
  applications: LoanApplication[];
  evaluations: Record<string, CreditUnderwritingEvaluation>;
}> = ({ applications, evaluations }) => {
  // Group exposure by scheme
  const schemeTotals: Record<string, { label: string; amount: number; color: string }> = {
    MURABAHAH_MARGIN: {
      label: 'Syariah Murabahah',
      amount: 0,
      color: 'var(--status-safe)',
    },
    MUDHARABAH_P2P: {
      label: 'P2P Mudharabah',
      amount: 0,
      color: 'var(--accent-info)',
    },
    MUSYARAKAH_P2P: {
      label: 'P2P Musyarakah',
      amount: 0,
      color: 'var(--accent-gold)',
    },
    ANUITAS_KONVENSIONAL: {
      label: 'Anuitas Konvensional',
      amount: 0,
      color: 'var(--status-danger)',
    },
  };

  for (const app of applications) {
    if (schemeTotals[app.scheme]) {
      schemeTotals[app.scheme].amount += app.requestedAmount;
    }
  }

  const totalExposure = Math.max(
    1,
    Object.values(schemeTotals).reduce((s, item) => s + item.amount, 0)
  );

  // Build SVG Donut slices
  let cumulativePct = 0;
  const cx = 85;
  const cy = 85;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  const slices = Object.entries(schemeTotals).map(([key, item]) => {
    const pct = item.amount / totalExposure;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePct * circumference;
    cumulativePct += pct;
    return {
      key,
      ...item,
      pct: Number((pct * 100).toFixed(1)),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // Plafond vs ECL Comparison bars per borrower
  const maxBorrowerAmount = Math.max(1, ...applications.map((a) => a.requestedAmount));

  return (
    <div className="row-2-col">
      {/* Left: Donut Chart of Financing Schemes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <svg
          width="170"
          height="170"
          viewBox="0 0 170 170"
          aria-label="Donut Chart Komposisi Akad Pembiayaan"
        >
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {slices.map((s) => (
              <circle
                key={s.key}
                cx={cx}
                cy={cy}
                r={radius}
                fill="transparent"
                stroke={s.color}
                strokeWidth="22"
                strokeDasharray={s.strokeDasharray}
                strokeDashoffset={s.strokeDashoffset}
              />
            ))}
          </g>
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--text-muted)"
          >
            TOTAL PENGAJUAN
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontSize="13.5"
            fontWeight="800"
            fill="var(--text-primary)"
            className="num-financial"
          >
            {formatCompactIDR(totalExposure)}
          </text>
        </svg>

        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div className="swiss-kicker">KOMPOSISI SKEMA AKAD PORTOFOLIO</div>
          {slices.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: s.color,
                    display: 'inline-block',
                  }}
                />
                <span>{s.label}</span>
              </span>
              <span className="num-financial" style={{ fontWeight: 700 }}>
                {s.pct}% ({formatCompactIDR(s.amount)})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Horizontal Bar Chart of Borrower Exposure & Risk Grade */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', justifyContent: 'center' }}>
        <div className="swiss-kicker">
          DISTRIBUSI JUMLAH PENGAJUAN &amp; SKOR RISIKO DEMO (KLIK UNTUK DETAIL)
        </div>
        {applications.map((app) => {
          const ev = evaluations[app.id];
          const widthPct = Math.round((app.requestedAmount / maxBorrowerAmount) * 100);
          const barColor =
            ev.creditScore >= 690
              ? 'var(--status-safe)'
              : ev.creditScore >= 580
                ? 'var(--status-warn)'
                : 'var(--status-danger)';
          return (
            <div key={app.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '0.75rem',
                  fontSize: '0.78rem',
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {app.applicantName}{' '}
                  <span className="font-mono-code" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    ({ev.ratingGrade} • sinyal demo {ev.riskSignalPct}%)
                  </span>
                </span>
                <span
                  className="num-financial"
                  style={{ fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {formatCompactIDR(app.requestedAmount)}
                </span>
              </div>
              <div className="swiss-meter" style={{ height: '9px' }}>
                <div
                  style={{
                    width: `${widthPct}%`,
                    height: '100%',
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   4. Amortization Principal vs Interest/Margin Stacked Bar Chart (#4)
   ============================================================================ */
export const AmortizationStackedChart: React.FC<{
  schedule: AmortizationInstallment[];
}> = ({ schedule }) => {
  const sample = schedule.slice(0, 24);
  if (sample.length === 0) return null;

  const maxInstallment = Math.max(1, ...sample.map((s) => s.totalInstallment));

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.65rem',
          fontSize: '0.78rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span className="swiss-kicker">
          VISUALISASI KOMPOSISI ANGSURAN BULANAN (POKOK VS MARGIN / BUNGA)
        </span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: '11px',
                height: '11px',
                backgroundColor: 'var(--accent-primary)',
                display: 'inline-block',
                borderRadius: '2px',
              }}
            />
            <span>Cicilan Pokok</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: '11px',
                height: '11px',
                backgroundColor: 'var(--accent-gold)',
                display: 'inline-block',
                borderRadius: '2px',
              }}
            />
            <span>Porsi Margin / Bunga</span>
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${sample.length}, 1fr)`,
          gap: '6px',
          alignItems: 'end',
          height: '145px',
          padding: '0.75rem 0.5rem 0.25rem',
          borderBottom: '1px solid var(--border-card)',
        }}
      >
        {sample.map((row) => {
          const totalH = Math.max(15, Math.round((row.totalInstallment / maxInstallment) * 115));
          const principalH = Math.round(
            (row.principalComponent / Math.max(1, row.totalInstallment)) * totalH
          );
          const marginH = Math.max(2, totalH - principalH);

          return (
            <div
              key={row.period}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
              title={`Bulan ${row.period}: Pokok ${formatIDR(
                row.principalComponent
              )} + Margin/Bunga ${formatIDR(row.interestOrMarginComponent)}`}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '2px 2px 0 0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: `${marginH}px`,
                    backgroundColor: 'var(--accent-gold)',
                  }}
                />
                <div
                  style={{
                    height: `${principalH}px`,
                    backgroundColor: 'var(--accent-primary)',
                  }}
                />
              </div>
              <span
                className="font-mono-code"
                style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}
              >
                {row.period}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   5. 5-Axis Credit Health Radar / Pentagon Chart + Diverging SHAP Chart (#5)
   ============================================================================ */
export const RiskFactorDivergingChart: React.FC<{
  contributions: RiskFactorContribution[];
}> = ({ contributions }) => {
  const maxAbsPts = Math.max(
    25,
    ...contributions.map((c) => Math.abs(c.pointsImpact))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          paddingBottom: '0.35rem',
          borderBottom: '1px solid var(--border-grid)',
        }}
      >
        <span style={{ color: 'var(--status-danger)', fontWeight: 700 }}>
          ← MENAIKKAN RISIKO GAGAL BAYAR (- POIN)
        </span>
        <span style={{ color: 'var(--status-safe)', fontWeight: 700 }}>
          MENURUNKAN RISIKO (+ POIN SKOR) →
        </span>
      </div>

      {contributions.map((feat) => {
        const isPositive = feat.pointsImpact >= 0;
        const pct = Math.min(48, Math.round((Math.abs(feat.pointsImpact) / maxAbsPts) * 48));

        return (
          <div key={feat.featureKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <strong>{feat.featureLabel}</strong>{' '}
                <span className="font-mono-code" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  ({feat.rawValueFormatted})
                </span>
              </div>
              <span
                className="num-financial"
                style={{
                  fontWeight: 800,
                  color: isPositive ? 'var(--status-safe)' : 'var(--status-danger)',
                }}
              >
                {feat.pointsImpact > 0 ? `+${feat.pointsImpact} pts` : `${feat.pointsImpact} pts`}
              </span>
            </div>

            {/* Diverging center-zero bar */}
            <div
              style={{
                position: 'relative',
                height: '12px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: '3px',
                border: '1px solid var(--border-grid)',
                overflow: 'hidden',
              }}
            >
              {/* Center Zero Axis */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: '1.5px',
                  backgroundColor: 'var(--text-muted)',
                  zIndex: 2,
                }}
              />
              {isPositive ? (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '1px',
                    bottom: '1px',
                    width: `${pct}%`,
                    backgroundColor: 'var(--status-safe)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    left: `${50 - pct}%`,
                    top: '1px',
                    bottom: '1px',
                    width: `${pct}%`,
                    backgroundColor: 'var(--status-danger)',
                    borderRadius: '2px 0 0 2px',
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

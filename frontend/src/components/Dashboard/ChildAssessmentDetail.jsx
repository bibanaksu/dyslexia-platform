import React, { useState, useEffect, Component } from 'react';
import { fetchTaskDetails } from '../../services/api';

// ─── PALETTE: Blue & White clinical theme ─────────────────────
const P = {
  blue900:  '#0f2744',
  blue800:  '#1a3a5c',
  blue700:  '#1e4d7b',
  blue600:  '#1d6fa6',
  blue500:  '#2589c9',
  blue400:  '#4aa3d9',
  blue100:  '#daeeff',
  blue50:   '#f0f8ff',
  white:    '#ffffff',
  gray50:   '#f8fafc',
  gray100:  '#f1f5f9',
  gray200:  '#e2e8f0',
  gray300:  '#cbd5e1',
  gray400:  '#94a3b8',
  gray600:  '#475569',
  gray800:  '#1e293b',
  riskNormal:   { text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  riskMild:     { text: '#a16207', bg: '#fefce8', border: '#fde68a', dot: '#eab308' },
  riskModerate: { text: '#c2410c', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316' },
  riskSevere:   { text: '#b91c1c', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
};

const getRisk = (score) => {
  if (score == null) return { label: 'N/A',      ...P.riskNormal   };
  if (score >= 85)   return { label: 'Normal',   ...P.riskNormal   };
  if (score >= 70)   return { label: 'Mild',     ...P.riskMild     };
  if (score >= 50)   return { label: 'Moderate', ...P.riskModerate };
  return               { label: 'Severe',   ...P.riskSevere   };
};

const fmt    = (n) => n != null ? `${Math.round(n)}%` : '—';
const fmtSec = (s) => {
  if (s == null) return '—';
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const TASKS = {
  task1: { label: 'Word Explorer',    sub: 'Vocabulary & word recognition',  icon: 'M4 6h16M4 12h10M4 18h7' },
  task2: { label: 'Story Reader',     sub: 'Reading fluency & comprehension', icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
  task3: { label: 'Letter Detective', sub: 'Phonological awareness',          icon: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' },
  task4: { label: 'Number Memory',    sub: 'Working memory & sequencing',     icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2' },
};

const Icon = ({ d, size = 14, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

// ── METRIC CARD ───────────────────────────────────────────────
function MetricCard({ label, value, accent, wide }) {
  return (
    <div style={{
      background: P.white,
      border: `1px solid ${P.gray200}`,
      borderRadius: 8,
      padding: '12px 16px',
      minWidth: wide ? 110 : 80,
      textAlign: 'center',
      borderTop: `3px solid ${accent || P.blue500}`,
      flex: '0 0 auto',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent || P.blue800, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{value}</div>
      <div style={{ fontSize: 10, color: P.gray400, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ── RISK BADGE ────────────────────────────────────────────────
function RiskBadge({ score }) {
  const r = getRisk(score);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: r.bg, color: r.text, border: `1px solid ${r.border}`, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot, display: 'inline-block', flexShrink: 0 }} />
      {r.label}
    </span>
  );
}

// ── STATUS PILL ───────────────────────────────────────────────
function StatusPill({ correct }) {
  const r = correct ? P.riskNormal : P.riskSevere;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: r.bg, color: r.text, border: `1px solid ${r.border}`,
      whiteSpace: 'nowrap',
    }}>
      {correct ? 'Correct' : 'Incorrect'}
    </span>
  );
}

// ── WORD TAG ──────────────────────────────────────────────────
function WordTag({ label, correct }) {
  const r = correct ? P.riskNormal : P.riskSevere;
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      margin: '2px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      fontFamily: 'monospace',
      background: r.bg,
      color: r.text,
      border: `1px solid ${r.border}`,
      whiteSpace: 'nowrap',
      lineHeight: 1.6,
    }}>
      {label}
    </span>
  );
}

// ── SECTION HEADER ────────────────────────────────────────────
function SectionHeader({ title, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      margin: '20px 0 10px', paddingBottom: 8, borderBottom: `1px solid ${P.gray200}`,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: P.blue700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
      {count != null && (
        <span style={{ fontSize: 10, fontWeight: 700, background: P.blue100, color: P.blue700, borderRadius: 10, padding: '2px 8px', letterSpacing: '0.02em' }}>
          {count} items
        </span>
      )}
    </div>
  );
}

// ── SCORE BAR ─────────────────────────────────────────────────
function ScoreBar({ label, score }) {
  const numericScore = score != null ? Number(score) : null;
  const r = getRisk(numericScore);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: P.gray600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: r.text }}>{fmt(numericScore)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: P.gray200, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${numericScore ?? 0}%`, background: `linear-gradient(90deg, ${r.dot}88, ${r.dot})`, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

// ── DATA TABLE ────────────────────────────────────────────────
function DataTable({ rows, columns, emptyMessage = 'No data recorded.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding: '14px 16px', background: P.blue50, borderRadius: 8, border: `1px solid ${P.blue100}`, color: P.gray400, fontSize: 12, textAlign: 'center' }}>
        {emptyMessage}
      </div>
    );
  }
  return (
    <div style={{ borderRadius: 8, border: `1px solid ${P.gray200}`, overflow: 'hidden', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: P.blue800 }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding: '9px 14px', textAlign: 'left', color: P.blue100, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? P.white : P.gray50, borderBottom: `1px solid ${P.gray100}` }}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: '9px 14px', color: P.gray800, verticalAlign: 'middle', lineHeight: 1.5 }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── HELPER: Normalize word details from API ──────────────────
function normalizeWordDetails(raw) {
  if (!raw) return [];
  
  let details;
  if (typeof raw === 'string') {
    try {
      details = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse word_details JSON:', e);
      return [];
    }
  } else {
    details = Array.isArray(raw) ? raw : Object.values(raw);
  }
  
  if (Array.isArray(details) && details[0]?.index !== undefined) {
    const allWords = ['She','eats','bread','and','drinks','outside','to','play','with','her','friend','Sara','in','Lina','finds','Sara','and','they','are','very','happy.','After','playing,','they','sit','under','a','tree'];
    return allWords.map((expected, i) => {
      const errorItem = details.find(d => d.index === i);
      const spoken = errorItem?.spoken || '';
      const correct = !errorItem;
      return {
        word: expected,
        correct,
        userAnswer: spoken || '—',
        correctAnswer: expected,
      };
    });
  }
  
  return (Array.isArray(details) ? details : Object.values(details)).map(item => {
    const word = item.word || item.expected || item.target || item.stimulus || '';
    let correct = item.correct === true || item.isCorrect === true || item.is_correct === true;
    const userAnswer = item.userAnswer || item.answer || item.response || item.spoken || '';
    const expectedAnswer = item.expected || item.correctAnswer || item.target || '';
    
    if (!correct && userAnswer && expectedAnswer && userAnswer.toLowerCase() === expectedAnswer.toLowerCase()) {
      correct = true;
    }
    return {
      word,
      correct,
      userAnswer,
      correctAnswer: expectedAnswer,
      timeTaken: item.timeTaken ?? item.time_seconds ?? null,
    };
  });
}

// ── TASK 1: Word Explorer ─────────────────────────────────────
function Task1Detail({ data }) {
  console.log('🔍 RAW Task1 DATA:', data);
  if (!data) return <div style={{ padding: 20, color: P.gray400, fontSize: 13, textAlign: 'center' }}>This task has not been completed yet.</div>;
  const rc = getRisk(data.percentage);

  const similarPct    = Math.round((Number(data.similar_words_score    || 0) / 20) * 100);
  const nonSimilarPct = Math.round((Number(data.non_similar_words_score || 0) / 20) * 100);
  const pseudoPct     = Math.round((Number(data.pseudo_words_score     || 0) / 20) * 100);

  const errors = data.errorPatterns;
  const errorRows = (() => {
    if (!errors) return [];
    if (Array.isArray(errors)) {
      return errors.map(e =>
        typeof e === 'string' ? { shown: e, answered: '—', correct: false }
        : { shown: e.shown || e.word || '—', answered: e.answered || e.userAnswer || '—', correct: !!e.correct }
      );
    }
    return Object.entries(errors).map(([shown, answered]) => ({ shown, answered, correct: false }));
  })();

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <MetricCard label="Score"   value={fmt(data.percentage)}  accent={rc.dot} />
        <MetricCard label="Total"   value={data.totalWords ?? '—'} />
        <MetricCard label="Correct" value={data.totalScore ?? '—'} accent={P.riskNormal.dot} />
      </div>

      <SectionHeader title="Category Breakdown" />
      <ScoreBar label="Similar Words"     score={similarPct} />
      <ScoreBar label="Non-Similar Words" score={nonSimilarPct} />
      <ScoreBar label="Pseudo Words"      score={pseudoPct} />

      <SectionHeader title="Error Patterns" count={errorRows.length} />
      <DataTable
        rows={errorRows}
        emptyMessage="No errors recorded — perfect score on this task."
        columns={[
          { key: 'shown',    label: 'Word Shown',     render: v => <span style={{ fontFamily: 'monospace', fontWeight: 600, color: P.blue800 }}>{v ?? '—'}</span> },
{ key: 'answered', label: "Child\\'s Answer", render: v => <span style={{ fontFamily: 'monospace', color: P.riskSevere.text, fontWeight: 600 }}>{v || '—'}</span> },
          { key: 'correct',  label: 'Status',         render: (v, row) => <StatusPill correct={!!row.correct} /> },
        ]}
      />
    </div>
  );
}

// ── TASK 2: Story Reader ──────────────────────────────────────
function Task2Detail({ data }) {
  console.log('🔍 RAW Task2 DATA:', data);
  if (!data) return <div style={{ padding: 20, color: P.gray400, fontSize: 13, textAlign: 'center' }}>This task has not been completed yet.</div>;
  const rc = getRisk(data.percentage);
  const allWords = normalizeWordDetails(data.wordDetails);
  const wrongWords = allWords.filter(w => !w.correct);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <MetricCard label="Score"     value={fmt(data.percentage)}        accent={rc.dot} />
        <MetricCard label="Total"     value={data.totalWords ?? '—'} />
        <MetricCard label="Correct"   value={data.correctCount ?? '—'}   accent={P.riskNormal.dot} />
        <MetricCard label="Incorrect" value={data.incorrectCount ?? '—'} accent={P.riskSevere.dot} />
        <MetricCard label="Timeout"   value={data.timeoutCount ?? '—'}   accent={P.riskMild.dot} />
      </div>

      <SectionHeader title="All Words" count={allWords.length} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 24, padding: '4px 0' }}>
        {allWords.length === 0 ? (
          <div style={{ padding: '14px 16px', background: P.blue50, borderRadius: 8, border: `1px solid ${P.blue100}`, color: P.gray400, fontSize: 12, textAlign: 'center', width: '100%' }}>
            No word data available.
          </div>
        ) : (
          allWords.map((w, i) => (
            <WordTag
              key={i}
              label={w.word && w.word.trim() ? w.word : (w.correctAnswer && w.correctAnswer.trim() ? w.correctAnswer : `Word ${i + 1}`)}
              correct={w.correct}
            />
          ))
        )}
      </div>

      <SectionHeader title="Incorrect Words (Detailed)" count={wrongWords.length} />
      <DataTable
        rows={wrongWords}
        emptyMessage="No incorrect words — all words read correctly."
        columns={[
          { key: 'word',          label: 'Word Shown',     render: v => <span style={{ fontFamily: 'monospace', fontWeight: 600, color: P.blue800 }}>{v || '—'}</span> },
          { key: 'userAnswer',    label:"Child's Answer", render: v => <span style={{ fontFamily: 'monospace', color: P.riskSevere.text, fontWeight: 600 }}>{v || '—'}</span> },
          { key: 'correctAnswer', label: 'Correct Answer', render: v => <span style={{ fontFamily: 'monospace', color: P.riskNormal.text, fontWeight: 600 }}>{v || '—'}</span> },
        ]}
      />
    </div>
  );
}

// ── TASK 3: Letter Detective ────────────────────────────────── (🔧 FIXED)
function Task3Detail({ data }) {
  console.log('🔍 RAW Task3 DATA:', JSON.stringify(data, null, 2));
  
  if (!data) return <div style={{ padding: 20, color: P.gray400, fontSize: 13, textAlign: 'center' }}>This task has not been completed yet.</div>;
  const rc = getRisk(data.percentage);

  // 🛡️ UNIVERSAL DATA EXTRACTOR (handles string/object/array)
  const safeParseData = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return []; }
    }
    if (typeof raw === 'object') {
      // Try snake_case first (DB fields)
      return raw.comparison_details || raw.details || raw.items || Object.values(raw);
    }
    return [];
  };

  const rawDetails = safeParseData(data.comparison_details || data.comparisonDetails || data.comparisons || data.letterComparisons || data.details || data.items || data.comparison_details);
  console.log('🔍 Task3 EXTRACTED rawDetails:', rawDetails);
  
  const allItems = Array.isArray(rawDetails) ? rawDetails : Object.values(rawDetails || {});
  const isItemCorrect = (item) => {
    if (item.is_correct !== undefined) return item.is_correct === 1 || item.is_correct === true;
    if (item.correct !== undefined) return item.correct;
    if (item.isCorrect !== undefined) return item.isCorrect;

    // fallback (rare)
    if (item.user_answer && item.expected_same !== undefined) {
      const expected = item.expected_same === 1 ? "same" : "different";
      return item.user_answer.toLowerCase() === expected;
    }

    return false;
  };

  const wrongItems = allItems.filter(d => d && !isItemCorrect(d));

  const getLetter = (item, side) => {
    if (side === 'A') return item.group1 || item.letterA || item.left || null;
    if (side === 'B') return item.group2 || item.letterB || item.right || null;
    return null;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <MetricCard label="Score"     value={fmt(data.percentage)}          accent={rc.dot} />
        <MetricCard label="Total"     value={data.totalComparisons ?? '—'} />
        <MetricCard label="Correct"   value={data.correctCount ?? '—'}     accent={P.riskNormal.dot} />
        <MetricCard label="Incorrect" value={data.incorrectCount ?? '—'}   accent={P.riskSevere.dot} />
        <MetricCard label="Timeout"   value={data.timeoutCount ?? '—'}     accent={P.riskMild.dot} />
        <MetricCard label="Time"      value={fmtSec(data.totalTimeSeconds)} wide />
      </div>

      <SectionHeader title="All Comparisons" count={allItems.length} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 24, padding: '4px 0' }}>
        {allItems.map((item, i) => {
          const la = getLetter(item, 'A');
          const lb = getLetter(item, 'B');
          const correct = isItemCorrect(item);
          const displayLabel = la && lb ? `${la} vs ${lb}` : `Pair ${i + 1}`;
          return <WordTag key={i} label={displayLabel} correct={correct} />;
        })}
      </div>

      <SectionHeader title="Incorrect Comparisons (Detailed)" count={wrongItems.length} />
      <DataTable
        rows={wrongItems}
        emptyMessage="No incorrect comparisons — all letters identified correctly."
        columns={[
          {
            key: 'letterA',
            label: 'Letter A',
            render: (v, row) => {
              const letter = getLetter(row, 'A') || '—';
              return <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Georgia, serif', color: P.blue900, display: 'inline-block', minWidth: 30, textAlign: 'center' }}>{letter}</span>;
            },
          },
          {
            key: 'letterB',
            label: 'Letter B',
            render: (v, row) => {
              const letter = getLetter(row, 'B') || '—';
              return <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Georgia, serif', color: P.blue900, display: 'inline-block', minWidth: 30, textAlign: 'center' }}>{letter}</span>;
            },
          },
          {
            key: 'userAnswer',
            label: 'Child Said',
            render: (v, row) => {
              const answer = v || row.answer || row.response || row.childAnswer || '—';
              return <span style={{ fontWeight: 700, color: P.riskSevere.text }}>{answer}</span>;
            },
          },
          {
            key: 'correctAnswer',
            label: 'Should Be',
            render: (v, row) => {
              const expected = v || row.expected || row.correctAnswer || '—';
              return <span style={{ fontWeight: 700, color: P.riskNormal.text }}>{expected}</span>;
            },
          },
        ]}
      />
    </div>
  );
}

// ── TASK 4 SUBSECTION (REUSABLE) ──────────────────────────────
function Task4SubSection({ sub, title, detailsRaw }) {
  console.log('🔍 Task4SubSection RAW:', { sub, detailsRaw });
  
  if (!sub) return null;

  // 🛡️ REUSE safeParseData from Task3 (move up later)
  const safeParseData = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return []; }
    }
    if (typeof raw === 'object') {
      // Backend seq_details/rev_details
      return raw.seq_details || raw.rev_details || raw.details || raw.items || Object.values(raw);
    }
    return [];
  };

  let allItems = [];
  const rawDetailsStr = detailsRaw || sub.details || sub.seq_details || sub.rev_details;
  const rawDetails = safeParseData(rawDetailsStr);
  console.log('🔍 Task4 EXTRACTED rawDetails:', rawDetails);
  
  // Handle nested forward/reverse OR flat array
  if (Array.isArray(rawDetails)) {
    allItems = rawDetails;
  } else if (rawDetails.forward || rawDetails.reverse) {
    allItems = [];
    if (rawDetails.forward) allItems.push({ ...rawDetails.forward, type: 'forward', source: 'nested' });
    if (rawDetails.reverse) allItems.push({ ...rawDetails.reverse, type: 'reverse', source: 'nested' });
  } else {
    allItems = Object.values(rawDetails || {});
  }

  allItems = allItems.map(item => {
    if (item.forward) {
      return {
        ...item.forward,
        type: 'forward',
        rawInput: item.forward.input || item.forward_user_input,
        expected: item.original_numbers
      };
    } else if (item.reverse) {
      return {
        ...item.reverse,
        type: 'reverse', 
        rawInput: item.reverse.input || item.reverse_user_input,
        expected: item.original_numbers ? item.original_numbers.reverse() : []
      };
    }
    return item;
  }).filter(Boolean);

  allItems = allItems.map(item => {
    const seqVal   = item.sequence || item.original_numbers || item.shown || item.stimulus || item.expected || item.target || item.question;
    const rawInput = item.rawInput || item.forward_user_input || item.reverse_user_input || item.input || item.userAnswer || item.answer;
    const expectVal = Array.isArray(item.expected) ? item.expected : (item.expected || item.original_numbers || item.target || seqVal);

    let correct = false;

    if (item.is_correct !== undefined) {
      correct = item.is_correct === 1 || item.is_correct === true;
    } else if (item.correct !== undefined) {
      correct = item.correct;
    } else if (item.isCorrect !== undefined) {
      correct = item.isCorrect;
    } else if (item.forward_correct !== undefined) {
      correct = item.forward_correct;
    } else if (item.reverse_correct !== undefined) {
      correct = item.reverse_correct;
    } else if (item.rawInput && item.expected) {
      correct = seqMatch(item.rawInput, item.expected);
    }

    return { 
      ...item, 
      _resolvedCorrect: correct,
      _rawChildAnswer: rawInput,
      _displaySeq: seqVal || expectVal
    };
  });

  const wrongItems = allItems.filter(d => !d._resolvedCorrect);
  const rc = getRisk(sub.percentage);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${P.blue100}` }}>
        <div style={{ width: 4, height: 16, borderRadius: 2, background: P.blue500, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: P.blue700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
        <RiskBadge score={sub.percentage} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <MetricCard label="Score"     value={fmt(sub.percentage)}  accent={rc.dot} />
        <MetricCard label="Total"     value={sub.total ?? '—'} />
        <MetricCard label="Correct"   value={sub.correct ?? '—'}   accent={P.riskNormal.dot} />
        <MetricCard label="Incorrect" value={sub.incorrect ?? '—'} accent={P.riskSevere.dot} />
        <MetricCard label="Timeout"   value={sub.timeout ?? '—'}   accent={P.riskMild.dot} />
      </div>

      <SectionHeader title="All Sequences" count={allItems.length} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16, padding: '4px 0' }}>
        {allItems.length === 0 ? (
          <div style={{ padding: '10px 14px', background: P.blue50, borderRadius: 8, border: `1px solid ${P.blue100}`, color: P.gray400, fontSize: 12, width: '100%', textAlign: 'center' }}>
            No sequence data available.
          </div>
        ) : allItems.map((item, i) => {
          const seq = item._displaySeq || item.sequence || item.shown || item.stimulus || item.expected || item.target || '—';
          const display = normaliseSeq(seq);
          return <WordTag key={i} label={display} correct={item._resolvedCorrect} />;
        })}
      </div>

      <DataTable
        rows={wrongItems}
        emptyMessage="All sequences answered correctly."
        columns={[
          {
            key: 'sequence',
            label: 'Sequence Shown',
            render: (v, row) => {
              const val = row._displaySeq || v || row.shown || row.stimulus || row.expected || row.target || row.question || '—';
              return <span style={{ fontFamily: 'monospace', color: P.blue800, fontWeight: 600 }}>{normaliseSeq(val)}</span>;
            },
          },
          {
            key: 'input',
            label: "Child's Answer",
            render: (v, row) => {
              const rawAnswer = row._rawChildAnswer || row.rawInput || row.inputRaw || row.userInput || 
                               row.input || row.userAnswer || row.answer || row.response || row.childAnswer || v || '—';
              return <span style={{ 
                fontFamily: 'monospace', 
                fontWeight: 700, 
                color: P.riskSevere.text,
                background: row._resolvedCorrect ? P.riskNormal.bg : P.riskSevere.bg,
                padding: '2px 6px',
                borderRadius: 4,
                border: `1px solid ${row._resolvedCorrect ? P.riskNormal.border : P.riskSevere.border}`
              }}>
                {normaliseSeq(rawAnswer)}
              </span>;
            },
          },
          {
            key: 'expected',
            label: 'Correct Answer',
            render: (v, row) => {
              const correctVal = v || row.correctAnswer || row.target || row.sequence || row._displaySeq || '—';
              return <span style={{ fontFamily: 'monospace', fontWeight: 700, color: P.riskNormal.text }}>{normaliseSeq(correctVal)}</span>;
            },
          },
          {
            key: '_resolvedCorrect',
            label: 'Status',
            render: (v, row) => <StatusPill correct={!!row._resolvedCorrect} />,
          },
        ]}
      />
    </div>
  );
}

// ── TASK 4 MAIN COMPONENT ─────────────────────────────────────
function Task4Detail({ data }) {
  console.log('🔍 RAW Task4 DATA:', data);
  if (!data) return <div style={{ padding: 20, color: P.gray400, fontSize: 13, textAlign: 'center' }}>This task has not been completed yet.</div>;
  const rc = getRisk(data.overallPercentage);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <MetricCard label="Overall Score"     value={fmt(data.overallPercentage)} accent={rc.dot} wide />
        <MetricCard label="Performance Level" value={data.performanceLevel || '—'} wide />
      </div>
      
      <Task4SubSection 
        sub={data.sequence} 
        title="Number Sequence Memory (Forward)" 
        detailsRaw={data.sequence?.details} 
      />
      
      <Task4SubSection 
        sub={data.reversal} 
        title="Number Reversal Memory" 
        detailsRaw={data.reversal?.details} 
      />
    </div>
  );
}

// ── TASK4 UTILITIES ───────────────────────────────────────────
function normaliseSeq(seq) {
  console.log('🔍 normaliseSeq input:', seq, typeof seq);
  if (!seq) return '—';
  if (Array.isArray(seq)) return `[${seq.join(', ')}]`;
  if (typeof seq === 'string') {
    try {
      const parsed = JSON.parse(seq);
      return normaliseSeq(parsed);
    } catch {
      // Clean string formats: "1,2,3" or "1 2 3"
      return seq.replace(/[\[\]\"\']+/g, '').trim();
    }
  }
  return String(seq).replace(/[\[\]\"\']+/g, '').trim();
}

function seqMatch(childInput, expected) {
  const normChild = normaliseSeq(childInput).replace(/[^0-9]/g, '');
  const normExpected = normaliseSeq(expected).replace(/[^0-9]/g, '');
  return normChild === normExpected;
}

// ── ERROR BOUNDARY ────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 Task render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: P.riskSevere.bg, borderRadius: 12, border: `2px solid ${P.riskSevere.border}`, color: P.riskSevere.text, textAlign: 'center' }}>
          <Icon d="M12 9v4M12 17h.01M21 21H3M18 7H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" size={32} color={P.riskSevere.text} />
          <h3 style={{ margin: '12px 0 8px', fontSize: 16 }}>Render Error</h3>
          <p style={{ fontSize: 13, marginBottom: 16 }}>{this.state.error?.message || 'Task failed to render'}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: P.blue500, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════
export default function ChildAssessmentDetail({ childSessionId, childName, activeTab, onTabChange }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!childSessionId) return;
    setLoading(true); setError('');
    fetchTaskDetails(childSessionId)
      .then(data => { 
        console.log('📊 Dashboard loaded details:', data); 
        setDetails(data); 
        setLoading(false); 
      })
      .catch(err  => { 
        console.error('💥 Dashboard fetch error:', err); 
        setError(err.message); 
        setLoading(false); 
      });
  }, [childSessionId]);

  // Loading state
  if (loading) return (
    <div style={{ margin: '16px 0', padding: '32px 24px', background: P.white, borderRadius: 12, border: `1px solid ${P.gray200}`, textAlign: 'center' }}>
      <div style={{ width: 28, height: 28, margin: '0 auto 12px', border: `3px solid ${P.gray200}`, borderTop: `3px solid ${P.blue500}`, borderRadius: '50%', animation: 'cad-spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 13, color: P.gray400 }}>Loading assessment results…</div>
      <style>{`@keyframes cad-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Error state
  if (error) return (
    <div style={{ margin: '16px 0', padding: '14px 16px', background: P.riskSevere.bg, border: `1px solid ${P.riskSevere.border}`, borderRadius: 8, color: P.riskSevere.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" size={15} color={P.riskSevere.text} />
      {error}
    </div>
  );

  if (!details) return null;

  const tabList = ['task1', 'task2', 'task3', 'task4'];
  const scores = tabList.map(t => {
    const raw = t === 'task4' ? details[t]?.overallPercentage : details[t]?.percentage;
    return raw != null ? Number(raw) : null;
  }).filter(s => s != null && !isNaN(s));
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const avgRisk  = getRisk(avgScore);

  const safeTab = tabList.includes(activeTab) ? activeTab : 'task1';

  return (
    <ErrorBoundary>
      <div style={{
        margin: '16px 0',
        background: P.white,
        borderRadius: '0 0 12px 12px',
        border: `1px solid ${P.gray200}`,
        boxShadow: '0 4px 24px rgba(15,39,68,0.07)',
      }}>
        {/* TAB BAR */}
        <div style={{ display: 'flex', background: P.gray50, borderBottom: `1px solid ${P.gray200}`, overflowX: 'auto' }}>
          {tabList.map(t => {
            const meta   = TASKS[t];
            const rawScore = t === 'task4' ? details[t]?.overallPercentage : details[t]?.percentage;
            const score = rawScore != null ? Number(rawScore) : null;
            const rc     = getRisk(score);
            const active = safeTab === t;
            return (
              <button
                key={t}
                onClick={() => onTabChange(t)}
                style={{
                  flex: '1 1 0',
                  minWidth: 110,
                  padding: '14px 10px 12px',
                  border: 'none',
                  borderBottom: active ? `2px solid ${P.blue500}` : '2px solid transparent',
                  background: active ? P.white : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 7, background: active ? P.blue100 : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                  <Icon d={meta.icon} size={14} color={active ? P.blue600 : P.gray400} />
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? P.blue800 : P.gray600, whiteSpace: 'nowrap', textAlign: 'center' }}>{meta.label}</span>
                {score != null ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 10, padding: '1px 7px' }}>{fmt(score)}</span>
                ) : (
                  <span style={{ fontSize: 10, color: P.gray400, background: P.gray100, borderRadius: 10, padding: '1px 7px' }}>N/A</span>
                )}
              </button>
            );
          })}
        </div>

        {/* TASK SUB-HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 12px', borderBottom: `1px solid ${P.gray100}`, background: P.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: P.blue100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={TASKS[safeTab]?.icon} size={15} color={P.blue600} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: P.blue900 }}>{TASKS[safeTab]?.label}</div>
              <div style={{ fontSize: 11, color: P.gray400, marginTop: 1 }}>{TASKS[safeTab]?.sub}</div>
            </div>
          </div>
          {details[safeTab] && (
            <RiskBadge score={safeTab === 'task4' ? details[safeTab]?.overallPercentage : details[safeTab]?.percentage} />
          )}
        </div>

        {/* TASK CONTENT */}
        <div style={{ padding: '20px 24px 28px', overflowX: 'auto' }}>
          {safeTab === 'task1' && <Task1Detail data={details.task1} />}
          {safeTab === 'task2' && <Task2Detail data={details.task2} />}
          {safeTab === 'task3' && <Task3Detail data={details.task3} />}
          {safeTab === 'task4' && <Task4Detail data={details.task4} />}
        </div>
      </div>
    </ErrorBoundary>
  );
}

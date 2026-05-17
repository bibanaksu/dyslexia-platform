import React, { useState, useEffect, Component } from 'react';
import { fetchTaskDetails } from '../../services/api';

// ══════════════════════════════════════════════════════════════
// PALETTE
// ══════════════════════════════════════════════════════════════
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
  ok:      { text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  mild:    { text: '#a16207', bg: '#fefce8', border: '#fde68a', dot: '#eab308' },
  mod:     { text: '#c2410c', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316' },
  err:     { text: '#b91c1c', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
  timeout: { text: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff', dot: '#a855f7' },
};

const getRisk = (score) => {
  if (score == null) return { label: 'N/A', ...P.ok };
  if (score >= 85)   return { label: 'Normal',   ...P.ok   };
  if (score >= 70)   return { label: 'Mild',     ...P.mild  };
  if (score >= 50)   return { label: 'Moderate', ...P.mod   };
  return               { label: 'Severe',    ...P.err   };
};

const fmt    = (n) => n != null ? `${Math.round(n)}%` : '—';
const fmtSec = (s) => {
  if (s == null) return '—';
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

// ── Task 1 word lists ──────────────────────────────────────────
const T1_SIMILAR     = ['cat','bat','hat','mat','cap','cup','map','mop','pin','pen','sit','set','bad','bed','big','pig','fan','van','tap','top'];
const T1_NON_SIMILAR = ['house','tree','school','water','mother','father','child','book','table','chair','apple','bread','car','road','sun','moon','dog','cat','friend','teacher'];
const T1_PSEUDO      = ['mip','lat','nob','kep','sud','fik','zan','pel','mot','rib','dak','vun','sep','gol','tim','paf','lod','kes','bim','ran'];

// Task 3 fallback
const T3_FALLBACK = [
  {group1:'T Z R',group2:'T Z R',is_same:true},{group1:'B L N',group2:'B L N',is_same:true},
  {group1:'S D Z',group2:'Z D S',is_same:false},{group1:'F Q R S',group2:'SH S Q F',is_same:false},
  {group1:'F Q',group2:'F Q',is_same:true},{group1:'B Y T',group2:'B Y T',is_same:true},
  {group1:'A B M Y',group2:'A B M A',is_same:false},{group1:'H KH J',group2:'H KH J',is_same:true},
  {group1:'Y R W',group2:'Y S J D',is_same:false},{group1:'D D D D',group2:'D D D D',is_same:true},
  {group1:'A GH F',group2:'A GH F',is_same:true},{group1:'Q S S',group2:'Q S S',is_same:true},
  {group1:'W Z R',group2:'R R Z W',is_same:false},{group1:'TH DH H',group2:'TH DH H',is_same:true},
  {group1:'S SH S Z',group2:'S SH S Z',is_same:true},{group1:'A L SH J R T',group2:'A L SH J R T',is_same:true},
  {group1:'TH F Q KH',group2:'Q F TH KH',is_same:false},{group1:'Y I L A',group2:'I Y L A',is_same:false},
  {group1:'T TH B',group2:'T TH B',is_same:true},{group1:'P R B',group2:'P R B',is_same:true},
];

const TASKS = {
  task1: { label: 'Word Explorer',    sub: 'Vocabulary & word recognition',  icon: 'M4 6h16M4 12h10M4 18h7' },
  task2: { label: 'Story Reader',     sub: 'Reading fluency & comprehension', icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
  task3: { label: 'Letter Detective', sub: 'Phonological awareness',          icon: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' },
  task4: { label: 'Number Memory',    sub: 'Working memory & sequencing',     icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2' },
};

// ══════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ══════════════════════════════════════════════════════════════
const Icon = ({ d, size = 14, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

function MetricCard({ label, value, accent, wide }) {
  return (
    <div style={{
      background: P.white, border: `1px solid ${P.gray200}`, borderRadius: 8,
      padding: '12px 16px', minWidth: wide ? 120 : 80, textAlign: 'center',
      borderTop: `3px solid ${accent || P.blue500}`, flex: '0 0 auto',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent || P.blue800, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{value}</div>
      <div style={{ fontSize: 10, color: P.gray400, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

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

function StatusPill({ correct, timeout }) {
  const r = timeout ? P.timeout : correct ? P.ok : P.err;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: r.bg, color: r.text, border: `1px solid ${r.border}`, whiteSpace: 'nowrap',
    }}>
      {timeout ? 'Timeout' : correct ? '✓ Correct' : '✗ Incorrect'}
    </span>
  );
}

function SectionHeader({ title, count, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      margin: '20px 0 10px', paddingBottom: 8, borderBottom: `2px solid ${color || P.blue100}`,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: color || P.blue700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
      {count != null && (
        <span style={{ fontSize: 10, fontWeight: 700, background: P.blue100, color: P.blue700, borderRadius: 10, padding: '2px 8px' }}>
          {count} items
        </span>
      )}
    </div>
  );
}

function ScoreBar({ label, score }) {
  const r = getRisk(score != null ? Number(score) : null);
  const num = score != null ? Number(score) : null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: P.gray600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: r.text }}>{fmt(num)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: P.gray200, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${num ?? 0}%`, background: `linear-gradient(90deg, ${r.dot}88, ${r.dot})`, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function Tag({ label, correct, timeout, size = 'md' }) {
  const r = timeout ? P.timeout : correct ? P.ok : P.err;
  return (
    <span style={{
      display: 'inline-block', padding: size === 'lg' ? '6px 14px' : '4px 10px', margin: '3px',
      borderRadius: 6, fontSize: size === 'lg' ? 14 : 12, fontWeight: 700, fontFamily: 'monospace',
      background: r.bg, color: r.text, border: `1.5px solid ${r.border}`,
      whiteSpace: 'nowrap', lineHeight: 1.6, letterSpacing: '0.02em',
    }}>
      {label}
    </span>
  );
}

function Empty({ msg = 'No data available.' }) {
  return (
    <div style={{ padding: '14px 16px', background: P.blue50, borderRadius: 8, border: `1px solid ${P.blue100}`, color: P.gray400, fontSize: 12, textAlign: 'center' }}>
      {msg}
    </div>
  );
}

function DataTable({ rows, columns, emptyMessage = 'No data recorded.' }) {
  if (!rows || rows.length === 0) return <Empty msg={emptyMessage} />;
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

// ══════════════════════════════════════════════════════════════
// TASK 1 — Word Explorer
// ══════════════════════════════════════════════════════════════
function Task1Detail({ data }) {
  if (!data) return <Empty msg="Task 1 has not been completed yet." />;
  const rc = getRisk(data.percentage);

  const similarCorrect    = Math.min(20, Math.max(0, Math.round(Number(data.similar_words_score    ?? 0))));
  const nonSimilarCorrect = Math.min(20, Math.max(0, Math.round(Number(data.non_similar_words_score ?? 0))));
  const pseudoCorrect     = Math.min(20, Math.max(0, Math.round(Number(data.pseudo_words_score     ?? 0))));

  // error_patterns is a flat array of wrong word strings from your API
  const errorSet = new Set(
    Array.isArray(data.error_patterns)
      ? data.error_patterns.map(w => (typeof w === 'string' ? w : (w.word || '')).toLowerCase())
      : []
  );

  const buildWords = (list) => list.map(w => ({ word: w, correct: !errorSet.has(w.toLowerCase()) }));

  const similarWords    = buildWords(T1_SIMILAR);
  const nonSimilarWords = buildWords(T1_NON_SIMILAR);
  const pseudoWords     = buildWords(T1_PSEUDO);

  const allWrong = [
    ...similarWords.filter(w => !w.correct).map(w => ({ ...w, category: 'Similar' })),
    ...nonSimilarWords.filter(w => !w.correct).map(w => ({ ...w, category: 'Everyday' })),
    ...pseudoWords.filter(w => !w.correct).map(w => ({ ...w, category: 'Pseudo' })),
  ];

  const totalCorrect   = (data.total_score ?? (similarCorrect + nonSimilarCorrect + pseudoCorrect));
  const totalIncorrect = (data.total_words ?? 60) - totalCorrect;

  const CategorySection = ({ title, words, correctCount, color }) => {
    const wrong = words.filter(w => !w.correct);
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: P.blue800 }}>{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: P.ok.text, fontWeight: 700 }}>{correctCount}/20 correct</span>
            <span style={{ fontSize: 11, color: P.err.text, fontWeight: 700 }}>{20 - correctCount} errors</span>
            <RiskBadge score={Math.round((correctCount / 20) * 100)} />
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {words.map((w, i) => <Tag key={i} label={w.word} correct={w.correct} />)}
        </div>
        {wrong.length > 0 && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: P.err.bg, borderRadius: 6, border: `1px solid ${P.err.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.err.text, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Incorrect — {wrong.length} word{wrong.length > 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {wrong.map((w, i) => <span key={i} style={{ fontFamily: 'monospace', fontWeight: 700, color: P.err.text, fontSize: 12 }}>{w.word}</span>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <MetricCard label="Overall Score" value={fmt(data.percentage)} accent={rc.dot} wide />
        <MetricCard label="Total Words"   value={data.total_words ?? 60} />
        <MetricCard label="Correct"       value={totalCorrect}    accent={P.ok.dot}  />
        <MetricCard label="Incorrect"     value={totalIncorrect}  accent={P.err.dot} />
      </div>
      <SectionHeader title="Score by Category" />
      <ScoreBar label="Similar Words — Twin Words (20)"   score={Math.round((similarCorrect / 20) * 100)} />
      <ScoreBar label="Everyday Words — Non-Similar (20)" score={Math.round((nonSimilarCorrect / 20) * 100)} />
      <ScoreBar label="Pseudo Words — Funny Words (20)"   score={Math.round((pseudoCorrect / 20) * 100)} />
      <SectionHeader title="Category 1 — Similar (Twin) Words" count={20} />
      <CategorySection title="Similar Words"  words={similarWords}    correctCount={similarCorrect}    color={P.blue600} />
      <SectionHeader title="Category 2 — Everyday (Non-Similar) Words" count={20} />
      <CategorySection title="Everyday Words" words={nonSimilarWords} correctCount={nonSimilarCorrect} color={P.mild.dot} />
      <SectionHeader title="Category 3 — Pseudo (Funny) Words" count={20} />
      <CategorySection title="Pseudo Words"   words={pseudoWords}     correctCount={pseudoCorrect}     color={P.mod.dot} />
      {allWrong.length > 0 ? (
        <>
          <SectionHeader title="All Incorrect Words — Summary" count={allWrong.length} color={P.err.text} />
          <DataTable
            rows={allWrong}
            emptyMessage="No errors."
            columns={[
              { key: 'category', label: 'Category',   render: v => <span style={{ fontSize: 11, background: P.blue100, color: P.blue700, borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>{v}</span> },
              { key: 'word',     label: 'Word Shown', render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: P.blue800, fontSize: 13 }}>{v}</span> },
              { key: 'correct',  label: 'Status',     render: () => <StatusPill correct={false} /> },
            ]}
          />
        </>
      ) : (
        <div style={{ marginTop: 16, padding: '12px 16px', background: P.ok.bg, borderRadius: 8, border: `1px solid ${P.ok.border}`, color: P.ok.text, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
          ✓ Perfect score — no errors recorded on Task 1
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TASK 2 — Story Reader
// ══════════════════════════════════════════════════════════════
const STORY_WORDS = ['She','eats','bread','and','drinks','outside','to','play','with','her','friend','Sara','in','Lina','finds','Sara','and','they','are','very','happy.','After','playing,','they','sit','under','a','tree'];

function Task2Detail({ data }) {
  if (!data) return <Empty msg="Task 2 has not been completed yet." />;
  const rc = getRisk(data.percentage);
  const rawDetails = data.word_details || data.wordDetails || data.details || [];
  let allWords;
  if (Array.isArray(rawDetails) && rawDetails.length > 0) {
    if (rawDetails[0]?.index !== undefined) {
      allWords = STORY_WORDS.map((word, i) => {
        const e = rawDetails.find(d => d.index === i);
        return { word, correct: !e, userAnswer: e?.spoken || word, correctAnswer: word, timeout: e?.timeout || false };
      });
    } else {
      allWords = rawDetails.map(item => ({
        word: item.word || item.expected || '',
        correct: item.correct === true || item.is_correct === true || item.isCorrect === true,
        userAnswer: item.userAnswer || item.answer || item.spoken || '',
        correctAnswer: item.expected || item.word || '',
        timeout: item.is_timeout || item.timeout || false,
      }));
    }
  } else {
    allWords = STORY_WORDS.map(w => ({ word: w, correct: true, userAnswer: w, correctAnswer: w, timeout: false }));
  }
  const wrongWords   = allWords.filter(w => !w.correct && !w.timeout);
  const timeoutWords = allWords.filter(w => w.timeout);
  const correctCount = allWords.filter(w => w.correct).length;
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <MetricCard label="Score"     value={fmt(data.percentage)}                        accent={rc.dot} wide />
        <MetricCard label="Total"     value={data.total_words ?? allWords.length} />
        <MetricCard label="Correct"   value={data.correct_count   ?? correctCount}         accent={P.ok.dot}      />
        <MetricCard label="Incorrect" value={data.incorrect_count ?? wrongWords.length}    accent={P.err.dot}     />
        <MetricCard label="Timeout"   value={data.timeout_count   ?? timeoutWords.length}  accent={P.timeout.dot} />
      </div>
      <SectionHeader title="Complete Story — All Words" count={allWords.length} />
      <div style={{ background: P.blue50, border: `1px solid ${P.blue100}`, borderRadius: 10, padding: 16, marginBottom: 20, lineHeight: 2.4 }}>
        {allWords.map((w, i) => <Tag key={i} label={w.word || `w${i+1}`} correct={w.correct} timeout={w.timeout} size="lg" />)}
      </div>
      <SectionHeader title="Incorrect Words" count={wrongWords.length} color={P.err.text} />
      <DataTable
        rows={wrongWords}
        emptyMessage="No incorrect words — all story words read correctly."
        columns={[
          { key: 'word',         label: 'Word Shown',    render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: P.blue800, fontSize: 13 }}>{v || '—'}</span> },
          { key: 'userAnswer',   label: 'Child Said',    render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: P.err.text, fontSize: 13 }}>{v || '—'}</span> },
          { key: 'correctAnswer',label: 'Correct Answer',render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: P.ok.text,  fontSize: 13 }}>{v || '—'}</span> },
          { key: 'correct',      label: 'Status',        render: (v, row) => <StatusPill correct={false} timeout={row.timeout} /> },
        ]}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TASK 3 — Letter Detective
// ══════════════════════════════════════════════════════════════
function Task3Detail({ data }) {
  if (!data) return <Empty msg="Task 3 has not been completed yet." />;
  const rc = getRisk(data.percentage);
  const rawItems = Array.isArray(data.comparison_details) && data.comparison_details.length > 0
    ? data.comparison_details : T3_FALLBACK;

  const items = rawItems.map((item, idx) => ({
    idx: item.comparison_number || idx + 1,
    g1: item.group1 || '',
    g2: item.group2 || '',
    correct: item.is_correct === 1 || item.is_correct === true,
    timeout: !!(item.is_timeout || item.timeout),
    userLabel: item.user_answer == null ? '—' : String(item.user_answer),
    expectedLabel: (item.expected_same === 1 || item.expected_same === true) ? 'Same' : 'Different',
  }));

  const wrongItems = items.filter(it => !it.correct);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <MetricCard label="Score"     value={fmt(data.percentage)}     accent={rc.dot} wide />
        <MetricCard label="Total"     value={data.total_comparisons ?? items.length} />
        <MetricCard label="Correct"   value={data.correct_count}       accent={P.ok.dot}      />
        <MetricCard label="Incorrect" value={data.incorrect_count}     accent={P.err.dot}     />
        <MetricCard label="Timeout"   value={data.timeout_count}       accent={P.timeout.dot} />
        <MetricCard label="Time"      value={fmtSec(data.total_time_seconds)} wide />
      </div>
      <SectionHeader title="All Letter Pair Comparisons" count={items.length} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8, marginBottom: 20 }}>
        {items.map((it) => {
          const r = it.timeout ? P.timeout : it.correct ? P.ok : P.err;
          return (
            <div key={it.idx} style={{ background: r.bg, border: `1.5px solid ${r.border}`, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: P.gray400 }}>#{it.idx}</span>
                <StatusPill correct={it.correct} timeout={it.timeout} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontFamily: 'Georgia,serif', fontWeight: 800, fontSize: 16, color: P.blue900, letterSpacing: 3, background: P.white, borderRadius: 6, padding: '4px 10px', border: `1px solid ${P.gray200}`, flex: 1, textAlign: 'center' }}>{it.g1}</div>
                <span style={{ fontSize: 10, color: P.gray400, fontWeight: 700 }}>vs</span>
                <div style={{ fontFamily: 'Georgia,serif', fontWeight: 800, fontSize: 16, color: P.blue900, letterSpacing: 3, background: P.white, borderRadius: 6, padding: '4px 10px', border: `1px solid ${P.gray200}`, flex: 1, textAlign: 'center' }}>{it.g2}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: P.gray600 }}>Correct: <strong style={{ color: P.ok.text }}>{it.expectedLabel}</strong></span>
                <span style={{ color: P.gray600 }}>Said: <strong style={{ color: it.correct ? P.ok.text : P.err.text }}>{it.userLabel}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
      <SectionHeader title="Incorrect Comparisons" count={wrongItems.length} color={P.err.text} />
      <DataTable
        rows={wrongItems}
        emptyMessage="No incorrect comparisons."
        columns={[
          { key: 'idx',           label: '#',          render: v => <span style={{ color: P.gray400, fontWeight: 700 }}>{v}</span> },
          { key: 'g1',            label: 'Group A',    render: v => <span style={{ fontFamily: 'Georgia,serif', fontWeight: 800, fontSize: 17, letterSpacing: 3, color: P.blue900 }}>{v}</span> },
          { key: 'g2',            label: 'Group B',    render: v => <span style={{ fontFamily: 'Georgia,serif', fontWeight: 800, fontSize: 17, letterSpacing: 3, color: P.blue900 }}>{v}</span> },
          { key: 'userLabel',     label: 'Child Said', render: v => <span style={{ fontWeight: 700, color: P.err.text }}>{v}</span> },
          { key: 'expectedLabel', label: 'Should Be',  render: v => <span style={{ fontWeight: 700, color: P.ok.text  }}>{v}</span> },
          { key: 'correct',       label: 'Status',     render: (v, row) => <StatusPill correct={false} timeout={row.timeout} /> },
        ]}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TASK 4 — Number Memory
//
// Real API shape confirmed:
//   data.sequence = [ { forward: { input: "4 7 ", correct: true,  expected: [4,7] } }, … ]
//   data.reversal  = [ { reverse: { input: "7 4 ", correct: true,  expected: [7,4] } }, … ]
//   data.seq_percentage, seq_correct, seq_incorrect, seq_timeout, seq_time_seconds
//   data.rev_percentage, rev_correct, rev_incorrect, rev_timeout, rev_time_seconds
//   data.overall_percentage
// ══════════════════════════════════════════════════════════════

/**
 * Parse [ { forward|reverse: { input, correct, expected } } ] → normalised items.
 */
function parseSeqItems(rawArr) {
  if (!Array.isArray(rawArr) || rawArr.length === 0) return [];
  return rawArr.map((el, i) => {
    const inner = el.forward || el.reverse || el;          // unwrap wrapper key
    const expected = inner.expected ?? null;               // [4, 7]
    const input    = inner.input    ?? null;               // "4 7 "
    const correct  = inner.correct === true || inner.correct === 1;
    const timeout  = !!(inner.is_timeout || inner.timeout);

    // "4 → 7"
    const shownSeq = Array.isArray(expected)
      ? expected.join(' → ')
      : expected != null ? String(expected).trim() : '—';

    // "4 → 7" from child's space-separated input
    const childSeq = input != null && String(input).trim() !== ''
      ? String(input).trim().replace(/\s+/g, ' → ')
      : '—';

    return { idx: i + 1, shownSeq, childSeq, correct, timeout };
  });
}

/** Green card for correct, red card for incorrect */
function SeqCard({ item }) {
  const palette = item.timeout ? P.timeout : item.correct ? P.ok : P.err;
  const icon    = item.timeout ? '⏱' : item.correct ? '✓' : '✗';
  const label   = item.timeout ? 'Timeout' : item.correct ? 'Correct' : 'Incorrect';
  return (
    <div style={{
      background: palette.bg, border: `2px solid ${palette.border}`,
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: P.gray400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          #{item.idx}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: palette.text, background: P.white, border: `1px solid ${palette.border}`, borderRadius: 4, padding: '2px 8px' }}>
          {icon} {label}
        </span>
      </div>

      {/* Sequence shown */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: P.gray400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Sequence shown
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 24, fontWeight: 900, color: P.blue900,
          letterSpacing: 4, background: P.white, border: `1px solid ${P.gray200}`,
          borderRadius: 6, padding: '6px 12px', textAlign: 'center',
        }}>
          {item.shownSeq}
        </div>
      </div>

      {/* Child's answer */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: P.gray400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Child answered
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 20, fontWeight: 800,
          color: palette.text, letterSpacing: 4,
          background: P.white, border: `1.5px solid ${palette.border}`,
          borderRadius: 6, padding: '6px 12px', textAlign: 'center',
        }}>
          {item.childSeq !== '—'
            ? item.childSeq
            : <span style={{ color: P.gray400, fontSize: 13, fontWeight: 400, letterSpacing: 0 }}>No answer recorded</span>
          }
        </div>
      </div>
    </div>
  );
}

function Task4Section({ title, items, pct, correct, incorrect, timeout, timeSec }) {
  const rc = getRisk(pct);
  const correctItems   = items.filter(it =>  it.correct && !it.timeout);
  const incorrectItems = items.filter(it => !it.correct);

  return (
    <div style={{ marginBottom: 36 }}>
      {/* title bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${P.blue100}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 20, borderRadius: 2, background: P.blue500, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: P.blue900 }}>{title}</span>
        </div>
        <RiskBadge score={pct} />
      </div>

      {/* metric cards */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        <MetricCard label="Score"     value={fmt(pct)}      accent={rc.dot} wide />
        <MetricCard label="Total"     value={items.length} />
        <MetricCard label="Correct"   value={correct   ?? correctItems.length}   accent={P.ok.dot}      />
        <MetricCard label="Incorrect" value={incorrect ?? incorrectItems.length}  accent={P.err.dot}     />
        {(timeout ?? 0) > 0 && <MetricCard label="Timeout" value={timeout} accent={P.timeout.dot} />}
        {timeSec != null && <MetricCard label="Time" value={fmtSec(timeSec)} wide />}
      </div>

      {/* ✓ Correct grid */}
      {correctItems.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: P.ok.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: P.ok.text, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Correct — {correctItems.length} sequence{correctItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, marginBottom: 20 }}>
            {correctItems.map(it => <SeqCard key={it.idx} item={it} />)}
          </div>
        </>
      )}

      {/* ✗ Incorrect grid */}
      {incorrectItems.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: P.err.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: P.err.text, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Incorrect — {incorrectItems.length} sequence{incorrectItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, marginBottom: 20 }}>
            {incorrectItems.map(it => <SeqCard key={it.idx} item={it} />)}
          </div>
        </>
      )}

      {/* Summary table — all items sorted by index */}
      <SectionHeader title="All Results" count={items.length} />
      <DataTable
        rows={[...items].sort((a, b) => a.idx - b.idx)}
        emptyMessage="No sequence data."
        columns={[
          { key: 'idx',      label: '#',              render: v => <span style={{ color: P.gray400, fontWeight: 700 }}>#{v}</span> },
          { key: 'shownSeq', label: 'Sequence Shown', render: v => (
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: P.blue900, fontSize: 16, letterSpacing: 3 }}>{v}</span>
          )},
          { key: 'childSeq', label: "Child's Answer",  render: (v, row) => (
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, letterSpacing: 3, color: row.correct ? P.ok.text : P.err.text }}>
              {v !== '—' ? v : <span style={{ color: P.gray400, fontSize: 12, fontWeight: 400, letterSpacing: 0 }}>—</span>}
            </span>
          )},
          { key: 'correct', label: 'Status', render: (v, row) => <StatusPill correct={row.correct} timeout={row.timeout} /> },
        ]}
      />
    </div>
  );
}

function Task4Detail({ data }) {
  if (!data) return <Empty msg="Task 4 has not been completed yet." />;

  const overallPct = data.overall_percentage ?? data.overallPercentage ?? data.percentage ?? null;
  const rc = getRisk(overallPct);

  // data.sequence and data.reversal are both arrays of { forward:{...} } / { reverse:{...} }
  const seqItems = parseSeqItems(data.sequence ?? []);
  const revItems = parseSeqItems(data.reversal  ?? []);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <MetricCard label="Overall Score" value={fmt(overallPct)} accent={rc.dot} wide />
      </div>

      {seqItems.length > 0 && (
        <Task4Section
          title="Forward Number Sequence"
          items={seqItems}
          pct={data.seq_percentage}
          correct={data.seq_correct}
          incorrect={data.seq_incorrect}
          timeout={data.seq_timeout ?? 0}
          timeSec={data.seq_time_seconds}
        />
      )}

      {revItems.length > 0 && (
        <Task4Section
          title="Reverse Number Sequence"
          items={revItems}
          pct={data.rev_percentage}
          correct={data.rev_correct}
          incorrect={data.rev_incorrect}
          timeout={data.rev_timeout ?? 0}
          timeSec={data.rev_time_seconds}
        />
      )}

      {seqItems.length === 0 && revItems.length === 0 && (
        <Empty msg="No sequence data available for Task 4." />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ERROR BOUNDARY
// ══════════════════════════════════════════════════════════════
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('💥 Task render error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: P.err.bg, borderRadius: 12, border: `2px solid ${P.err.border}`, color: P.err.text, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Render Error</h3>
          <p style={{ fontSize: 13, marginBottom: 16 }}>{this.state.error?.message || 'Task failed to render'}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: P.blue500, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Reload Page
          </button>
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
    setLoading(true);
    setError('');
    fetchTaskDetails(childSessionId)
      .then(data => {
        console.log('📊 ChildAssessmentDetail loaded:', data);
        setDetails(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('💥 fetchTaskDetails error:', err);
        setError(err.message || 'Failed to load assessment data');
        setLoading(false);
      });
  }, [childSessionId]);

  if (loading) return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: 28, height: 28, margin: '0 auto 12px', border: `3px solid ${P.gray200}`, borderTop: `3px solid ${P.blue500}`, borderRadius: '50%', animation: 'cad-spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 13, color: P.gray400 }}>Loading assessment data…</div>
      <style>{`@keyframes cad-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ margin: '8px 0', padding: '14px 16px', background: P.err.bg, border: `1px solid ${P.err.border}`, borderRadius: 8, color: P.err.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" size={15} color={P.err.text} />
      {error}
    </div>
  );

  if (!details) return null;

  const tabList = ['task1', 'task2', 'task3', 'task4'];
  const getTask4Score = (d) => d?.overall_percentage ?? d?.overallPercentage ?? d?.percentage ?? null;

  const scores = tabList.map(t => {
    const raw = t === 'task4' ? getTask4Score(details[t]) : details[t]?.percentage;
    return raw != null ? Number(raw) : null;
  }).filter(s => s != null && !isNaN(s));
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const safeTab = tabList.includes(activeTab) ? activeTab : 'task1';

  return (
    <ErrorBoundary>
      <div style={{ background: P.white, borderRadius: '0 0 12px 12px', border: `1px solid ${P.gray200}`, boxShadow: '0 4px 24px rgba(15,39,68,0.07)', marginTop: 8 }}>

        {/* Overall summary bar */}
        {avgScore != null && (
          <div style={{ background: `linear-gradient(135deg, ${P.blue800}, ${P.blue700})`, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: P.blue100, fontWeight: 600 }}>Average across all completed tasks</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{avgScore}%</span>
              <RiskBadge score={avgScore} />
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', background: P.gray50, borderBottom: `1px solid ${P.gray200}`, overflowX: 'auto' }}>
          {tabList.map(t => {
            const meta  = TASKS[t];
            const rawScore = t === 'task4' ? getTask4Score(details[t]) : details[t]?.percentage;
            const score  = rawScore != null ? Number(rawScore) : null;
            const rc     = getRisk(score);
            const active = safeTab === t;
            const hasData = !!details[t];
            return (
              <button key={t} onClick={() => onTabChange(t)} style={{
                flex: '1 1 0', minWidth: 110, padding: '14px 10px 12px',
                border: 'none', borderBottom: active ? `3px solid ${P.blue500}` : '3px solid transparent',
                background: active ? P.white : 'transparent', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'background 0.15s', opacity: hasData ? 1 : 0.6,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: active ? P.blue100 : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={meta.icon} size={14} color={active ? P.blue600 : P.gray400} />
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? P.blue800 : P.gray600, whiteSpace: 'nowrap' }}>
                  {meta.label}
                </span>
                {score != null ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 10, padding: '1px 7px' }}>
                    {fmt(score)}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: P.gray400, background: P.gray100, borderRadius: 10, padding: '1px 7px' }}>
                    {hasData ? 'N/A' : 'Not done'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active task sub-header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 12px', borderBottom: `1px solid ${P.gray100}`, background: P.white }}>
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
            <RiskBadge score={safeTab === 'task4' ? getTask4Score(details[safeTab]) : details[safeTab]?.percentage} />
          )}
        </div>

        {/* Task content */}
        <div style={{ padding: '20px 24px 32px', overflowX: 'auto' }}>
          <ErrorBoundary>
            {safeTab === 'task1' && <Task1Detail data={details.task1} />}
            {safeTab === 'task2' && <Task2Detail data={details.task2} />}
            {safeTab === 'task3' && <Task3Detail data={details.task3} />}
            {safeTab === 'task4' && <Task4Detail data={details.task4} />}
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}
export function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printSessionPDF(session, results) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  const rowsHtml = results
    .map(
      (r) => `
      <tr>
        <td>#${r.final_rank}</td>
        <td><strong>${r.nickname}</strong></td>
        <td>${r.final_score}</td>
        <td>${r.correct_count} / ${r.total_questions}</td>
        <td>${(r.total_response_ms / 1000).toFixed(2)}s</td>
      </tr>`
    )
    .join('');

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>muchhad-quiz Report - ${session.quiz_title}</title>
      <style>
        body { font-family: monospace; padding: 32px; background: #FFF8E7; color: #000; }
        h1 { border: 4px solid #000; background: #FFE500; padding: 12px 16px; box-shadow: 6px 6px 0 #000; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; background: #fff; }
        th, td { border: 3px solid #000; padding: 10px; text-align: left; }
        th { background: #00E5FF; }
      </style>
    </head>
    <body>
      <h1>MUCHHAD-QUIZ SESSION REPORT: ${session.quiz_title}</h1>
      <p><strong>PIN:</strong> ${session.pin} | <strong>Players:</strong> ${results.length} | <strong>Date:</strong> ${new Date(session.created_at).toLocaleString()}</p>
      <table>
        <thead>
          <tr><th>Rank</th><th>Nickname</th><th>Score</th><th>Correct</th><th>Response Time</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `);
  win.document.close();
}

export function downloadResultCardPNG({ nickname, rank, totalPlayers, score, correctCount, totalQuestions, quizTitle }) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 520;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFE500';
  ctx.fillRect(0, 0, 900, 520);

  // Inner card shadow
  ctx.fillStyle = '#000000';
  ctx.fillRect(52, 52, 808, 428);

  // Inner card
  ctx.fillStyle = '#FFF8E7';
  ctx.fillRect(40, 40, 808, 428);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(40, 40, 808, 428);

  // Header strip
  ctx.fillStyle = '#FF4D8D';
  ctx.fillRect(40, 40, 808, 76);
  ctx.strokeRect(40, 40, 808, 76);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('MUCHHAD-QUIZ // RESULT CARD', 68, 90);

  ctx.font = 'bold 24px monospace';
  ctx.fillText(String(quizTitle || 'LIVE QUIZ').slice(0, 42), 68, 160);

  ctx.font = 'bold 54px sans-serif';
  ctx.fillText(String(nickname || 'PLAYER'), 68, 228);

  // Rank badge
  ctx.fillStyle = '#00E5FF';
  ctx.fillRect(68, 265, 220, 145);
  ctx.strokeRect(68, 265, 220, 145);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('FINAL RANK', 88, 300);
  ctx.font = 'bold 58px monospace';
  ctx.fillText(`#${rank}`, 88, 365);
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`OF ${totalPlayers}`, 88, 395);

  // Score badge
  ctx.fillStyle = '#B6FF00';
  ctx.fillRect(318, 265, 250, 145);
  ctx.strokeRect(318, 265, 250, 145);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('TOTAL SCORE', 338, 300);
  ctx.font = 'bold 54px monospace';
  ctx.fillText(String(score), 338, 368);

  // Accuracy badge
  ctx.fillStyle = '#FF7A00';
  ctx.fillRect(598, 265, 220, 145);
  ctx.strokeRect(598, 265, 220, 145);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('ACCURACY', 618, 300);
  ctx.font = 'bold 48px monospace';
  ctx.fillText(`${correctCount}/${totalQuestions}`, 618, 368);

  const link = document.createElement('a');
  link.download = `muchhad-quiz-${nickname}-rank${rank}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

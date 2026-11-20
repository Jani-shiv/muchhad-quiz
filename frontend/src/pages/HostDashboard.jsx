import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Play, Trash2, Copy, ArrowUp, ArrowDown, Upload,
  Download, FileText, LogOut, History, Layers,
} from 'lucide-react';
import { apiFetch, setHostToken } from '../utils/api';
import { downloadCSV, printSessionPDF } from '../utils/exportUtils';
import { TopBarControls } from '../components/TopBarControls';

const EMPTY_QUESTION = () => ({
  type: 'single_choice',
  text: '',
  imageUrl: '',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctAnswer: 0,
  timeLimit: 20,
  pointsMode: 'standard',
});

export function HostDashboard({ lang, setLang }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('quizzes'); // quizzes | editor | history
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editor state
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [settings, setSettings] = useState({
    negativeMarking: false,
    negativePenaltyRatio: 0.25,
    allowAnswerChange: false,
    enablePowerUps: true,
    enableReactions: true,
  });
  const [questions, setQuestions] = useState([EMPTY_QUESTION()]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qData, hData] = await Promise.all([
        apiFetch('/api/quizzes'),
        apiFetch('/api/sessions/history'),
      ]);
      setQuizzes(qData.quizzes || []);
      setHistory(hData.sessions || []);
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('token')) {
        setHostToken('');
        navigate('/');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startNewQuiz = () => {
    setEditingId(null);
    setTitle('New Live Quiz');
    setDescription('');
    setSettings({
      negativeMarking: false,
      negativePenaltyRatio: 0.25,
      allowAnswerChange: false,
      enablePowerUps: true,
      enableReactions: true,
    });
    setQuestions([EMPTY_QUESTION()]);
    setTab('editor');
  };

  const openEditQuiz = async (id) => {
    try {
      const data = await apiFetch(`/api/quizzes/${id}`);
      setEditingId(id);
      setTitle(data.quiz.title);
      setDescription(data.quiz.description || '');
      setSettings(data.quiz.settings || settings);
      setQuestions(
        data.questions.map((q) => ({
          type: q.type,
          text: q.text,
          imageUrl: q.image_url || '',
          options: q.options || [],
          correctAnswer: q.correct_answer,
          timeLimit: q.time_limit,
          pointsMode: q.points_mode,
        }))
      );
      setTab('editor');
    } catch (err) {
      setError(err.message);
    }
  };

  const saveQuiz = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { title, description, settings, questions };
      if (editingId) {
        await apiFetch(`/api/quizzes/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/quizzes', { method: 'POST', body: JSON.stringify(payload) });
      }
      await loadData();
      setTab('quizzes');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteQuiz = async (id) => {
    if (!confirm('Delete this quiz?')) return;
    await apiFetch(`/api/quizzes/${id}`, { method: 'DELETE' });
    loadData();
  };

  const launchSession = async (quizId) => {
    try {
      const data = await apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ quizId }),
      });
      navigate(`/host/live/${data.pin}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const moveQuestion = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    const copy = [...questions];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setQuestions(copy);
  };

  const duplicateQuestion = (idx) => {
    const copy = [...questions];
    copy.splice(idx + 1, 0, JSON.parse(JSON.stringify(questions[idx])));
    setQuestions(copy);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : parsed.questions || [];
        setQuestions((prev) => [...prev, ...list]);
      } else {
        // CSV: type,text,option1,option2,option3,option4,correctIndex,timeLimit,pointsMode
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const imported = lines.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          return {
            type: cols[0] || 'single_choice',
            text: cols[1] || 'Imported Question',
            imageUrl: '',
            options: [cols[2] || 'A', cols[3] || 'B', cols[4] || 'C', cols[5] || 'D'].filter(Boolean),
            correctAnswer: parseInt(cols[6] || '0', 10) || 0,
            timeLimit: parseInt(cols[7] || '20', 10) || 20,
            pointsMode: cols[8] || 'standard',
          };
        });
        setQuestions((prev) => [...prev, ...imported]);
      }
    } catch {
      setError('Failed to parse imported CSV/JSON file.');
    }
    e.target.value = '';
  };

  const exportSessionCSV = async (session) => {
    const data = await apiFetch(`/api/sessions/${session.id}/results`);
    downloadCSV(`quizblitz-${session.pin}.csv`, data.results || []);
  };

  const exportSessionPDF = async (session) => {
    const data = await apiFetch(`/api/sessions/${session.id}/results`);
    printSessionPDF(data.session, data.results || []);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-neo-yellow border-4 border-black shadow-neo-sm px-4 py-2">
            <span className="font-display text-2xl">HOST STUDIO</span>
          </div>
          <div className="flex border-3 border-black bg-white shadow-neo-sm">
            <button
              type="button"
              onClick={() => setTab('quizzes')}
              className={`px-4 py-2 font-bold border-r-3 border-black flex items-center gap-2 ${
                tab === 'quizzes' ? 'bg-neo-cyan' : 'bg-white'
              }`}
            >
              <Layers className="w-4 h-4" /> QUIZZES
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className={`px-4 py-2 font-bold flex items-center gap-2 ${
                tab === 'history' ? 'bg-neo-cyan' : 'bg-white'
              }`}
            >
              <History className="w-4 h-4" /> HISTORY
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TopBarControls lang={lang} setLang={setLang} />
          <button
            type="button"
            onClick={() => {
              setHostToken('');
              navigate('/');
            }}
            className="neo-btn bg-neo-pink px-3 py-2 flex items-center gap-1.5 text-sm"
          >
            <LogOut className="w-4 h-4" /> LOGOUT
          </button>
        </div>
      </header>

      {error && (
        <div className="neo-card-sm bg-neo-pink p-3 mb-4 font-bold">{error}</div>
      )}

      {tab === 'quizzes' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-display text-3xl">YOUR QUIZZES</h1>
            <button
              type="button"
              onClick={startNewQuiz}
              className="neo-btn bg-neo-lime px-5 py-3 flex items-center gap-2 text-lg"
            >
              <Plus className="w-5 h-5" /> NEW QUIZ
            </button>
          </div>

          {loading ? (
            <div className="neo-card bg-white p-8 font-mono font-bold">LOADING...</div>
          ) : quizzes.length === 0 ? (
            <div className="neo-card bg-white p-8 text-center">
              <p className="font-bold text-xl mb-4">No quizzes yet. Build your first arena!</p>
              <button type="button" onClick={startNewQuiz} className="neo-btn bg-neo-yellow px-6 py-3">
                CREATE QUIZ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((q) => (
                <div key={q.id} className="neo-card bg-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-display text-2xl">{q.title}</h2>
                      <span className="bg-neo-yellow border-2 border-black px-2 py-0.5 font-mono text-xs font-bold">
                        {q.question_count} Qs
                      </span>
                    </div>
                    <p className="text-sm font-medium opacity-80 mb-4">{q.description || 'No description'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 border-t-3 border-black">
                    <button
                      type="button"
                      onClick={() => launchSession(q.id)}
                      className="neo-btn bg-neo-lime px-4 py-2 flex items-center gap-1.5 text-sm"
                    >
                      <Play className="w-4 h-4 fill-black" /> HOST LIVE
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditQuiz(q.id)}
                      className="neo-btn bg-neo-cyan px-4 py-2 text-sm"
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuiz(q.id)}
                      className="neo-btn bg-neo-pink px-3 py-2 text-sm ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'editor' && (
        <form onSubmit={saveQuiz} className="space-y-6">
          <div className="neo-card bg-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="font-display text-2xl">{editingId ? 'EDIT QUIZ' : 'CREATE QUIZ'}</h1>
              <label className="neo-btn bg-neo-cyan px-4 py-2 text-sm flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> IMPORT CSV/JSON
                <input type="file" accept=".csv,.json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Quiz Title"
                className="neo-input w-full"
                required
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short Description"
                className="neo-input w-full"
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { key: 'allowAnswerChange', label: 'Allow Answer Change' },
                { key: 'negativeMarking', label: 'Negative Marking (-25%)' },
                { key: 'enablePowerUps', label: 'Power-Ups (50/50 & 2X)' },
                { key: 'enableReactions', label: 'Emoji Reactions' },
              ].map((s) => (
                <label key={s.key} className="flex items-center gap-2 font-bold text-sm bg-neo-cream border-2 border-black px-3 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings[s.key])}
                    onChange={(e) => setSettings({ ...settings, [s.key]: e.target.checked })}
                    className="w-4 h-4 accent-black"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {questions.map((q, idx) => (
            <div key={idx} className="neo-card bg-white p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-3 border-black">
                <span className="font-mono font-bold bg-neo-yellow border-2 border-black px-3 py-1">
                  Q#{idx + 1}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={q.type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      let nextOpts = q.options;
                      let nextAns = q.correctAnswer;
                      if (nextType === 'true_false') {
                        nextOpts = ['True', 'False'];
                        nextAns = 0;
                      } else if (nextType === 'multiple_choice') {
                        nextAns = Array.isArray(q.correctAnswer) ? q.correctAnswer : [0];
                      } else if (nextType === 'type_answer') {
                        nextOpts = [];
                        nextAns = ['answer'];
                      } else if (nextType === 'poll') {
                        nextAns = null;
                        if (nextOpts.length < 2) nextOpts = ['Option A', 'Option B'];
                      } else if (nextOpts.length < 2) {
                        nextOpts = ['Option A', 'Option B', 'Option C', 'Option D'];
                        nextAns = 0;
                      }
                      updateQuestion(idx, { type: nextType, options: nextOpts, correctAnswer: nextAns });
                    }}
                    className="neo-input py-1.5 text-sm"
                  >
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="type_answer">Type Answer</option>
                    <option value="poll">Poll (No Score)</option>
                  </select>

                  <select
                    value={q.timeLimit}
                    onChange={(e) => updateQuestion(idx, { timeLimit: Number(e.target.value) })}
                    className="neo-input py-1.5 text-sm font-mono"
                  >
                    {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((sec) => (
                      <option key={sec} value={sec}>{sec}s</option>
                    ))}
                  </select>

                  <select
                    value={q.pointsMode}
                    onChange={(e) => updateQuestion(idx, { pointsMode: e.target.value })}
                    className="neo-input py-1.5 text-sm"
                  >
                    <option value="standard">Standard (1000)</option>
                    <option value="double">Double (2000)</option>
                    <option value="none">No Points (0)</option>
                  </select>

                  <button type="button" onClick={() => moveQuestion(idx, -1)} className="neo-btn bg-white p-2"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => moveQuestion(idx, 1)} className="neo-btn bg-white p-2"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => duplicateQuestion(idx)} className="neo-btn bg-neo-cyan p-2"><Copy className="w-4 h-4" /></button>
                  <button type="button" onClick={() => removeQuestion(idx)} className="neo-btn bg-neo-pink p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                  placeholder="Enter question text..."
                  className="neo-input md:col-span-2"
                  required
                />
                <input
                  type="text"
                  value={q.imageUrl || ''}
                  onChange={(e) => updateQuestion(idx, { imageUrl: e.target.value })}
                  placeholder="Optional Image URL"
                  className="neo-input"
                />
              </div>

              {q.type === 'type_answer' ? (
                <div>
                  <label className="block font-bold text-xs mb-1">ACCEPTED ANSWERS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    value={Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer || ''}
                    onChange={(e) =>
                      updateQuestion(idx, {
                        correctAnswer: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    className="neo-input w-full"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, optIdx) => {
                    const isChecked =
                      q.type === 'multiple_choice'
                        ? Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIdx)
                        : q.correctAnswer === optIdx;

                    return (
                      <div key={optIdx} className="flex items-center gap-2">
                        {q.type !== 'poll' && (
                          <input
                            type={q.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                            name={`correct-${idx}`}
                            checked={Boolean(isChecked)}
                            onChange={() => {
                              if (q.type === 'multiple_choice') {
                                const prevArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                                const nextArr = prevArr.includes(optIdx)
                                  ? prevArr.filter((n) => n !== optIdx)
                                  : [...prevArr, optIdx];
                                updateQuestion(idx, { correctAnswer: nextArr.length ? nextArr : [0] });
                              } else {
                                updateQuestion(idx, { correctAnswer: optIdx });
                              }
                            }}
                            className="w-5 h-5 accent-black shrink-0"
                          />
                        )}
                        <input
                          type="text"
                          value={opt}
                          disabled={q.type === 'true_false'}
                          onChange={(e) => {
                            const nextOpts = [...q.options];
                            nextOpts[optIdx] = e.target.value;
                            updateQuestion(idx, { options: nextOpts });
                          }}
                          className="neo-input flex-1"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-wrap justify-between gap-4">
            <button
              type="button"
              onClick={() => setQuestions([...questions, EMPTY_QUESTION()])}
              className="neo-btn bg-neo-cyan px-5 py-3 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> ADD QUESTION
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTab('quizzes')}
                className="neo-btn bg-white px-5 py-3"
              >
                CANCEL
              </button>
              <button type="submit" className="neo-btn bg-neo-lime px-8 py-3 font-display text-lg">
                SAVE QUIZ
              </button>
            </div>
          </div>
        </form>
      )}

      {tab === 'history' && (
        <div className="neo-card bg-white p-6">
          <h1 className="font-display text-2xl mb-4">SESSION HISTORY</h1>
          {history.length === 0 ? (
            <p className="font-bold opacity-70">No sessions hosted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neo-yellow border-3 border-black text-left">
                    <th className="p-3 border-2 border-black">Quiz</th>
                    <th className="p-3 border-2 border-black">PIN</th>
                    <th className="p-3 border-2 border-black">Players</th>
                    <th className="p-3 border-2 border-black">Status</th>
                    <th className="p-3 border-2 border-black">Export</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((s) => (
                    <tr key={s.id} className="border-2 border-black font-bold">
                      <td className="p-3 border-2 border-black">{s.quiz_title}</td>
                      <td className="p-3 border-2 border-black font-mono">{s.pin}</td>
                      <td className="p-3 border-2 border-black font-mono">{s.player_count}</td>
                      <td className="p-3 border-2 border-black">{s.status}</td>
                      <td className="p-3 border-2 border-black flex gap-2">
                        <button
                          type="button"
                          onClick={() => exportSessionCSV(s)}
                          className="neo-btn bg-neo-cyan px-3 py-1 text-xs flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => exportSessionPDF(s)}
                          className="neo-btn bg-neo-pink px-3 py-1 text-xs flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

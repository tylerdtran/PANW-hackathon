import { useState, useEffect } from 'react';
import Head from 'next/head';
import JournalEntry from '../components/JournalEntry';
import JournalDashboard from '../components/JournalDashboard';
import InsightSummary from '../components/InsightSummary';
import { JournalEntry as JournalEntryType } from '../types/journal';
import { analyzeJournalEntry } from '../lib/gemini';

function getDateKey(dateStr: string) {
  const d = new Date(dateStr);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function calculateCurrentStreak(entries: JournalEntryType[]): number {
  if (!entries || entries.length === 0) return 0;
  const uniqueDays = Array.from(new Set(entries.map(e => getDateKey(e.timestamp)))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  let cursor = new Date();
  // normalize cursor to current day key
  let cursorKey = getDateKey(cursor.toISOString());
  for (let i = 0; i < uniqueDays.length; i++) {
    if (uniqueDays[i] === cursorKey) {
      streak += 1;
      // move cursor to previous day
      cursor.setDate(cursor.getDate() - 1);
      cursorKey = getDateKey(cursor.toISOString());
    } else {
      // If the most recent entry is not today, check if it is yesterday to allow streak starting yesterday
      if (streak === 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = getDateKey(yesterday.toISOString());
        if (uniqueDays[0] === yKey) {
          // start streak from yesterday
          cursor = yesterday;
          cursorKey = yKey;
          i = -1; // restart loop with adjusted cursor
          continue;
        }
      }
      break;
    }
  }
  return streak;
}

export default function Home() {
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [currentEntry, setCurrentEntry] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'dashboard' | 'insights'>('write');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryType | null>(null);
  const [modalAnalysis, setModalAnalysis] = useState<string>('');
  const [modalSuggestions, setModalSuggestions] = useState<string[]>([]);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const currentStreak = calculateCurrentStreak(entries);

  useEffect(() => {
    // Load entries from localStorage on component mount
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  const saveEntry = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    
    try {
      const newEntry: JournalEntryType = {
        id: Date.now().toString(),
        content,
        timestamp: new Date().toISOString(),
        sentiment: 'neutral', // Will be analyzed by AI
        themes: [], // Will be extracted by AI
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      };

      // Save to localStorage first
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      // Clear current entry
      setCurrentEntry('');
      
      // Analyze with Gemini AI
      try {
        const analysis = await analyzeJournalEntry(content);
        
        // Update entry with AI analysis
        const analyzedEntry: JournalEntryType = {
          ...newEntry,
          sentiment: analysis.sentiment as 'positive' | 'negative' | 'neutral' | 'mixed',
          themes: analysis.themes,
          aiInsights: analysis.insights,
          wordCount: analysis.wordCount,
        };
        
        const finalEntries = [analyzedEntry, ...entries];
        setEntries(finalEntries);
        localStorage.setItem('journalEntries', JSON.stringify(finalEntries));
      } catch (error) {
        console.error('AI analysis failed:', error);
        // Entry is already saved, just without AI analysis
      }
      
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deriveSuggestions = (entry: JournalEntryType, insightsText: string): string[] => {
    const tips: string[] = [];
    const text = `${entry.content} ${insightsText}`.toLowerCase();
    if (entry.sentiment === 'negative' || text.includes('stress') || text.includes('anxiety')) {
      tips.push('Try a 5-minute breathing break to ground yourself.');
      tips.push('Write down one small thing that went okay today.');
    }
    if (entry.sentiment === 'positive' || text.includes('grateful') || text.includes('gratitude')) {
      tips.push('Capture a gratitude note to revisit on tougher days.');
    }
    if (entry.themes.includes('work')) {
      tips.push('Set one clear boundary for work-life balance tomorrow.');
    }
    if (entry.themes.includes('family') || text.includes('family')) {
      tips.push('Plan a short check-in or kind message to someone you care about.');
    }
    if (tips.length === 0) {
      tips.push('Note one intention for tomorrow and one thing you appreciate about today.');
    }
    return Array.from(new Set(tips)).slice(0, 3);
  };

  const openEntryModal = async (entry: JournalEntryType) => {
    setSelectedEntry(entry);
    setModalAnalysis(entry.aiInsights || '');
    setModalSuggestions([]);
    setModalLoading(false);
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';

    // If no cached AI insight on the entry, fetch it now
    if (!entry.aiInsights) {
      try {
        setModalLoading(true);
        const analysis = await analyzeJournalEntry(entry.content);
        setModalAnalysis(analysis.insights);
        setModalSuggestions(deriveSuggestions(entry, analysis.insights));
      } catch (e) {
        console.error('Modal AI analysis failed:', e);
        setModalAnalysis('Thank you for reflecting. Consider noting one small win and one gentle next step.');
        setModalSuggestions(deriveSuggestions(entry, ''));
      } finally {
        setModalLoading(false);
      }
    } else {
      setModalSuggestions(deriveSuggestions(entry, entry.aiInsights));
    }
  };

  const closeEntryModal = () => {
    setSelectedEntry(null);
    setModalAnalysis('');
    setModalSuggestions([]);
    setModalLoading(false);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  };

  return (
    <div className="page-wrapper">
      {/* Background decorative elements */}
      <div className="background-decorations">
        <div className="bg-circle-1"></div>
        <div className="bg-circle-2"></div>
        <div className="bg-circle-3"></div>
      </div>

      <Head>
        <title>Journal Companion - Your Intelligent Self-Reflection Tool</title>
        <meta name="description" content="A private, empathetic, and intelligent journaling companion that makes self-reflection a seamless and insightful daily habit." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container">
        {/* Header */}
        <header className="header">
          <div className="badge-group">
            <div className="badge">
              <div className="badge-dot"></div>
              <span className="badge-text">AI-Powered Journaling</span>
            </div>
            <div className="streak-badge" title="Current streak">
              <span className="streak-fire">🔥</span>
              <span className="streak-count">{currentStreak}</span>
              <span className="streak-label">day{currentStreak === 1 ? '' : 's'} streak</span>
            </div>
          </div>
          
          <h1 className="title">
            Journal Companion
          </h1>
          <p className="subtitle">
            Your private, empathetic companion for meaningful self-reflection and personal growth
          </p>
        </header>

        {/* Navigation Tabs */}
        <nav className="nav">
          <div className="nav-container">
            {(['write', 'dashboard', 'insights'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`nav-button ${activeTab === tab ? 'active' : ''}`}
              >
                {tab === 'write' && '✍️ Write'}
                {tab === 'dashboard' && '📊 Dashboard'}
                {tab === 'insights' && '💡 Insights'}
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <div className="content-area">
          {activeTab === 'write' && (
            <JournalEntry
              onSave={saveEntry}
              isLoading={isLoading}
              currentEntry={currentEntry}
              setCurrentEntry={setCurrentEntry}
              entries={entries}
            />
          )}
          
          {activeTab === 'dashboard' && (
            <JournalDashboard entries={entries} />
          )}
          
          {activeTab === 'insights' && (
            <InsightSummary entries={entries} />
          )}
        </div>

        {/* Recent Entries Preview */}
        {entries.length > 0 && activeTab === 'write' && (
          <div className="recent-entries">
            <h2 className="recent-header">
              <div className="recent-icon">📝</div>
              Recent Entries
            </h2>
            <div className="recent-grid">
              {entries.slice(0, 3).map((entry) => (
                <button key={entry.id} className="entry-card entry-card-button" onClick={() => openEntryModal(entry)}>
                  <div className="entry-sentiment">
                    <div className={`sentiment-dot ${entry.sentiment}`}></div>
                    <span className="sentiment-text">{entry.sentiment}</span>
                  </div>
                  <p className="entry-content">{entry.content}</p>
                  <div className="entry-footer">
                    <p className="entry-date">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                    <div className="entry-themes">
                      {entry.themes.slice(0, 2).map((theme) => (
                        <span key={theme} className="theme-tag">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Entry Modal */}
      {selectedEntry && (
        <div className="modal-overlay" onClick={closeEntryModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Journal Entry</h3>
              <button className="modal-close" onClick={closeEntryModal} aria-label="Close">✕</button>
            </div>
            <div className="modal-meta">
              <span className={`sentiment-dot ${selectedEntry.sentiment}`}></span>
              <span className="modal-date">{new Date(selectedEntry.timestamp).toLocaleString()}</span>
              <div className="modal-themes">
                {selectedEntry.themes.map((theme) => (
                  <span key={theme} className="theme-tag">{theme}</span>
                ))}
              </div>
            </div>
            <div className="modal-content">
              <pre className="modal-text">{selectedEntry.content}</pre>

              <div className="modal-section">
                <h4 className="modal-section-title">Gentle Reflection</h4>
                {modalLoading ? (
                  <p className="modal-section-text">Analyzing your entry...</p>
                ) : (
                  <p className="modal-section-text">{modalAnalysis || 'Thank you for reflecting. Consider noting one small win and one gentle next step.'}</p>
                )}
              </div>

              {modalSuggestions.length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-title">Avenues for Positive Improvement</h4>
                  <ul className="modal-suggestions">
                    {modalSuggestions.map((s, i) => (
                      <li key={i} className="modal-suggestion-item">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

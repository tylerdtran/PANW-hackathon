import { useState, useEffect } from 'react';
import Head from 'next/head';
import JournalEntry from '../components/JournalEntry';
import JournalDashboard from '../components/JournalDashboard';
import InsightSummary from '../components/InsightSummary';
import { JournalEntry as JournalEntryType } from '../types/journal';
import { analyzeJournalEntry } from '../lib/gemini';

export default function Home() {
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [currentEntry, setCurrentEntry] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'dashboard' | 'insights'>('write');

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
          <div className="badge">
            <div className="badge-dot"></div>
            <span className="badge-text">AI-Powered Journaling</span>
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
                <div key={entry.id} className="entry-card">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Lightbulb, TrendingUp, Heart, Brain, Users, Calendar, Sparkles, Briefcase } from 'lucide-react';
import { JournalEntry } from '../types/journal';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

interface InsightSummaryProps {
  entries: JournalEntry[];
}

export default function InsightSummary({ entries }: InsightSummaryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<JournalEntry | null>(null);

  const insights = useMemo(() => {
    if (entries.length === 0) return null;

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const periodStart = selectedPeriod === 'week' ? weekStart : monthStart;
    const periodEnd = selectedPeriod === 'week' ? weekEnd : monthEnd;

    const periodEntries = entries.filter(entry => 
      isWithinInterval(new Date(entry.timestamp), { start: periodStart, end: periodEnd })
    );

    if (periodEntries.length === 0) return null;

    // Analyze themes
    const themeFrequency: Record<string, number> = {};
    periodEntries.forEach(entry => {
      entry.themes.forEach(theme => {
        themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
      });
    });

    const sortedThemes = Object.entries(themeFrequency)
      .sort(([,a], [,b]) => b - a)
      .map(([theme, count]) => ({ theme, count }));

    const topThemes = sortedThemes.slice(0, 3).map(t => t.theme);

    // Analyze sentiment trends
    const sentimentCounts = periodEntries.reduce((acc, entry) => {
      acc[entry.sentiment] = (acc[entry.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantSentiment = Object.entries(sentimentCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    // Generate insights based on patterns
    const insights: string[] = [];
    
    if ((sentimentCounts.positive || 0) > (sentimentCounts.negative || 0)) {
      insights.push("You've been experiencing more positive emotions this period");
    }
    
    if (topThemes.includes('work') || topThemes.includes('career')) {
      insights.push("Work and career have been prominent themes in your reflections");
    }
    
    if (topThemes.includes('relationship') || topThemes.includes('family')) {
      insights.push("Your relationships and connections have been important to you");
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if ((sentimentCounts.negative || 0) > 0) {
      recommendations.push("Consider practicing self-compassion and mindfulness");
    }
    
    if (topThemes.includes('stress') || topThemes.includes('anxiety')) {
      recommendations.push("Try incorporating stress-reduction techniques into your routine");
    }
    
    if (periodEntries.length < 3) {
      recommendations.push("Aim to write more consistently to gain deeper insights");
    }

    const positiveEntries = periodEntries
      .filter(entry => entry.sentiment === 'positive')
      .slice(0, 4);

    return {
      period: selectedPeriod === 'week' ? 'this week' : 'this month',
      totalEntries: periodEntries.length,
      sortedThemes,
      topThemes,
      dominantSentiment,
      insights,
      recommendations,
      highlights: positiveEntries
    };
  }, [entries, selectedPeriod]);

  if (entries.length === 0) {
    return (
      <div className="insights-empty">
        <div className="insights-empty-icon">
          <Lightbulb size={48} />
        </div>
        <h3 className="insights-empty-title">No insights yet</h3>
        <p className="insights-empty-text">Start writing to discover meaningful patterns in your thoughts and feelings!</p>
      </div>
    );
  }

  return (
    <div className="insights">
      {/* Header */}
      <div className="insights-header">
        <div>
          <h2 className="insights-title">Your Personal Insights</h2>
          <p className="insights-subtitle">Discover patterns and growth opportunities in your journaling journey</p>
        </div>
        
        <div className="period-toggle">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`period-button ${selectedPeriod === 'week' ? 'active' : ''}`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`period-button disabled`}
            disabled
            title="Coming soon"
          >
            This Month
          </button>
        </div>
      </div>

      {insights ? (
        <>
          {/* Summary Card */}
          <div className="insights-summary">
            <div className="insights-summary-content">
              <div className="insights-summary-icon">
                <Lightbulb size={32} />
              </div>
              <div className="insights-summary-text">
                <h3 className="insights-summary-title">
                  {selectedPeriod === 'week' ? 'Weekly' : 'Monthly'} Reflection Summary
                </h3>
                <p className="insights-summary-desc">
                  Over {insights.period}, you&apos;ve written {insights.totalEntries} journal entries. 
                  Your reflections have been primarily {insights.dominantSentiment}, with themes around {insights.topThemes.join(', ')} being most prominent.
                </p>
              </div>
            </div>
          </div>

          {/* Key Insights and Growth */}
          <div className="insights-grid">
            <div className="insights-card">
              <h3 className="insights-card-title">
                <div className="insights-card-badge badge-green">
                  <TrendingUp size={20} />
                </div>
                Key Patterns
              </h3>
              <ul className="insights-list">
                {insights.insights.map((insight, index) => (
                  <li key={index} className="insights-list-item">
                    <div className="insights-dot dot-green"></div>
                    <span className="insights-list-text">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="insights-card">
              <h3 className="insights-card-title">
                <div className="insights-card-badge badge-purple">
                  <Sparkles size={20} />
                </div>
                Growth Opportunities
              </h3>
              <ul className="insights-list">
                {insights.recommendations.map((rec, index) => (
                  <li key={index} className="insights-list-item">
                    <div className="insights-dot dot-purple"></div>
                    <span className="insights-list-text">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Theme Analysis (expanded) */}
          <div className="insights-card">
            <h3 className="insights-card-title">
              <div className="insights-card-badge badge-indigo">
                <Brain size={20} />
              </div>
              Theme Analysis
            </h3>
            <div className="themes-grid">
              {(showAllThemes ? insights.sortedThemes : insights.sortedThemes.slice(0, 6)).map(({ theme, count }) => {
                const icons = {
                  work: Briefcase,
                  relationship: Users,
                  family: Heart,
                  creativity: Sparkles,
                  growth: Brain,
                  stress: TrendingUp
                };
                const IconComponent = icons[theme as keyof typeof icons] || Lightbulb;
                
                return (
                  <div key={theme} className="theme-card">
                    <div className="theme-card-icon">
                      <IconComponent size={28} />
                    </div>
                    <p className="theme-card-title">{theme}</p>
                    <p className="theme-badge">{count} mentions</p>
                  </div>
                );
              })}
            </div>
            {insights.sortedThemes.length > 6 && (
              <div className="themes-toggle">
                <button className="themes-toggle-btn" onClick={() => setShowAllThemes(v => !v)}>
                  {showAllThemes ? 'Show less' : 'Show all'}
                </button>
              </div>
            )}
          </div>

          {/* Positive Highlights */}
          {insights.highlights.length > 0 && (
            <div className="highlights">
              <h3 className="highlights-title">
                <div className="insights-card-badge badge-emerald">
                  <Heart size={20} />
                </div>
                Positive Moments to Remember
              </h3>
              <div className="highlights-grid">
                {insights.highlights.map((entry, index) => (
                  <button key={index} className="highlight-item highlight-button" onClick={() => setSelectedHighlight(entry)}>
                    <p className="highlight-text">“{entry.content.substring(0, 140)}{entry.content.length > 140 ? '…' : ''}”</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="insights-empty">
          <div className="insights-empty-icon">
            <Calendar size={48} />
          </div>
          <h3 className="insights-empty-title">No entries in this period</h3>
          <p className="insights-empty-text">Try writing a few entries to see your insights here!</p>
        </div>
      )}

      {/* Modal for Positive Highlights */}
      {selectedHighlight && (
        <div className="modal-overlay" onClick={() => setSelectedHighlight(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Positive Moment</h3>
              <button className="modal-close" onClick={() => setSelectedHighlight(null)} aria-label="Close">✕</button>
            </div>
            <div className="modal-meta">
              <span className={`sentiment-dot ${selectedHighlight.sentiment}`}></span>
              <span className="modal-date">{new Date(selectedHighlight.timestamp).toLocaleString()}</span>
              <div className="modal-themes">
                {selectedHighlight.themes.map((theme) => (
                  <span key={theme} className="theme-tag">{theme}</span>
                ))}
              </div>
            </div>
            <div className="modal-content">
              <pre className="modal-text">{selectedHighlight.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Encouragement */}
      <div className="encouragement insights-encouragement">
        <div className="encouragement-badge">
          <span className="encouragement-emoji">💜</span>
          <span className="encouragement-title">Keep Growing</span>
        </div>
        <p className="encouragement-text">
          Every entry you write helps you understand yourself better. 
          Your journal is a safe space for reflection and growth.
        </p>
      </div>
    </div>
  );
}

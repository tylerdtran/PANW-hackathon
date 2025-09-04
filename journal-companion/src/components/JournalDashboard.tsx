import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, BookOpen, Heart } from 'lucide-react';
import { JournalEntry, SentimentTrend } from '../types/journal';
import { format, subDays, startOfDay } from 'date-fns';

interface JournalDashboardProps {
  entries: JournalEntry[];
}

const COLORS = ['#10B981', '#EF4444', '#6B7280', '#8B5CF6'];

export default function JournalDashboard({ entries }: JournalDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const filteredEntries = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = startOfDay(subDays(new Date(), days));
    
    return entries.filter(entry => new Date(entry.timestamp) >= cutoffDate);
  }, [entries, timeRange]);

  const stats = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const totalWords = filteredEntries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
    const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
    
    const sentimentCounts = filteredEntries.reduce((acc, entry) => {
      acc[entry.sentiment] = (acc[entry.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentThemes = filteredEntries
      .flatMap(entry => entry.themes)
      .reduce((acc, theme) => {
        acc[theme] = (acc[theme] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topThemes = Object.entries(mostFrequentThemes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));

    return {
      totalEntries,
      totalWords,
      avgWordsPerEntry,
      sentimentCounts,
      topThemes
    };
  }, [filteredEntries]);

  const sentimentTrendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const trendData: SentimentTrend[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayEntries = filteredEntries.filter(entry => 
        format(new Date(entry.timestamp), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      const daySentiments = dayEntries.reduce((acc, entry) => {
        acc[entry.sentiment] = (acc[entry.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      trendData.push({
        date: format(date, 'MMM dd'),
        positive: daySentiments.positive || 0,
        negative: daySentiments.negative || 0,
        neutral: daySentiments.neutral || 0,
        mixed: daySentiments.mixed || 0
      });
    }
    
    return trendData;
  }, [filteredEntries, timeRange]);

  const sentimentPieData = useMemo(() => {
    return Object.entries(stats.sentimentCounts).map(([sentiment, count]) => ({
      name: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      value: count
    }));
  }, [stats.sentimentCounts]);

  if (entries.length === 0) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty-icon">
          <BookOpen size={48} />
        </div>
        <h3 className="dashboard-empty-title">No entries yet</h3>
        <p className="dashboard-empty-text">Start writing to see your journal insights here!</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Your Journal Dashboard</h2>
          <p className="dashboard-subtitle">Track your writing journey and emotional patterns</p>
        </div>
        
        <div className="period-toggle">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`period-button ${timeRange === range ? 'active' : ''}`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card stat-blue">
          <div className="stat-card-content">
            <div className="stat-icon icon-blue">
              <BookOpen size={32} />
            </div>
            <div>
              <p className="stat-value blue">{stats.totalEntries}</p>
              <p className="stat-label blue">Total Entries</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-emerald">
          <div className="stat-card-content">
            <div className="stat-icon icon-emerald">
              <TrendingUp size={32} />
            </div>
            <div>
              <p className="stat-value emerald">{stats.totalWords}</p>
              <p className="stat-label emerald">Total Words</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-purple">
          <div className="stat-card-content">
            <div className="stat-icon icon-purple">
              <Calendar size={32} />
            </div>
            <div>
              <p className="stat-value purple">{stats.avgWordsPerEntry}</p>
              <p className="stat-label purple">Avg per Entry</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-orange">
          <div className="stat-card-content">
            <div className="stat-icon icon-orange">
              <Heart size={32} />
            </div>
            <div>
              <p className="stat-value orange">{stats.sentimentCounts.positive || 0}</p>
              <p className="stat-label orange">Positive Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        {/* Sentiment Trend */}
        <div className="chart-card">
          <h3 className="chart-title">
            <div className="chart-badge badge-blue">
              <TrendingUp size={16} />
            </div>
            Sentiment Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sentimentTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="positive" fill="#10B981" stackId="a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="negative" fill="#EF4444" stackId="a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="neutral" fill="#6B7280" stackId="a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mixed" fill="#8B5CF6" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">
            <div className="chart-badge badge-pink">
              <div className="chart-badge-dot"></div>
            </div>
            Sentiment Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Themes */}
      <div className="themes-card">
        <h3 className="chart-title">
          <div className="chart-badge badge-indigo">
            <div className="chart-badge-dot"></div>
          </div>
          Most Common Themes
        </h3>
        {stats.topThemes.length > 0 ? (
          <div className="themes-list">
            {stats.topThemes.map((theme, index) => (
              <div key={theme.theme} className="theme-row">
                <div className="theme-rank">
                  <span className="theme-rank-text">{index + 1}</span>
                </div>
                <div>
                  <p className="theme-name">{theme.theme}</p>
                  <p className="theme-meta">{theme.count} mentions</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty small">
            <div className="dashboard-empty-icon small">
              <div className="dot"></div>
            </div>
            <p className="dashboard-empty-text">No themes detected yet. Keep writing to see patterns emerge!</p>
          </div>
        )}
      </div>
    </div>
  );
}

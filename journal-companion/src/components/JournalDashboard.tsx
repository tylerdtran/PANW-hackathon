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
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-600 mb-3">No entries yet</h3>
        <p className="text-gray-500 text-lg">Start writing to see your journal insights here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-gray-800 mb-3">Your Journal Dashboard</h2>
          <p className="text-xl text-gray-600">Track your writing journey and emotional patterns</p>
        </div>
        
        <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                timeRange === range
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-800 mb-1">{stats.totalEntries}</p>
              <p className="text-blue-600 font-semibold">Total Entries</p>
            </div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-8 border border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-4xl font-bold text-emerald-800 mb-1">{stats.totalWords}</p>
              <p className="text-emerald-600 font-semibold">Total Words</p>
            </div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-4xl font-bold text-purple-800 mb-1">{stats.avgWordsPerEntry}</p>
              <p className="text-purple-600 font-semibold">Avg per Entry</p>
            </div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 border border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-4xl font-bold text-orange-800 mb-1">
                {stats.sentimentCounts.positive || 0}
              </p>
              <p className="text-orange-600 font-semibold">Positive Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sentiment Trend */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
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
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
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
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          Most Common Themes
        </h3>
        {stats.topThemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.topThemes.map((theme, index) => (
              <div key={theme.theme} className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-lg">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg capitalize mb-1">{theme.theme}</p>
                    <p className="text-gray-500">{theme.count} mentions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
            </div>
            <p className="text-gray-500 text-lg">No themes detected yet. Keep writing to see patterns emerge!</p>
          </div>
        )}
      </div>
    </div>
  );
}

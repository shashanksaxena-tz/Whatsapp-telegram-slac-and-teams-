import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Heart,
  Calendar,
} from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

import { MetricCard, MetricCardGrid } from '../components/analytics/MetricCard';
import { SentimentTrendChart, SentimentDataPoint } from '../components/analytics/SentimentTrendChart';
import { PlatformDistributionChart, PlatformDistributionDataPoint } from '../components/analytics/PlatformDistributionChart';
import { ConversationVolumeChart, ConversationVolumeDataPoint } from '../components/analytics/ConversationVolumeChart';
import { ResponseTimeChart, ResponseTimeDataPoint } from '../components/analytics/ResponseTimeChart';
import { cn } from '../lib/utils';

/**
 * Date range options for analytics
 */
type DateRangeOption = 'today' | '7days' | '30days' | '90days';

interface DateRangeConfig {
  label: string;
  days: number;
}

const dateRangeOptions: Record<DateRangeOption, DateRangeConfig> = {
  today: { label: 'Today', days: 1 },
  '7days': { label: '7 Days', days: 7 },
  '30days': { label: '30 Days', days: 30 },
  '90days': { label: '90 Days', days: 90 },
};

/**
 * Generate mock sentiment data for the given date range
 */
function generateSentimentData(days: number): SentimentDataPoint[] {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  return dates.map((date) => {
    // Generate somewhat realistic sentiment fluctuations
    const baseScore = 0.3;
    const variation = (Math.random() - 0.5) * 0.8;
    const score = Math.max(-1, Math.min(1, baseScore + variation));

    return {
      date: format(date, days <= 7 ? 'EEE' : 'MMM d'),
      score: Number(score.toFixed(2)),
    };
  });
}

/**
 * Generate mock platform distribution data
 */
function generatePlatformDistribution(): PlatformDistributionDataPoint[] {
  return [
    { platform: 'WHATSAPP', count: Math.floor(Math.random() * 200) + 150 },
    { platform: 'TELEGRAM', count: Math.floor(Math.random() * 150) + 100 },
    { platform: 'SLACK', count: Math.floor(Math.random() * 100) + 50 },
    { platform: 'TEAMS', count: Math.floor(Math.random() * 80) + 40 },
  ];
}

/**
 * Generate mock conversation volume data
 */
function generateConversationVolumeData(): ConversationVolumeDataPoint[] {
  return [
    {
      platform: 'WHATSAPP',
      resolved: Math.floor(Math.random() * 150) + 100,
      open: Math.floor(Math.random() * 50) + 20,
    },
    {
      platform: 'TELEGRAM',
      resolved: Math.floor(Math.random() * 120) + 80,
      open: Math.floor(Math.random() * 40) + 15,
    },
    {
      platform: 'SLACK',
      resolved: Math.floor(Math.random() * 80) + 40,
      open: Math.floor(Math.random() * 30) + 10,
    },
    {
      platform: 'TEAMS',
      resolved: Math.floor(Math.random() * 60) + 30,
      open: Math.floor(Math.random() * 25) + 8,
    },
  ];
}

/**
 * Generate mock response time data for the given date range
 */
function generateResponseTimeData(days: number): ResponseTimeDataPoint[] {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  return dates.map((date) => {
    // Generate response times between 5 and 45 minutes
    const avgResponseTime = Math.random() * 40 + 5;

    return {
      date: format(date, days <= 7 ? 'EEE' : 'MMM d'),
      avgResponseTime: Number(avgResponseTime.toFixed(1)),
    };
  });
}

/**
 * Calculate KPI metrics from the data
 */
function calculateKPIs(
  platformData: PlatformDistributionDataPoint[],
  volumeData: ConversationVolumeDataPoint[],
  responseTimeData: ResponseTimeDataPoint[],
  sentimentData: SentimentDataPoint[]
) {
  const totalConversations = platformData.reduce((sum, p) => sum + p.count, 0);
  const totalResolved = volumeData.reduce((sum, v) => sum + v.resolved, 0);
  const totalOpen = volumeData.reduce((sum, v) => sum + v.open, 0);
  const resolutionRate =
    totalResolved + totalOpen > 0
      ? (totalResolved / (totalResolved + totalOpen)) * 100
      : 0;
  const avgResponseTime =
    responseTimeData.length > 0
      ? responseTimeData.reduce((sum, r) => sum + r.avgResponseTime, 0) /
        responseTimeData.length
      : 0;
  const avgSentiment =
    sentimentData.length > 0
      ? sentimentData.reduce((sum, s) => sum + s.score, 0) / sentimentData.length
      : 0;

  return {
    totalConversations,
    avgResponseTime,
    resolutionRate,
    avgSentiment,
  };
}

/**
 * Format response time for display
 */
function formatResponseTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Analytics Page Component
 * Displays comprehensive analytics dashboard with charts and KPIs
 */
const Analytics: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('7days');

  // Generate mock data based on selected date range
  const { sentimentData, platformData, volumeData, responseTimeData, kpis } =
    useMemo(() => {
      const days = dateRangeOptions[selectedRange].days;
      const sentiment = generateSentimentData(days);
      const platform = generatePlatformDistribution();
      const volume = generateConversationVolumeData();
      const response = generateResponseTimeData(days);
      const metrics = calculateKPIs(platform, volume, response, sentiment);

      return {
        sentimentData: sentiment,
        platformData: platform,
        volumeData: volume,
        responseTimeData: response,
        kpis: metrics,
      };
    }, [selectedRange]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor performance metrics and trends across all platforms
          </p>
        </div>

        {/* Date Range Selector */}
        <div
          className="flex items-center gap-2 bg-white/5 rounded-lg p-1"
          role="group"
          aria-label="Date range selector"
        >
          <Calendar className="h-4 w-4 text-gray-400 ml-2" aria-hidden="true" />
          {(Object.keys(dateRangeOptions) as DateRangeOption[]).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                selectedRange === range
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              )}
              aria-pressed={selectedRange === range}
            >
              {dateRangeOptions[range].label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <MetricCardGrid columns={4}>
        <MetricCard
          label="Total Conversations"
          value={kpis.totalConversations.toLocaleString()}
          icon={MessageSquare}
          trend={12.5}
          trendLabel="vs last period"
          variant="info"
        />
        <MetricCard
          label="Avg Response Time"
          value={formatResponseTime(kpis.avgResponseTime)}
          icon={Clock}
          trend={-8.3}
          trendLabel="vs last period"
          variant="success"
          invertTrend
        />
        <MetricCard
          label="Resolution Rate"
          value={`${kpis.resolutionRate.toFixed(1)}%`}
          icon={CheckCircle2}
          trend={5.2}
          trendLabel="vs last period"
          variant="success"
        />
        <MetricCard
          label="Avg Sentiment Score"
          value={kpis.avgSentiment.toFixed(2)}
          icon={Heart}
          trend={3.1}
          trendLabel="vs last period"
          variant={kpis.avgSentiment >= 0.5 ? 'success' : kpis.avgSentiment >= 0 ? 'warning' : 'danger'}
        />
      </MetricCardGrid>

      {/* First Row of Charts: Sentiment (2/3) + Platform Distribution (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SentimentTrendChart
            data={sentimentData}
            title="Sentiment Trend"
            description={`Customer sentiment over the last ${dateRangeOptions[selectedRange].label.toLowerCase()}`}
          />
        </div>
        <div className="lg:col-span-1">
          <PlatformDistributionChart
            data={platformData}
            title="Platform Distribution"
            description="Conversations by platform"
            variant="donut"
          />
        </div>
      </div>

      {/* Second Row of Charts: Conversation Volume (1/2) + Response Time (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversationVolumeChart
          data={volumeData}
          title="Conversation Volume"
          description="Resolved vs open conversations by platform"
        />
        <ResponseTimeChart
          data={responseTimeData}
          title="Response Time Trend"
          description={`Average response times over the last ${dateRangeOptions[selectedRange].label.toLowerCase()}`}
          slaThreshold={30}
        />
      </div>

      {/* Footer with last updated info */}
      <div className="flex items-center justify-end text-xs text-gray-500">
        <span>Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}</span>
      </div>
    </div>
  );
};

export default Analytics;

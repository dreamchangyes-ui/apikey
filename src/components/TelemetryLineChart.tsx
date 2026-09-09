import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  TrendingUp,
  Zap,
  Layers,
  Clock,
  Sparkles,
  BarChart3,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ChartDataPoint } from '../types';

interface TelemetryLineChartProps {
  data: ChartDataPoint[];
}

type TimeRange = '24h' | '12h' | '6h';
type ViewMode = 'dual' | 'tokens' | 'requests';

export const TelemetryLineChart: React.FC<TelemetryLineChartProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [viewMode, setViewMode] = useState<ViewMode>('dual');

  // Interactive line visibility toggles
  const [showTotalTokens, setShowTotalTokens] = useState(true);
  const [showPromptTokens, setShowPromptTokens] = useState(true);
  const [showCompletionTokens, setShowCompletionTokens] = useState(true);
  const [showRequestRate, setShowRequestRate] = useState(true);
  const [showRequests, setShowRequests] = useState(false);

  // Filter data according to selected time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeRange === '6h') return data.slice(-6);
    if (timeRange === '12h') return data.slice(-12);
    return data;
  }, [data, timeRange]);

  // Aggregate metrics for summary ribbon
  const summary = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalTokens: 0,
        totalRequests: 0,
        peakRpm: 0,
        avgRpm: 0,
        promptTokens: 0,
        completionTokens: 0,
        peakTime: '-',
      };
    }

    let totalTokens = 0;
    let totalRequests = 0;
    let totalPrompt = 0;
    let totalCompletion = 0;
    let peakRpm = 0;
    let peakTime = filteredData[0]?.time || '-';
    let sumRpm = 0;

    filteredData.forEach((d) => {
      totalTokens += d.tokens || 0;
      totalRequests += d.requests || 0;
      totalPrompt += d.promptTokens || Math.round(d.tokens * 0.65);
      totalCompletion += d.completionTokens || Math.round(d.tokens * 0.35);
      const rpm = d.requestRate || Number((d.requests / 60).toFixed(1));
      sumRpm += rpm;
      if (rpm > peakRpm) {
        peakRpm = rpm;
        peakTime = d.time;
      }
    });

    const avgRpm = Number((sumRpm / filteredData.length).toFixed(1));

    return {
      totalTokens,
      totalRequests,
      peakRpm,
      avgRpm,
      promptTokens: totalPrompt,
      completionTokens: totalCompletion,
      peakTime,
    };
  }, [filteredData]);

  // Format large numbers for YAxis & Tooltips
  const formatTokens = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return String(val);
  };

  const formatRate = (val: number) => `${val} rpm`;

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload as ChartDataPoint;
      if (!item) return null;

      const totalTok = item.tokens || 0;
      const promptTok = item.promptTokens || Math.round(totalTok * 0.65);
      const complTok = item.completionTokens || Math.round(totalTok * 0.35);
      const rpm = item.requestRate ?? Number((item.requests / 60).toFixed(1));
      const reqs = item.requests || 0;
      const promptPct = totalTok > 0 ? Math.round((promptTok / totalTok) * 100) : 65;
      const complPct = totalTok > 0 ? Math.round((complTok / totalTok) * 100) : 35;

      return (
        <div className="rounded-xl bg-[#161619]/95 backdrop-blur-md border border-[#27272a] p-3.5 shadow-2xl text-xs space-y-2.5 min-w-[240px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
            <div className="flex items-center gap-1.5 text-zinc-300 font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>ช่วงเวลา {label} น.</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400">
              {rpm} RPM
            </span>
          </div>

          {/* Tokens Section */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center justify-between">
              <span>ปริมาณการบริโภคโทเค็น</span>
              <span className="font-mono text-cyan-300 font-bold">{totalTok.toLocaleString()}</span>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Prompt (อินพุต):</span>
                </span>
                <span className="font-mono text-blue-400 font-medium">
                  {promptTok.toLocaleString()} ({promptPct}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Completion (เอาต์พุต):</span>
                </span>
                <span className="font-mono text-purple-400 font-medium">
                  {complTok.toLocaleString()} ({complPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Requests Section */}
          <div className="border-t border-[#27272a] pt-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>อัตราคำขอ (Request Rate):</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{rpm} req/min</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>คำขอในชั่วโมงนี้:</span>
              </span>
              <span className="font-mono text-amber-400">{reqs.toLocaleString()} คำขอ</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#111113] border border-[#27272a] space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-950/70 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              การบริโภคโทเค็นและอัตราคำขอ (Token Consumption & Request Rates)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/50 text-emerald-400">
              Recharts 24H Live
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            กราฟเส้นแสดงความเร็วการใช้โทเค็น (Prompt vs Completion) ควบคู่กับอัตราคำขอเฉลี่ยต่อนาที (RPM)
          </p>
        </div>

        {/* View Mode & Time Range Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#161619] border border-[#27272a] text-[11px]">
            <button
              onClick={() => {
                setViewMode('dual');
                setShowTotalTokens(true);
                setShowPromptTokens(true);
                setShowCompletionTokens(true);
                setShowRequestRate(true);
                setShowRequests(false);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'dual'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ภาพรวมคู่ (Dual Axis)
            </button>
            <button
              onClick={() => {
                setViewMode('tokens');
                setShowTotalTokens(true);
                setShowPromptTokens(true);
                setShowCompletionTokens(true);
                setShowRequestRate(false);
                setShowRequests(false);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'tokens'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              เฉพาะโทเค็น
            </button>
            <button
              onClick={() => {
                setViewMode('requests');
                setShowTotalTokens(false);
                setShowPromptTokens(false);
                setShowCompletionTokens(false);
                setShowRequestRate(true);
                setShowRequests(true);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'requests'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              เฉพาะอัตราคำขอ
            </button>
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#161619] border border-[#27272a] text-[11px]">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-2 py-1 rounded-md font-mono transition-colors ${
                timeRange === '24h'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              24 ชม.
            </button>
            <button
              onClick={() => setTimeRange('12h')}
              className={`px-2 py-1 rounded-md font-mono transition-colors ${
                timeRange === '12h'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              12 ชม.
            </button>
            <button
              onClick={() => setTimeRange('6h')}
              className={`px-2 py-1 rounded-md font-mono transition-colors ${
                timeRange === '6h'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              6 ชม.
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Line Visibility Legend Toggles */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-[11px] text-zinc-400 mr-1">สลับการแสดงเส้นกราฟ:</span>

        {/* Total Tokens Toggle */}
        <button
          onClick={() => setShowTotalTokens(!showTotalTokens)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
            showTotalTokens
              ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-300 font-medium'
              : 'bg-[#161619] border-zinc-800 text-zinc-400 opacity-60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>โทเค็นรวม (Total Tokens)</span>
          {showTotalTokens ? <Eye className="w-3 h-3 ml-0.5" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
        </button>

        {/* Prompt Tokens Toggle */}
        <button
          onClick={() => setShowPromptTokens(!showPromptTokens)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
            showPromptTokens
              ? 'bg-blue-950/30 border-blue-500/50 text-blue-300 font-medium'
              : 'bg-[#161619] border-zinc-800 text-zinc-400 opacity-60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Prompt (Input)</span>
          {showPromptTokens ? <Eye className="w-3 h-3 ml-0.5" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
        </button>

        {/* Completion Tokens Toggle */}
        <button
          onClick={() => setShowCompletionTokens(!showCompletionTokens)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
            showCompletionTokens
              ? 'bg-purple-950/30 border-purple-500/50 text-purple-300 font-medium'
              : 'bg-[#161619] border-zinc-800 text-zinc-400 opacity-60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Completion (Output)</span>
          {showCompletionTokens ? <Eye className="w-3 h-3 ml-0.5" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
        </button>

        {/* Request Rate RPM Toggle */}
        <button
          onClick={() => setShowRequestRate(!showRequestRate)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
            showRequestRate
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 font-medium'
              : 'bg-[#161619] border-zinc-800 text-zinc-400 opacity-60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>อัตราคำขอ (RPM)</span>
          {showRequestRate ? <Eye className="w-3 h-3 ml-0.5" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
        </button>

        {/* Hourly Requests Toggle */}
        <button
          onClick={() => setShowRequests(!showRequests)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
            showRequests
              ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 font-medium'
              : 'bg-[#161619] border-zinc-800 text-zinc-400 opacity-60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>คำขอรายชั่วโมง</span>
          {showRequests ? <Eye className="w-3 h-3 ml-0.5" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
        </button>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              dy={5}
            />

            {/* Left Y-Axis: Tokens Consumption */}
            <YAxis
              yAxisId="tokens"
              orientation="left"
              stroke="#06b6d4"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTokens}
              domain={[0, 'auto']}
            />

            {/* Right Y-Axis: Request Rate (RPM) */}
            <YAxis
              yAxisId="rate"
              orientation="right"
              stroke="#10b981"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatRate}
              domain={[0, 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference Line for Peak RPM */}
            {summary.peakRpm > 0 && showRequestRate && (
              <ReferenceLine
                yAxisId="rate"
                y={summary.peakRpm}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: `พีค ${summary.peakRpm} RPM`,
                  position: 'top',
                  fill: '#10b981',
                  fontSize: 10,
                }}
              />
            )}

            {/* Line 1: Total Tokens (Cyan) */}
            {showTotalTokens && (
              <Line
                yAxisId="tokens"
                type="monotone"
                dataKey="tokens"
                name="โทเค็นรวม"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#06b6d4', strokeWidth: 1 }}
                activeDot={{ r: 6, fill: '#22d3ee', stroke: '#083344', strokeWidth: 2 }}
              />
            )}

            {/* Line 2: Prompt Tokens (Blue) */}
            {showPromptTokens && (
              <Line
                yAxisId="tokens"
                type="monotone"
                dataKey="promptTokens"
                name="Prompt (Input)"
                stroke="#3b82f6"
                strokeWidth={1.75}
                strokeDasharray="5 3"
                dot={{ r: 2, fill: '#3b82f6' }}
              />
            )}

            {/* Line 3: Completion Tokens (Purple) */}
            {showCompletionTokens && (
              <Line
                yAxisId="tokens"
                type="monotone"
                dataKey="completionTokens"
                name="Completion (Output)"
                stroke="#a855f7"
                strokeWidth={1.75}
                dot={{ r: 2, fill: '#a855f7' }}
              />
            )}

            {/* Line 4: Request Rate RPM (Emerald) */}
            {showRequestRate && (
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="requestRate"
                name="อัตราคำขอ (RPM)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10b981', strokeWidth: 1 }}
                activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
              />
            )}

            {/* Line 5: Total Requests (Amber) */}
            {showRequests && (
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="requests"
                name="คำขอรายชั่วโมง"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={{ r: 2, fill: '#f59e0b' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Telemetry Summary Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-[#27272a] text-xs">
        <div className="p-2.5 rounded-xl bg-[#161619] border border-[#27272a]">
          <div className="text-[10px] text-zinc-400">อัตราคำขอสูงสุด (Peak RPM)</div>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {summary.peakRpm} req/min
          </div>
          <div className="text-[10px] text-zinc-400">ช่วงเวลา {summary.peakTime} น.</div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#161619] border border-[#27272a]">
          <div className="text-[10px] text-zinc-400">อัตราคำขอเฉลี่ย (Avg RPM)</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5">
            {summary.avgRpm} req/min
          </div>
          <div className="text-[10px] text-zinc-400">สม่ำเสมอตลอดช่วง</div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#161619] border border-[#27272a]">
          <div className="text-[10px] text-zinc-400">โทเค็นสะสม ({timeRange})</div>
          <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
            {(summary.totalTokens / 1000000).toFixed(2)}M
          </div>
          <div className="text-[10px] text-zinc-400">{summary.totalTokens.toLocaleString()} โทเค็น</div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#161619] border border-[#27272a]">
          <div className="text-[10px] text-zinc-400">สัดส่วน In / Out Tokens</div>
          <div className="text-sm font-bold text-blue-400 font-mono mt-0.5">
            {summary.totalTokens > 0
              ? `${Math.round((summary.promptTokens / summary.totalTokens) * 100)}% / ${Math.round(
                  (summary.completionTokens / summary.totalTokens) * 100
                )}%`
              : '65% / 35%'}
          </div>
          <div className="text-[10px] text-purple-400">Prompt / Completion</div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#161619] border border-[#27272a]">
          <div className="text-[10px] text-zinc-400">คำขอรวม ({timeRange})</div>
          <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
            {summary.totalRequests.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-400">ผ่าน Unified Proxy</div>
        </div>
      </div>
    </div>
  );
};

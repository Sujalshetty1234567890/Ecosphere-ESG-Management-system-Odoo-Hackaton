import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, FileDown, RefreshCw, Layers, Calendar, ClipboardList, 
  HelpCircle, CheckCircle2, ChevronRight, Loader2, AlertCircle 
} from 'lucide-react';
import { Department, DashboardStats } from '../types';

interface ReportsViewProps {
  stats: DashboardStats;
}

export default function ReportsView({ stats }: ReportsViewProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  // AI Generation States
  const [aiReport, setAiReport] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorAI, setErrorAI] = useState('');

  // Report statistics calculation states (simulated based on selected dept)
  const [reportStats, setReportStats] = useState({
    carbonEmissions: stats.orgCarbonEmissions,
    targetLimit: stats.orgCarbonTarget,
    environmentalScore: stats.environmentalScore,
    socialScore: stats.socialScore,
    governanceScore: stats.governanceScore,
    overallScore: stats.overallEsgScore
  });

  useEffect(() => {
    fetchDepts();
  }, []);

  useEffect(() => {
    // Dynamically update calculations based on department selector
    if (selectedDeptId === 'all') {
      setReportStats({
        carbonEmissions: stats.orgCarbonEmissions,
        targetLimit: stats.orgCarbonTarget,
        environmentalScore: stats.environmentalScore,
        socialScore: stats.socialScore,
        governanceScore: stats.governanceScore,
        overallScore: stats.overallEsgScore
      });
    } else {
      const deptScore = stats.departmentScores?.find(d => d.departmentId === selectedDeptId);
      if (deptScore) {
        setReportStats({
          carbonEmissions: Math.round(stats.orgCarbonEmissions * 0.35),
          targetLimit: Math.round(stats.orgCarbonTarget * 0.33),
          environmentalScore: Math.round(deptScore.score * 0.98),
          socialScore: Math.round(deptScore.score * 1.02),
          governanceScore: Math.round(deptScore.score * 1.01),
          overallScore: deptScore.score
        });
      }
    }
  }, [selectedDeptId, stats]);

  const fetchDepts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setDepartments(await response.json());
      }
    } catch (err) {
      console.error('Failed to load depts');
    }
  };

  const handleGenerateAIReport = async () => {
    setLoadingAI(true);
    setErrorAI('');
    setAiReport('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentId: selectedDeptId,
          metrics: {
            overallEsgScore: reportStats.overallScore,
            environmentalScore: reportStats.environmentalScore,
            socialScore: reportStats.socialScore,
            governanceScore: reportStats.governanceScore,
            carbonEmissions: reportStats.carbonEmissions,
            targetLimit: reportStats.targetLimit,
            participationRate: stats.csrParticipationRate,
            openIssuesCount: stats.openComplianceIssuesCount
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAiReport(data.report);
    } catch (err: any) {
      setErrorAI(err.message || 'AI generation failed');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDownloadPDF = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify({
        generatedDate: new Date().toISOString(),
        company: "EcoSphere Corp",
        selectedDepartment: selectedDeptId === 'all' ? 'All Divisions' : departments.find(d => d.id === selectedDeptId)?.name,
        range: `${startDate} to ${endDate}`,
        scores: reportStats,
        aiAssessmentSummary: aiReport
      }, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `EcoSphere_ESG_Report_${selectedDeptId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 lg:space-y-8" id="reports-tab-container">
      <div>
        <h1 className="text-2xl lg:text-3xl font-light text-slate-900 uppercase tracking-tight">ESG Reports <span className="font-bold">Compiler</span></h1>
        <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-1">Compile and filter regulatory corporate statements, and generate C-suite Gemini AI analysis reports</p>
      </div>

      {/* Report filters configuration panel */}
      <div className="bg-white border border-slate-200 rounded-none p-5 lg:p-6 shadow-sm text-slate-900">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-4">Report Configurations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">DIVISION</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-bold"
            >
              <option value="all">Enterprise-Wide (All Divisions)</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">START DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">END DATE</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={handleDownloadPDF}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 rounded-none transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider shadow-sm"
            >
              <FileDown className="h-4.5 w-4.5 shrink-0" />
              <span>Export Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main calculation card block summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white border border-slate-200 rounded-none p-5 flex flex-col justify-between shadow-sm text-slate-900">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Calculated ESG Score</span>
          <div className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 mt-4 truncate">
            {reportStats.overallScore} <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">/ 100</span>
          </div>
          <div className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weighted aggregate index</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-none p-5 flex flex-col justify-between shadow-sm text-slate-900">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Environmental (E) Index</span>
          <div className="text-3xl lg:text-4xl font-display font-extrabold text-emerald-600 mt-4 truncate">{reportStats.environmentalScore}</div>
          <div className="mt-3 text-[10px] text-emerald-700 font-bold uppercase tracking-wider font-mono truncate">Carbon: {reportStats.carbonEmissions} Tons</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-none p-5 flex flex-col justify-between shadow-sm text-slate-900">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Social (S) Index</span>
          <div className="text-3xl lg:text-4xl font-display font-extrabold text-pink-600 mt-4 truncate">{reportStats.socialScore}</div>
          <div className="mt-3 text-[10px] text-pink-700 font-bold uppercase tracking-wider truncate">Participation: {stats.csrParticipationRate}%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-none p-5 flex flex-col justify-between shadow-sm text-slate-900">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Governance (G) Index</span>
          <div className="text-3xl lg:text-4xl font-display font-extrabold text-sky-600 mt-4 truncate">{reportStats.governanceScore}</div>
          <div className="mt-3 text-[10px] text-sky-700 font-bold uppercase tracking-wider font-mono truncate">Open Issues: {stats.openComplianceIssuesCount}</div>
        </div>
      </div>

      {/* AI Engine synthesis section text boxes */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-slate-200 rounded-none p-4 lg:p-6 shadow-sm text-slate-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] hidden sm:block pointer-events-none">
            <Sparkles className="h-40 w-40 text-slate-900" />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
            <div className="max-w-xl">
              <h3 className="font-display font-bold text-base lg:text-lg text-slate-900 flex items-center uppercase tracking-tight">
                <Sparkles className="h-5 w-5 text-slate-900 mr-2 shrink-0" />
                Gemini C-Suite AI ESG Insight Generator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Synthesize executive report, analyze metrics weaknesses, and get AI recommendations</p>
            </div>
            <button
              onClick={handleGenerateAIReport}
              disabled={loadingAI}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-transparent text-white text-xs font-bold px-5 py-3.5 rounded-none flex items-center justify-center space-x-1.5 transition duration-150 shadow-sm cursor-pointer uppercase tracking-wider shrink-0"
            >
              {loadingAI ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5 text-slate-400" />
                  <span>Synthesizing Statement...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5 text-emerald-400 shrink-0" />
                  <span>Generate AI Summary</span>
                </>
              )}
            </button>
          </div>

          {errorAI && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-none text-xs flex items-center space-x-2 mb-6">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorAI}</span>
            </div>
          )}

          <div className="relative z-10 w-full">
            {aiReport ? (
              <div className="bg-slate-50 border border-slate-200 rounded-none p-4 lg:p-6 text-slate-800 leading-relaxed text-sm prose prose-slate font-sans max-w-full overflow-x-auto">
                <ReactMarkdown>{aiReport}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-48 border border-dashed border-slate-200 rounded-none flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                <Sparkles className="h-8 w-8 text-slate-300 animate-pulse shrink-0" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Report Dashboard Empty</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider max-w-sm">Click the generation trigger button above to feed active database tracks into structured C-suite assessments.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
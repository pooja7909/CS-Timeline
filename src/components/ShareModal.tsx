import React, { useState, useEffect } from 'react';
import { Copy, Check, Share2, ExternalLink, GraduationCap, Users, Shield, X, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { YEARS } from '../data/defaultPlan';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLocked: boolean;
  selectedYears?: string[];
  initialYear?: string;
  initialYears?: string[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  isLocked,
  selectedYears: activeSelectedYears,
  initialYear,
  initialYears
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compute what years should be selected by default
  const computeInitialYears = (): string[] => {
    if (initialYears && initialYears.length > 0) {
      const valid = initialYears.filter(id => YEARS.some(y => y.id === id));
      if (valid.length > 0) return valid;
    }
    if (initialYear && initialYear !== 'all') {
      const parsed = initialYear
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => YEARS.some(y => y.id === s));
      if (parsed.length > 0) return parsed;
    }
    if (activeSelectedYears && activeSelectedYears.length > 0 && activeSelectedYears.length < YEARS.length) {
      const valid = activeSelectedYears.filter(id => YEARS.some(y => y.id === id));
      if (valid.length > 0) return valid;
    }
    return YEARS.map(y => y.id);
  };

  const [selectedYearIds, setSelectedYearIds] = useState<string[]>(computeInitialYears);

  useEffect(() => {
    if (isOpen) {
      setSelectedYearIds(computeInitialYears());
    }
  }, [isOpen, initialYear, initialYears, activeSelectedYears]);

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;

  // Toggle a single year group
  const toggleYear = (id: string) => {
    setSelectedYearIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(y => y !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Preset handlers
  const handleSelectAll = () => {
    setSelectedYearIds(YEARS.map(y => y.id));
  };

  const handleSelectNone = () => {
    setSelectedYearIds([]);
  };

  const handleSelectKS3 = () => {
    setSelectedYearIds(['y7', 'y8', 'y9']);
  };

  const handleSelectKS4 = () => {
    setSelectedYearIds(['y10', 'y11']);
  };

  const handleSelectKS5 = () => {
    setSelectedYearIds(['y12', 'y13']);
  };

  const handleSelectOnly = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedYearIds([id]);
  };

  // Derive sorted selected groups
  const sortedSelected = YEARS.filter(y => selectedYearIds.includes(y.id));
  const isAllYears = sortedSelected.length === YEARS.length || sortedSelected.length === 0;

  // Generate URL
  const getShareUrl = (role: 'student' | 'teacher') => {
    const params = new URLSearchParams();
    params.set('role', role);
    if (!isAllYears && sortedSelected.length > 0) {
      params.set('year', sortedSelected.map(y => y.id).join(','));
    }
    return `${baseUrl}?${params.toString()}`;
  };

  const studentUrl = getShareUrl('student');
  const teacherUrl = getShareUrl('teacher');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Format descriptive label
  const getSelectedTitle = () => {
    if (isAllYears) return 'All Year Groups (Y7–13)';
    if (sortedSelected.length === 1) return `${sortedSelected[0].label} Only`;
    if (sortedSelected.length === 2) return `${sortedSelected[0].label} & ${sortedSelected[1].label}`;
    if (sortedSelected.length === 3) return `${sortedSelected.map(y => y.label).join(', ')}`;
    return `${sortedSelected.length} Groups Selected (${sortedSelected.map(y => y.short).join(', ')})`;
  };

  const getSelectedDescription = () => {
    if (isAllYears) {
      return 'Shares the complete curriculum across all year levels (Y7–13) with no teacher tools or logins.';
    }
    if (sortedSelected.length === 1) {
      return `Dedicated link for ${sortedSelected[0].label} students and parents. Opens locked to ${sortedSelected[0].label} with all other year groups hidden.`;
    }
    const names = sortedSelected.map(y => y.label).join(' and ');
    return `Dedicated combined link for ${names}. Students and parents will only see these ${sortedSelected.length} classes and can easily toggle between them; all other year groups remain hidden.`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 text-slate-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Share Computing Curriculum
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Create shareable links for single classes, multiple year groups (e.g. Y10 & Y11), or the whole school
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Status Banner */}
        <div className={`p-3 rounded-xl mb-4 border text-xs flex items-center gap-2.5 ${
          isLocked
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <Shield className="w-4 h-4 flex-shrink-0 text-emerald-700" />
          <div>
            <span className="font-bold">
              {isLocked ? 'Timeline is Currently Locked (Protected)' : 'Timeline is Ready to Share'}
            </span>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {isLocked
                ? 'Safe to share! Students will see a locked, read-only version.'
                : 'Tip: Lock the timeline with code 2026 to protect against accidental changes.'}
            </p>
          </div>
        </div>

        {/* Multi-Year Group Selector */}
        <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Year Groups / Classes to Share:
              </label>
              <span className="text-[11px] font-medium text-slate-500">
                {isAllYears
                  ? 'All 7 year levels included'
                  : `${sortedSelected.length} of ${YEARS.length} year groups selected`}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`px-2 py-1 text-[11px] rounded-md font-mono-code font-bold transition-all cursor-pointer ${
                  sortedSelected.length === YEARS.length
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All Years
              </button>
              <button
                type="button"
                onClick={handleSelectKS3}
                className={`px-2 py-1 text-[11px] rounded-md font-mono-code font-bold transition-all cursor-pointer ${
                  sortedSelected.length === 3 && ['y7', 'y8', 'y9'].every(id => selectedYearIds.includes(id))
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
                title="Year 7, Year 8, Year 9"
              >
                KS3 (Y7–9)
              </button>
              <button
                type="button"
                onClick={handleSelectKS4}
                className={`px-2 py-1 text-[11px] rounded-md font-mono-code font-bold transition-all cursor-pointer ${
                  sortedSelected.length === 2 && selectedYearIds.includes('y10') && selectedYearIds.includes('y11')
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
                title="Year 10 & Year 11 (GCSE)"
              >
                KS4 (Y10–11)
              </button>
              <button
                type="button"
                onClick={handleSelectKS5}
                className={`px-2 py-1 text-[11px] rounded-md font-mono-code font-bold transition-all cursor-pointer ${
                  sortedSelected.length === 2 && selectedYearIds.includes('y12') && selectedYearIds.includes('y13')
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
                title="Year 12 & Year 13 (A-Level / Sixth Form)"
              >
                KS5 (Y12–13)
              </button>
              {sortedSelected.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className="px-2 py-1 text-[11px] rounded-md font-mono-code font-semibold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 transition-all cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Interactive Class / Year Group Pills (Click to toggle) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {YEARS.map((y) => {
              const isChecked = selectedYearIds.includes(y.id);
              return (
                <div
                  key={y.id}
                  className={`group inline-flex items-center rounded-xl text-xs font-mono-code font-bold border transition-all select-none whitespace-nowrap overflow-hidden shadow-2xs ${
                    isChecked
                      ? 'bg-indigo-600 border-indigo-700 text-white ring-2 ring-indigo-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Main Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleYear(y.id)}
                    className="flex items-center gap-2 px-3.5 py-2 cursor-pointer"
                    title={isChecked ? `Unselect ${y.label}` : `Select ${y.label}`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 flex-shrink-0 text-white" />
                    ) : (
                      <Square className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-slate-600" />
                    )}
                    <span className="whitespace-nowrap font-bold text-xs">{y.label}</span>
                  </button>

                  {/* "Only" button to quickly isolate this year group */}
                  <button
                    type="button"
                    onClick={(e) => handleSelectOnly(y.id, e)}
                    className={`px-2 py-2 text-[10px] font-bold border-l cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-indigo-500/50 text-indigo-100 hover:bg-indigo-700 hover:text-white'
                        : 'border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                    title={`Select only ${y.label}`}
                  >
                    only
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 mt-2.5 font-medium">
            💡 Tip: Click any combination of classes (e.g. <strong>Year 10 & Year 11</strong>) to generate a targeted link. Students opening the link will only see those classes.
          </p>
        </div>

        {/* Links List */}
        <div className="space-y-3.5">
          {/* Student Link */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                Student Link — <span className="text-emerald-800 font-extrabold">{getSelectedTitle()}</span>
              </span>
              <span className="text-[11px] font-mono-code text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                100% Read-Only
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-2.5 font-medium leading-relaxed">
              {getSelectedDescription()}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={studentUrl}
                className="w-full text-xs font-mono-code bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-2 select-all focus:outline-hidden"
              />
              <button
                onClick={() => handleCopy(studentUrl, 'student')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0 shadow-xs"
              >
                {copiedKey === 'student' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'student' ? 'Copied' : 'Copy Link'}
              </button>
              <a
                href={studentUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-300 flex-shrink-0 transition-colors"
                title="Preview Student Link in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Teacher Link */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Users className="w-4 h-4 text-indigo-600" />
                Teacher Link — <span className="text-indigo-800 font-extrabold">{getSelectedTitle()}</span>
              </span>
              <span className="text-[11px] font-mono-code text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold border border-indigo-200">
                Department Access
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-2.5 font-medium leading-relaxed">
              Full editing suite with AI assistant, report cycle planner, internal week notes, and lock controls. Opens filtered to the selected classes.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={teacherUrl}
                className="w-full text-xs font-mono-code bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-2 select-all focus:outline-hidden"
              />
              <button
                onClick={() => handleCopy(teacherUrl, 'teacher')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0 shadow-xs"
              >
                {copiedKey === 'teacher' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'teacher' ? 'Copied' : 'Copy Link'}
              </button>
              <a
                href={teacherUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-300 flex-shrink-0 transition-colors"
                title="Open Teacher Link in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

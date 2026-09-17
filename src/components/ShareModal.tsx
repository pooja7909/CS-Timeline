import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, Share2, ExternalLink, GraduationCap, Users, Shield, X, CheckSquare, Square, RefreshCw, Tag, Sparkles, Eye, Sliders, Type } from 'lucide-react';
import { YEARS } from '../data/defaultPlan';
import { PortalOverviewSettings } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLocked: boolean;
  selectedYears?: string[];
  initialYear?: string;
  initialYears?: string[];
  overviewSettings?: PortalOverviewSettings;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  isLocked,
  selectedYears: activeSelectedYears,
  initialYear,
  initialYears,
  overviewSettings
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

  // Teacher custom banner controls
  const [bannerBadge, setBannerBadge] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [hideBadge, setHideBadge] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const initial = computeInitialYears();
      setSelectedYearIds(initial);
      // Auto-suggest IGCSE if KS4 (y10, y11) is selected
      if (initial.length === 2 && initial.includes('y10') && initial.includes('y11')) {
        setBannerBadge('IGCSE');
      } else if (overviewSettings?.defaultBannerLabel) {
        setBannerBadge(overviewSettings.defaultBannerLabel);
      } else {
        setBannerBadge('');
      }
      setHideBadge(false);
      setCustomTitle('');
    }
  }, [isOpen, initialYear, initialYears, activeSelectedYears, overviewSettings?.defaultBannerLabel]);

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
    if (!bannerBadge || bannerBadge === 'IGCSE' || bannerBadge === 'A-Level') {
      setBannerBadge('Key Stage 3');
      setHideBadge(false);
    }
  };

  const handleSelectKS4 = () => {
    setSelectedYearIds(['y10', 'y11']);
    setBannerBadge('IGCSE');
    setHideBadge(false);
  };

  const handleSelectKS5 = () => {
    setSelectedYearIds(['y12', 'y13']);
    if (!bannerBadge || bannerBadge === 'IGCSE' || bannerBadge === 'Key Stage 3') {
      setBannerBadge('A-Level');
      setHideBadge(false);
    }
  };

  const handleSelectOnly = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedYearIds([id]);
    if (id === 'y10' || id === 'y11') {
      setBannerBadge('IGCSE');
    } else {
      const yr = YEARS.find(y => y.id === id);
      if (yr) setBannerBadge(yr.label);
    }
    setHideBadge(false);
  };

  // Derive sorted selected groups
  const sortedSelected = YEARS.filter(y => selectedYearIds.includes(y.id));
  const isAllYears = sortedSelected.length === YEARS.length || sortedSelected.length === 0;

  // Determine smart suggested banner chips based on current year selection
  const suggestedPills = useMemo(() => {
    const isKS4 = sortedSelected.some(y => y.id === 'y10' || y.id === 'y11');
    const isKS3 = sortedSelected.some(y => y.id === 'y7' || y.id === 'y8' || y.id === 'y9');
    const isKS5 = sortedSelected.some(y => y.id === 'y12' || y.id === 'y13');

    const pills: { label: string; value: string; isHighlighted?: boolean }[] = [];

    if (isKS4) {
      pills.push({ label: '✨ IGCSE', value: 'IGCSE', isHighlighted: true });
      pills.push({ label: 'Key Stage 4', value: 'Key Stage 4' });
      pills.push({ label: 'GCSE', value: 'GCSE' });
    }
    if (isKS3 && !isKS4 && !isKS5) {
      pills.push({ label: '✨ Key Stage 3', value: 'Key Stage 3', isHighlighted: true });
      pills.push({ label: 'KS3 Computing', value: 'KS3 Computing' });
      pills.push({ label: 'Lower Secondary', value: 'Lower Secondary' });
    }
    if (isKS5 && !isKS4 && !isKS3) {
      pills.push({ label: '✨ A-Level', value: 'A-Level', isHighlighted: true });
      pills.push({ label: 'Sixth Form', value: 'Sixth Form' });
      pills.push({ label: 'Key Stage 5', value: 'Key Stage 5' });
    }
    if (sortedSelected.length === 1) {
      pills.push({ label: `${sortedSelected[0].label} Only`, value: `${sortedSelected[0].label}` });
    }
    if (sortedSelected.length > 1 && sortedSelected.length < YEARS.length) {
      pills.push({ label: `${sortedSelected.map(y => y.short).join(' & ')}`, value: sortedSelected.map(y => y.short).join(' & ') });
    }
    return pills;
  }, [sortedSelected]);

  // Compute what banner badge will show on the preview
  const effectivePreviewBadge = hideBadge 
    ? null 
    : bannerBadge.trim() 
    ? bannerBadge.trim() 
    : (sortedSelected.length > 1 && sortedSelected.length < YEARS.length 
        ? (overviewSettings?.defaultBannerLabel || `Shared Classes: ${sortedSelected.map(y => y.short).join(' & ')}`)
        : null);

  const effectivePreviewTitle = customTitle.trim() || overviewSettings?.portalTitle || 'Computing Syllabus & Curriculum Timeline';

  // Generate URL
  const getShareUrl = (role: 'student' | 'teacher') => {
    const params = new URLSearchParams();
    params.set('role', role);
    if (!isAllYears && sortedSelected.length > 0) {
      params.set('year', sortedSelected.map(y => y.id).join(','));
    }
    if (hideBadge) {
      params.set('banner', 'hide');
    } else if (bannerBadge.trim()) {
      params.set('banner', bannerBadge.trim());
    }
    if (customTitle.trim()) {
      params.set('title', customTitle.trim());
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

  if (!isOpen) return null;

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

        {/* Banner Display Customization Card */}
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Student Portal Banner Display</span>
                  <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                    Custom Label
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Define what label students see on the banner badge (e.g. <strong>IGCSE</strong> instead of "Shared Classes")
                </p>
              </div>
            </div>

            {/* Hide Badge Quick Toggle */}
            <button
              type="button"
              onClick={() => setHideBadge(!hideBadge)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                hideBadge 
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {hideBadge ? '🚫 Badge Hidden on Banner' : 'Show Banner Badge'}
            </button>
          </div>

          {!hideBadge && (
            <div className="space-y-2.5">
              {/* Text Input for Custom Banner Label */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Banner Badge Text:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={bannerBadge}
                      onChange={(e) => setBannerBadge(e.target.value)}
                      placeholder={sortedSelected.some(y => y.id === 'y10' || y.id === 'y11') ? "e.g. IGCSE" : "e.g. IGCSE, Key Stage 3..."}
                      className="w-full text-xs font-mono-code bg-white text-slate-900 border border-slate-300 rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {bannerBadge && (
                      <button
                        type="button"
                        onClick={() => setBannerBadge('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                        title="Reset to default"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {bannerBadge !== 'IGCSE' && (
                    <button
                      type="button"
                      onClick={() => { setBannerBadge('IGCSE'); setHideBadge(false); }}
                      className="px-3 py-2 text-xs font-mono-code font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors shadow-2xs flex-shrink-0"
                    >
                      Set "IGCSE"
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Suggested:</span>
                {suggestedPills.map((pill) => (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => { setBannerBadge(pill.value); setHideBadge(false); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all cursor-pointer border ${
                      bannerBadge === pill.value
                        ? 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-2xs'
                        : pill.isHighlighted
                        ? 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold hover:bg-indigo-200'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200 font-medium'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
                {bannerBadge && (
                  <button
                    type="button"
                    onClick={() => setBannerBadge('')}
                    className="px-2 py-1 rounded-lg text-xs font-mono-code text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  >
                    Default (Shared Classes)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Optional Custom Heading */}
          <div className="pt-2 border-t border-indigo-100/80">
            <details className="group">
              <summary className="text-xs font-semibold text-indigo-700 cursor-pointer hover:text-indigo-900 list-none flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  <span>Customize Portal Heading Title (Optional)</span>
                </span>
                <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-2 pt-2 space-y-2">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={overviewSettings?.portalTitle || "Computing Syllabus & Curriculum Timeline"}
                  className="w-full text-xs bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomTitle(`${bannerBadge || 'IGCSE'} Computing Curriculum`)}
                    className="text-[11px] font-mono-code text-indigo-600 hover:underline cursor-pointer"
                  >
                    Use "{bannerBadge || 'IGCSE'} Computing Curriculum"
                  </button>
                  {customTitle && (
                    <button
                      type="button"
                      onClick={() => setCustomTitle('')}
                      className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer ml-auto"
                    >
                      Clear custom title
                    </button>
                  )}
                </div>
              </div>
            </details>
          </div>

          {/* Live Student Banner Preview */}
          <div className="mt-2 p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-[10px] font-mono-code text-indigo-300 uppercase tracking-wider mb-2 border-b border-white/10 pb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Preview: What Students Will See On The Banner</span>
              </span>
              <span className="text-emerald-400 font-bold">Preview</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                  <GraduationCap className="w-3 h-3" />
                  <span>{overviewSettings?.academicYearLabel || 'Academic Year 2026–2027'}</span>
                </span>

                {effectivePreviewBadge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    <Tag className="w-2.5 h-2.5 text-indigo-300" />
                    <span>{effectivePreviewBadge}</span>
                  </span>
                )}

                <span className="text-[10px] text-indigo-200/70 font-mono-code">Student & Parent Portal</span>
              </div>

              <div className="font-display font-bold text-sm text-white truncate">
                {effectivePreviewTitle}
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] font-mono-code">
                <span className="text-indigo-200 uppercase font-bold text-[10px]">
                  {sortedSelected.length === 1 ? 'Curriculum Year Level:' : 'Choose Your Year Level:'}
                </span>
                {effectivePreviewBadge ? (
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20 font-bold text-[10px] flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5 text-indigo-300" />
                    <span>{effectivePreviewBadge}</span>
                    {sortedSelected.length > 1 && (
                      <span className="text-indigo-200 font-normal">({sortedSelected.map(y => y.short).join(' & ')})</span>
                    )}
                  </span>
                ) : hideBadge ? (
                  <span className="text-white/40 text-[10px] italic">(Badge Hidden)</span>
                ) : null}
              </div>
            </div>

            {effectivePreviewBadge && (
              <div className="mt-2 text-[10px] text-emerald-400 font-mono-code flex items-center gap-1 border-t border-white/10 pt-1.5">
                <Check className="w-3 h-3" />
                <span>
                  Replaces "Shared Classes" with <strong>"{effectivePreviewBadge}"</strong> on the banner.
                </span>
              </div>
            )}
          </div>
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

import { PortalOverviewSettings, ActiveWeekSetting, StudentVisibilitySettings } from '../types';

export const DEFAULT_STUDENT_VISIBILITY: StudentVisibilitySettings = {
  // Tabs visible to students in the portal
  showTimeline: true,
  showReports: true,
  showCalendar: false,
  showMatrix: false,
  showRoadmap: false,

  // Sections & components
  showHolidays: true,
  showAssessmentsRibbon: true,
  showAssessmentBadges: true,
  showTeacherNotes: false,

  // Active year groups visible to students
  visibleYears: ['y7', 'y8', 'y9', 'y10', 'y11', 'y12', 'y13']
};

export const DEFAULT_OVERVIEW_SETTINGS: PortalOverviewSettings = {
  portalTitle: 'Computing Syllabus & Curriculum Timeline',
  portalDescription: 'Overview of all 38 teaching weeks, unit timelines, and assessment milestones for the 2026–2027 academic year.',
  academicYearLabel: 'Academic Year 2026–2027'
};

export const DEFAULT_ACTIVE_WEEK_SETTING: ActiveWeekSetting = {
  mode: 'auto',
  manualTermId: 't1',
  manualWeekN: 1
};

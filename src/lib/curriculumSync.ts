import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  CurriculumState,
  TermData,
  YearReportDate,
  LockState,
  StudentVisibilitySettings,
  ActiveWeekSetting,
  PortalOverviewSettings
} from '../types';
import { INITIAL_PLAN } from '../data/defaultPlan';
import { DEFAULT_YEAR_REPORT_DATES } from '../data/reportCycles';
import {
  DEFAULT_OVERVIEW_SETTINGS,
  DEFAULT_ACTIVE_WEEK_SETTING,
  DEFAULT_STUDENT_VISIBILITY
} from '../data/defaultSettings';

const CURRICULUM_DOC_REF = doc(db, 'curriculum', 'main');

/**
 * Firestore is the SINGLE SOURCE OF TRUTH for curriculum data.
 *
 * localStorage is only a browser cache. It must never be used to overwrite
 * Firestore data, and /api/curriculum must never be used as a fallback because
 * Vercel serverless memory is not durable.
 */

function buildDefaultState(): CurriculumState {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    lock: {
      isLocked: false,
      hasPin: true,
      lockedBy: 'Department'
    },
    plan: JSON.parse(JSON.stringify(INITIAL_PLAN)),
    reportDates: JSON.parse(JSON.stringify(DEFAULT_YEAR_REPORT_DATES)),
    studentVisibility: JSON.parse(JSON.stringify(DEFAULT_STUDENT_VISIBILITY)),
    activeWeekSetting: JSON.parse(JSON.stringify(DEFAULT_ACTIVE_WEEK_SETTING)),
    overviewSettings: JSON.parse(JSON.stringify(DEFAULT_OVERVIEW_SETTINGS))
  };
}

function normalizeCloudState(data: any): CurriculumState {
  return {
    version: Number(data?.version) || 1,
    lastUpdated: data?.lastUpdated || new Date().toISOString(),
    lock: data?.lock
      ? {
          isLocked: Boolean(data.lock.isLocked),
          hasPin: data.lock.hasPin !== false,
          ...(data.lock.lockedBy ? { lockedBy: data.lock.lockedBy } : {}),
          ...(data.lock.lockedAt ? { lockedAt: data.lock.lockedAt } : {})
        }
      : {
          isLocked: false,
          hasPin: true,
          lockedBy: 'Department'
        },
    // Only use INITIAL_PLAN for a genuinely missing field.
    // A Firestore document that exists must never be replaced wholesale by defaults.
    plan: Array.isArray(data?.plan) ? data.plan : JSON.parse(JSON.stringify(INITIAL_PLAN)),
    reportDates: Array.isArray(data?.reportDates)
      ? data.reportDates
      : JSON.parse(JSON.stringify(DEFAULT_YEAR_REPORT_DATES)),
    studentVisibility: data?.studentVisibility
      ? { ...DEFAULT_STUDENT_VISIBILITY, ...data.studentVisibility }
      : JSON.parse(JSON.stringify(DEFAULT_STUDENT_VISIBILITY)),
    activeWeekSetting: data?.activeWeekSetting
      ? { ...DEFAULT_ACTIVE_WEEK_SETTING, ...data.activeWeekSetting }
      : JSON.parse(JSON.stringify(DEFAULT_ACTIVE_WEEK_SETTING)),
    overviewSettings: data?.overviewSettings
      ? { ...DEFAULT_OVERVIEW_SETTINGS, ...data.overviewSettings }
      : JSON.parse(JSON.stringify(DEFAULT_OVERVIEW_SETTINGS))
  };
}

function cacheState(state: CurriculumState) {
  try {
    localStorage.setItem('curriculum_plan_v2', JSON.stringify(state.plan));
    localStorage.setItem('curriculum_report_dates_v2', JSON.stringify(state.reportDates));
    localStorage.setItem('curriculum_lock_state', JSON.stringify(state.lock));
    localStorage.setItem('curriculum_student_visibility', JSON.stringify(state.studentVisibility));
    localStorage.setItem('curriculum_active_week_setting', JSON.stringify(state.activeWeekSetting));
    localStorage.setItem('curriculum_overview_settings', JSON.stringify(state.overviewSettings));
    localStorage.setItem('curriculum_last_updated', state.lastUpdated);
  } catch {
    // localStorage is only a cache, so failure here must not affect Firebase.
  }
}

/**
 * Fetch the latest document from Firestore once.
 */
export async function getCurriculumFromCloud(): Promise<CurriculumState | null> {
  const snap = await getDoc(CURRICULUM_DOC_REF);

  if (!snap.exists()) {
    return null;
  }

  const state = normalizeCloudState(snap.data());
  cacheState(state);
  return state;
}

/**
 * Subscribe in real time to the Firestore curriculum document.
 */
export function subscribeToCurriculum(
  onUpdate: (state: CurriculumState) => void,
  onError: (err: any) => void
) {
  let unsubscribe: (() => void) | null = null;

  const initialise = async () => {
    try {
      const initialSnapshot = await getDoc(CURRICULUM_DOC_REF);

      if (!initialSnapshot.exists()) {
        // This is the ONLY place where defaults may be written automatically.
        // It happens only when curriculum/main genuinely does not exist.
        const defaultState = buildDefaultState();
        await setDoc(
          CURRICULUM_DOC_REF,
          sanitizeForFirestore({
            ...defaultState,
            version: 1,
            lastUpdated: new Date().toISOString()
          }),
          { merge: false }
        );
        cacheState(defaultState);
        onUpdate(defaultState);
      } else {
        const state = normalizeCloudState(initialSnapshot.data());
        cacheState(state);
        onUpdate(state);
      }

      unsubscribe = onSnapshot(
        CURRICULUM_DOC_REF,
        (snapshot) => {
          if (!snapshot.exists()) {
            // Do not overwrite an existing local state if the document disappears.
            onError(new Error('Firestore document curriculum/main does not exist.'));
            return;
          }

          const state = normalizeCloudState(snapshot.data());
          cacheState(state);
          onUpdate(state);
        },
        (error) => {
          console.error('Firestore real-time subscription error:', error);
          onError(error);
        }
      );
    } catch (err) {
      console.error('Failed to initialise Firestore curriculum:', err);
      onError(err);
    }
  };

  void initialise();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

/**
 * Recursively remove undefined values before sending data to Firestore.
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }

  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }

  const cleanObj: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }

  return cleanObj as T;
}

/**
 * Save changes directly to Firestore.
 *
 * There is intentionally NO REST/server fallback here.
 */
export async function saveCurriculumToCloud(
  plan?: TermData[],
  reportDates?: YearReportDate[],
  lock?: LockState,
  studentVisibility?: StudentVisibilitySettings,
  activeWeekSetting?: ActiveWeekSetting,
  overviewSettings?: PortalOverviewSettings
): Promise<{ success: boolean; lastUpdated: string }> {
  const lastUpdated = new Date().toISOString();

  const updatePayload: Record<string, any> = {
    lastUpdated,
    updatedBy: 'curriculum-planner'
  };

  if (plan !== undefined) {
    if (!Array.isArray(plan)) {
      throw new Error('Invalid curriculum plan.');
    }
    updatePayload.plan = plan;
  }

  if (reportDates !== undefined) {
    if (!Array.isArray(reportDates)) {
      throw new Error('Invalid report dates.');
    }
    updatePayload.reportDates = reportDates;
  }

  if (studentVisibility !== undefined) {
    updatePayload.studentVisibility = studentVisibility;
  }

  if (activeWeekSetting !== undefined) {
    updatePayload.activeWeekSetting = activeWeekSetting;
  }

  if (overviewSettings !== undefined) {
    updatePayload.overviewSettings = overviewSettings;
  }

  if (lock !== undefined) {
    updatePayload.lock = {
      isLocked: Boolean(lock.isLocked),
      hasPin: Boolean(lock.hasPin),
      ...(lock.lockedBy ? { lockedBy: lock.lockedBy } : {}),
      ...(lock.lockedAt ? { lockedAt: lock.lockedAt } : {})
    };
  }

  const cleanPayload = sanitizeForFirestore(updatePayload);

  // If this fails, THROW. The caller must show an error rather than silently
  // falling back to a non-persistent Vercel endpoint.
  await setDoc(CURRICULUM_DOC_REF, cleanPayload, { merge: true });

  return {
    success: true,
    lastUpdated
  };
}

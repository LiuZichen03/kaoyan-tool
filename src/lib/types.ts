export type SubjectId = "politics" | "english" | "math" | "cs";
export type TaskSubject = SubjectId | "other";
export type QuestionType = "选择题" | "填空题" | "简答题" | "编程题";
export type ReviewResult = "mastered" | "still_wrong";

export interface Subject {
  id: SubjectId;
  name: string;
  chapters: string[];
}

export interface SubjectConfig {
  subjects: Subject[];
  examDate: string;
}

export interface Task {
  id: string;
  subject: TaskSubject;
  title: string;
  timeSlot: string;
  completed: boolean;
  note?: string;
  chapter?: string;
}

export interface DailyPlan {
  date: string;
  tasks: Task[];
  timeSpent?: Record<SubjectId, number>;
  reflection?: string;
  mistakeIds?: string[];
}

export interface ReviewRecord {
  date: string;
  result: ReviewResult;
}

export interface Mistake {
  id: string;
  subject: SubjectId;
  chapter: string;
  type: QuestionType;
  source: string;
  wrongTag: WrongTag | "";
  wrongNote: string;
  imagePath: string;
  tags: string[];
  createdAt: string;
  reviewHistory: ReviewRecord[];
  question?: string;
  answer?: string;
}

export type WrongTag = "概念混淆" | "计算失误" | "审题偏差" | "遗漏条件" | "方法错误" | "时间不足" | "完全不会";

export interface InfoNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  todayPlan: DailyPlan | null;
  totalMistakes: number;
  mistakesBySubject: Record<SubjectId, number>;
  reviewQueue: Mistake[];
  todayCompletion: number;
}

export interface PlanPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  milestones: PlanMilestone[];
}

export interface PlanMilestone {
  id: string;
  subject: SubjectId;
  title: string;
  chapters: string[];
  startDate: string;
  endDate: string;
  completed: boolean;
}

export interface ChapterWithProgress {
  subject: SubjectId;
  chapter: string;
  total: number;
  completed: number;
}

export interface WeeklyStats {
  weekStart: string;
  totalHours: number;
  hoursBySubject: Record<SubjectId, number>;
  completionRate: number;
  mistakesCreated: number;
}

export interface StatsData {
  totalHours: number;
  completionRate: number;
  streak: number;
  totalMistakes: number;
  hoursBySubject: Record<SubjectId, number>;
  weekly: WeeklyStats[];
}

export interface ChapterWeight {
  weight: number;
  note: string;
}

export interface SubjectWeights {
  subjectWeight: number;
  subjectNote: string;
  chapters: Record<string, ChapterWeight>;
}

export interface TodayFocusItem {
  subject: SubjectId;
  chapter: string;
  weight: number;
  reason: string;
  suggestedTime: string;
}

export interface MistakeProfile {
  subject: SubjectId;
  topWrongTag: string;
  topWrongChapter: string;
  total: number;
  insight: string;
}

export interface BriefingAlert {
  level: "info" | "warning" | "urgent";
  message: string;
}

export interface DailyBriefing {
  date: string;
  currentPhase: string;
  phaseDay: number;
  phaseDaysLeft: number;
  daysLeft: number;
  todayFocus: TodayFocusItem[];
  alerts: BriefingAlert[];
  mistakeProfile: MistakeProfile[];
  progress: ChapterWithProgress[];
  streak: number;
  yesterdayHours: number;
  yesterdayReflection?: string;
  dailyQuote: string;
}

export interface Question {
  id: string;
  subject: SubjectId;
  chapter?: string;
  question: string;
  imagePath?: string;
  answer?: string;
  createdAt: string;
  answeredAt?: string;
  status: "pending" | "answered";
}

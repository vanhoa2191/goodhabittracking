export type Language = 'vi' | 'en' | 'zh' | 'ja' | 'ko' | 'fr' | 'de' | 'it' | 'es';

export type ActivityCategory =
  | 'wisdom' // Trí tuệ
  | 'mindset' // Tâm thái
  | 'personality' // Nhân cách
  | 'virtue' // Phẩm chất
  | 'capacity' // Năng lực
  | 'giving' // Việc tốt cho đi
  | 'nutrition' // Ăn uống & Bàn ăn
  | 'physical' // Thể chất & Sức khỏe
  | 'study' // Học tập
  | 'chores' // Việc nhà
  | 'health' // Sức khỏe
  | 'selfcare' // Tự lập
  | 'kindness'; // Việc tốt

export type RecurrenceType = 'daily' | 'weekdays' | 'weekends' | 'custom';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export type ActivityLogStatus = 'completed' | 'pending_approval' | 'approved' | 'rejected';

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export type LeaderboardScope = 'global' | 'group' | 'family';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

export type AgeStage = '0-3' | '3-6' | '6-12' | '12-18';

export interface ParentProfile {
  name: string;
  role: 'father' | 'mother' | 'grandparent' | 'guardian';
  phoneOrEmail?: string;
  onboardedAt?: string;
}

export interface ChildProfile {
  id: string;
  userId?: string;
  name: string; // Tên thật của bé
  nickname?: string; // Biệt danh trên Bảng xếp hạng
  showRealNameOnLeaderboard?: boolean; // false = chỉ hiện biệt danh (bảo mật), true = hiện tên thật
  isPublicOnLeaderboard?: boolean; // true = tham gia BXH cộng đồng, false = ẩn khỏi BXH công khai
  avatar: string;
  themeColor: string;
  points: number;
  totalEarned: number;
  level: number;
  streak: number;
  birthYear?: number;
  age?: number;
  ageStage?: AgeStage;
  lastActiveDate?: string;
  leagueTier?: LeagueTier;
  accessCode?: string; // Mã kết nối thiết bị riêng biệt của bé
  createdAt: string;
}

export interface HabitActivity {
  id: string;
  userId?: string;
  familyId?: string;
  childId: string | null; // null = all children
  title: string;
  description?: string;
  icon: string;
  category: ActivityCategory;
  points: number;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  timeOfDay: TimeOfDay;
  durationMinutes?: number;
  requiresApproval: boolean;
  isActive: boolean;
  targetAgeStage?: AgeStage | 'all';
  isParentRole?: boolean; // true = Thân giáo của Ba Mẹ (Rõ hình cho bé 0-3 tuổi)
  portrait16Key?: string; // 16 Chân dung trẻ em
  boThi7Key?: 'nhan' | 'nhan_mat' | 'ngon' | 'tam' | 'phong' | 'than' | 'toa'; // 7 Bố thí
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  activityId: string;
  childId: string;
  date: string;
  status: ActivityLogStatus;
  pointsAwarded: number;
  completedAt: string;
  proofNote?: string;
}

export interface Reward {
  id: string;
  userId?: string;
  familyId?: string;
  title: string;
  description?: string;
  icon: string;
  costPoints: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface Redemption {
  id: string;
  userId?: string;
  rewardId: string;
  childId: string;
  pointsSpent: number;
  status: 'pending' | 'approved' | 'delivered' | 'rejected';
  requestedAt: string;
  resolvedAt?: string;
}

export interface Badge {
  id: string;
  code: string;
  name: { [key in Language]?: string };
  description: { [key in Language]?: string };
  icon: string;
  criteriaType: 'streak' | 'totalTasks' | 'totalPoints' | 'firstTask';
  criteriaValue: number;
}

export interface ChildBadge {
  childId: string;
  badgeId: string;
  unlockedAt: string;
}

export interface ParentConfig {
  pin: string;
  familyTitle: string;
  storageMode: 'local' | 'cloud'; // User choice: purely local private vs cloud sync
  isPublicLeaderboard: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface JourneyPlan {
  id: string;
  type: 'weekly' | 'monthly';
  periodLabel: string;
  title: { [key in Language]?: string };
  description: { [key in Language]?: string };
  icon: string;
  themeColor: string;
  habits: {
    title: string;
    description: string;
    icon: string;
    category: ActivityCategory;
    points: number;
    timeOfDay: TimeOfDay;
    durationMinutes?: number;
    requiresApproval?: boolean;
  }[];
}

export interface GroupTeam {
  id: string;
  name: string;
  inviteCode: string;
  icon: string;
  createdByChildId?: string;
  memberChildIds: string[];
  weeklyTargetPoints: number;
  rewardType: 'badge' | 'stars' | 'mystery_box' | 'custom';
  customRewardText?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  childId: string;
  nickname: string;
  avatar: string;
  themeColor: string;
  points: number;
  streak: number;
  tier: LeagueTier;
  rank: number;
  isCurrentChild: boolean;
  groupName?: string;
}

export interface Kudo {
  id: string;
  fromChildName: string;
  toChildId: string;
  emoji: string;
  sentAt: string;
}

export type SubscriptionPlan = 'free' | 'trial' | 'monthly' | 'yearly' | 'lifetime';

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  badge?: string;
  price: number;
  originalPrice?: number;
  periodLabel: string;
  description: string;
  features: string[];
  popular?: boolean;
  ctaText: string;
  savings?: string;
  dailyEquivalent?: string;
}

export interface PaymentOrder {
  orderCode: number;
  planId: SubscriptionPlan;
  amount: number;
  description: string;
  accountNumber?: string;
  accountName?: string;
  bin?: string;
  bankName?: string;
  qrCode?: string;
  checkoutUrl?: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  paidAt?: string;
  isMock?: boolean;
}

export interface FamilyDeviceCode {
  code: string;
  familyId: string;
  familyName?: string;
  createdAt: string;
  updatedAt?: string;
}


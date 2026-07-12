/**
 * EcoSphere - ESG Management Platform
 * Shared TypeScript Definitions
 */

export type UserRole = 'admin' | 'dept_head' | 'employee' | 'auditor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId: string | null;
  xp: number;
  balancePoints: number;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string | null;
  headCount: number;
  targetCarbonLimit: number; // tons CO2e per year
  createdAt: string;
  softDeleted?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  type: 'environmental' | 'social' | 'governance';
  softDeleted?: boolean;
}

export interface EmissionFactor {
  id: string;
  name: string;
  factor: number; // kg CO2e per unit
  unit: string;   // e.g., "kWh", "Litre", "km", "kg"
  categoryId: string;
  active: boolean;
  softDeleted?: boolean;
}

export interface CarbonTransaction {
  id: string;
  date: string;
  departmentId: string;
  categoryId: string;
  emissionFactorId: string;
  quantity: number;
  calculatedEmissions: number; // tons CO2e (quantity * factor / 1000)
  recordedById: string;
  description: string;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface EnvironmentalGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  categoryId: string;
  departmentId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'achieved' | 'missed';
  softDeleted?: boolean;
}

export interface CSRActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  pointsReward: number;
  xpReward: number;
  organizerId: string;
  maxParticipants: number;
  status: 'planned' | 'completed' | 'cancelled';
  approvedByAdmin: boolean;
  softDeleted?: boolean;
}

export interface EmployeeParticipation {
  id: string;
  userId: string;
  csrActivityId: string;
  participationDate: string;
  hoursLogged: number;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  xpEarned: number;
  pointsEarned: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  pointsReward: number;
  category: 'environmental' | 'social' | 'governance';
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'under_review' | 'completed' | 'archived';
  softDeleted?: boolean;
}

export interface ChallengeParticipation {
  id: string;
  userId: string;
  challengeId: string;
  joinedDate: string;
  progress: number; // 0 to 100
  proofUrl?: string;
  status: 'active' | 'under_review' | 'completed' | 'failed';
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  effectiveDate: string;
  version: string;
  status: 'active' | 'archived';
  softDeleted?: boolean;
}

export interface PolicyAcknowledgement {
  id: string;
  userId: string;
  policyId: string;
  acknowledgedAt: string;
}

export interface Audit {
  id: string;
  title: string;
  description: string;
  leadAuditorId: string;
  departmentId: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scope: string;
  score?: number; // 0 - 100
  softDeleted?: boolean;
}

export interface ComplianceIssue {
  id: string;
  auditId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under_review' | 'resolved' | 'overdue';
  assignedToId: string; // User ID of Department Head or Admin
  dueDate: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon identifier e.g. "Leaf", "Award", "Users", "ShieldCheck"
  xpThreshold: number;
  triggerType: 'carbon_logged' | 'csr_hours' | 'challenges_completed' | 'policies_signed' | 'audit_completed';
  softDeleted?: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  costPoints: number;
  stock: number;
  active: boolean;
  softDeleted?: boolean;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  redeemedAt: string;
  status: 'pending' | 'delivered' | 'cancelled';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'badge' | 'challenge' | 'policy' | 'compliance' | 'system' | 'reward';
  read: boolean;
  createdAt: string;
}

export interface DepartmentScore {
  id: string;
  departmentId: string;
  environmentalScore: number; // 0 - 100
  socialScore: number;        // 0 - 100
  governanceScore: number;    // 0 - 100
  overallScore: number;       // 0 - 100
  lastUpdated: string;
}

export interface ESGWeights {
  environmental: number; // default 40
  social: number;        // default 30
  governance: number;    // default 30
}

export interface OrganizationSettings {
  companyName: string;
  weights: ESGWeights;
  lastUpdated: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userRole: UserRole;
  departmentName: string;
  xp: number;
  badgesCount: number;
  rank: number;
}

export interface DashboardStats {
  orgCarbonEmissions: number; // current year tons CO2e
  orgCarbonTarget: number;    // target limit tons CO2e
  activeGoalsCount: number;
  csrParticipationRate: number; // percentage
  policyAcknowledgementRate: number; // percentage
  openComplianceIssuesCount: number;
  overallEsgScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  departmentScores: { departmentId: string; departmentName: string; score: number }[];
}

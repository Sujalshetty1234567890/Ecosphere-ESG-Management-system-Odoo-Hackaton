import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  User, Department, Category, EmissionFactor, CarbonTransaction, 
  EnvironmentalGoal, CSRActivity, EmployeeParticipation, Challenge, 
  ChallengeParticipation, Policy, PolicyAcknowledgement, Audit, 
  ComplianceIssue, Badge, UserBadge, Reward, RewardRedemption, 
  Notification, DepartmentScore, OrganizationSettings, ESGWeights,
  DashboardStats, LeaderboardEntry
} from '../src/types';

// Simple password hashing using built-in Node crypto
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const DB_FILE = path.join(process.cwd(), 'db.json');

interface Schema {
  users: (User & { passwordHash: string })[];
  departments: Department[];
  categories: Category[];
  emissionFactors: EmissionFactor[];
  carbonTransactions: CarbonTransaction[];
  environmentalGoals: EnvironmentalGoal[];
  csrActivities: CSRActivity[];
  employeeParticipation: EmployeeParticipation[];
  challenges: Challenge[];
  challengeParticipation: ChallengeParticipation[];
  policies: Policy[];
  policyAcknowledgements: PolicyAcknowledgement[];
  audits: Audit[];
  complianceIssues: ComplianceIssue[];
  badges: Badge[];
  userBadges: UserBadge[];
  rewards: Reward[];
  rewardRedemptions: RewardRedemption[];
  notifications: Notification[];
  departmentScores: DepartmentScore[];
  settings: OrganizationSettings;
}

const DEFAULT_SETTINGS: OrganizationSettings = {
  companyName: "EcoSphere Corp",
  weights: {
    environmental: 40,
    social: 30,
    governance: 30
  },
  lastUpdated: new Date().toISOString()
};

// Initial Seed Data
const getInitialData = (): Schema => {
  const now = new Date();
  
  // Create departments
  const depts: Department[] = [
    { id: 'dept-ops', name: 'Operations', code: 'OPS', managerId: 'user-ops-head', headCount: 120, targetCarbonLimit: 500, createdAt: now.toISOString() },
    { id: 'dept-log', name: 'Logistics', code: 'LOG', managerId: 'user-log-head', headCount: 45, targetCarbonLimit: 850, createdAt: now.toISOString() },
    { id: 'dept-it', name: 'Information Technology', code: 'IT', managerId: null, headCount: 80, targetCarbonLimit: 120, createdAt: now.toISOString() },
    { id: 'dept-hr', name: 'Human Resources', code: 'HR', managerId: null, headCount: 15, targetCarbonLimit: 40, createdAt: now.toISOString() },
    { id: 'dept-mfg', name: 'Manufacturing', code: 'MFG', managerId: null, headCount: 300, targetCarbonLimit: 1500, createdAt: now.toISOString() }
  ];

  // Users
  const usersWithPass = [
    { id: 'user-admin', email: 'admin@ecosphere.com', name: 'Sarah Jenkins', role: 'admin' as const, departmentId: null, xp: 450, balancePoints: 200, passwordHash: hashPassword('password123'), createdAt: now.toISOString() },
    { id: 'user-ops-head', email: 'operations@ecosphere.com', name: 'David Miller', role: 'dept_head' as const, departmentId: 'dept-ops', xp: 1200, balancePoints: 500, passwordHash: hashPassword('password123'), createdAt: now.toISOString() },
    { id: 'user-log-head', email: 'logistics@ecosphere.com', name: 'Elena Rostova', role: 'dept_head' as const, departmentId: 'dept-log', xp: 950, balancePoints: 400, passwordHash: hashPassword('password123'), createdAt: now.toISOString() },
    { id: 'user-employee', email: 'employee@ecosphere.com', name: 'Alex Wong', role: 'employee' as const, departmentId: 'dept-ops', xp: 2800, balancePoints: 1250, passwordHash: hashPassword('password123'), createdAt: now.toISOString() },
    { id: 'user-auditor', email: 'auditor@ecosphere.com', name: 'Marcus Vance', role: 'auditor' as const, departmentId: null, xp: 600, balancePoints: 250, passwordHash: hashPassword('password123'), createdAt: now.toISOString() }
  ];

  // Categories
  const categories: Category[] = [
    { id: 'cat-scope1', name: 'Scope 1 - Direct Emissions', description: 'Direct emissions from owned or controlled sources (fuels, company vehicles).', type: 'environmental' },
    { id: 'cat-scope2', name: 'Scope 2 - Indirect Emissions', description: 'Indirect emissions from the generation of purchased electricity, steam, heating.', type: 'environmental' },
    { id: 'cat-scope3', name: 'Scope 3 - Other Indirect', description: 'Indirect emissions from business travel, employee commuting, waste, supply chain.', type: 'environmental' },
    { id: 'cat-social-comm', name: 'Social - Community Outreach', description: 'Community engagement, charity, and environmental conservation volunteering.', type: 'social' },
    { id: 'cat-social-div', name: 'Social - Diversity & Inclusion', description: 'Training sessions, workshops, and recruitment diversity trackers.', type: 'social' },
    { id: 'cat-gov-compliance', name: 'Governance - Compliance & Safety', description: 'Internal regulatory adherence, health & safety certifications, ethical policies.', type: 'governance' }
  ];

  // Emission Factors
  const emissionFactors: EmissionFactor[] = [
    { id: 'ef-electricity', name: 'Grid Electricity', factor: 0.42, unit: 'kWh', categoryId: 'cat-scope2', active: true },
    { id: 'ef-natural-gas', name: 'Natural Gas', factor: 2.03, unit: 'm3', categoryId: 'cat-scope1', active: true },
    { id: 'ef-petrol', name: 'Petrol (Company Vehicles)', factor: 2.31, unit: 'Litre', categoryId: 'cat-scope1', active: true },
    { id: 'ef-diesel', name: 'Diesel (Trucks & Fleet)', factor: 2.68, unit: 'Litre', categoryId: 'cat-scope1', active: true },
    { id: 'ef-flight', name: 'Business Flights (Short Haul)', factor: 0.15, unit: 'km', categoryId: 'cat-scope3', active: true },
    { id: 'ef-waste', name: 'General Waste to Landfill', factor: 0.50, unit: 'kg', categoryId: 'cat-scope3', active: true }
  ];

  // Carbon history (past 6 months of data for charts)
  const carbonTransactions: CarbonTransaction[] = [];
  const startMonths = 5;
  for (let m = startMonths; m >= 0; m--) {
    const d = new Date();
    d.setMonth(now.getMonth() - m);
    d.setDate(15);
    const dateStr = d.toISOString().split('T')[0];

    depts.forEach((dept) => {
      // Create electricity usage
      const electricityQty = Math.round(dept.targetCarbonLimit * 120 + Math.random() * 20000);
      carbonTransactions.push({
        id: `tx-elec-${dept.code}-${m}`,
        date: dateStr,
        departmentId: dept.id,
        categoryId: 'cat-scope2',
        emissionFactorId: 'ef-electricity',
        quantity: electricityQty,
        calculatedEmissions: parseFloat(((electricityQty * 0.42) / 1000).toFixed(2)),
        recordedById: 'user-ops-head',
        description: `Purchased electricity for ${dept.name} office`,
        status: 'approved'
      });

      // Create vehicle petrol/diesel for Ops/Log/Mfg
      if (['OPS', 'LOG', 'MFG'].includes(dept.code)) {
        const fuelQty = Math.round(2000 + Math.random() * 5000);
        const isDiesel = dept.code === 'LOG';
        carbonTransactions.push({
          id: `tx-fuel-${dept.code}-${m}`,
          date: dateStr,
          departmentId: dept.id,
          categoryId: 'cat-scope1',
          emissionFactorId: isDiesel ? 'ef-diesel' : 'ef-petrol',
          quantity: fuelQty,
          calculatedEmissions: parseFloat(((fuelQty * (isDiesel ? 2.68 : 2.31)) / 1000).toFixed(2)),
          recordedById: 'user-log-head',
          description: `Fleet refuel operational log`,
          status: 'approved'
        });
      }
    });
  }

  // Environmental goals
  const environmentalGoals: EnvironmentalGoal[] = [
    { id: 'goal-1', title: 'Reduce Grid Electricity by 15%', description: 'Achieve a 15% year-over-year reduction in grid energy reliance by onboarding solar options.', targetValue: 350, currentValue: 385, unit: 'Tons CO2e', categoryId: 'cat-scope2', departmentId: 'dept-ops', startDate: now.toISOString(), endDate: new Date(now.getFullYear(), 11, 31).toISOString(), status: 'active' },
    { id: 'goal-2', title: 'Eco-Friendly Logistics Fleet', description: 'Transition regional delivery vehicles to zero/low emission hybrid engines.', targetValue: 400, currentValue: 412, unit: 'Tons CO2e', categoryId: 'cat-scope1', departmentId: 'dept-log', startDate: now.toISOString(), endDate: new Date(now.getFullYear(), 11, 31).toISOString(), status: 'active' },
    { id: 'goal-3', title: 'Zero Waste to Landfill Initiative', description: 'Recycle at least 95% of administrative and assembly line paper/plastic waste.', targetValue: 10, currentValue: 8, unit: 'Tons Waste', categoryId: 'cat-scope3', departmentId: 'dept-it', startDate: now.toISOString(), endDate: new Date(now.getFullYear(), 5, 30).toISOString(), status: 'achieved' }
  ];

  // CSR activities
  const csrActivities: CSRActivity[] = [
    { id: 'csr-1', title: 'Annual Urban Tree Planting', description: 'Join hands with CityGreen to plant 500 saplings in the industrial outskirts.', date: new Date(now.getFullYear(), now.getMonth(), 25).toISOString(), location: 'Oakridge Park, Zone B', pointsReward: 150, xpReward: 300, organizerId: 'user-admin', maxParticipants: 50, status: 'planned', approvedByAdmin: true },
    { id: 'csr-2', title: 'Coastal Plastics Cleanup Drive', description: 'Volunteering beach cleanup session to collect and classify macro and micro-plastics.', date: new Date(now.getFullYear(), now.getMonth() - 1, 12).toISOString(), location: 'South Coast Beach', pointsReward: 200, xpReward: 400, organizerId: 'user-admin', maxParticipants: 30, status: 'completed', approvedByAdmin: true },
    { id: 'csr-3', title: 'Diversity & Inclusion Leadership Panel', description: 'Fostering equitable workplace hiring practices and bias eradication workshop.', date: new Date(now.getFullYear(), now.getMonth() - 2, 5).toISOString(), location: 'Main Seminar Hall / Zoom', pointsReward: 100, xpReward: 200, organizerId: 'user-ops-head', maxParticipants: 100, status: 'completed', approvedByAdmin: true }
  ];

  // Employee Participation
  const employeeParticipation: EmployeeParticipation[] = [
    { id: 'part-1', userId: 'user-employee', csrActivityId: 'csr-2', participationDate: new Date(now.getFullYear(), now.getMonth() - 1, 12).toISOString(), hoursLogged: 5, status: 'approved', xpEarned: 400, pointsEarned: 200 },
    { id: 'part-2', userId: 'user-employee', csrActivityId: 'csr-3', participationDate: new Date(now.getFullYear(), now.getMonth() - 2, 5).toISOString(), hoursLogged: 2, status: 'approved', xpEarned: 200, pointsEarned: 100 }
  ];

  // Challenges
  const challenges: Challenge[] = [
    { id: 'chal-1', title: 'Unplug and Unwind Weekend', description: 'Turn off all non-essential workstations, display monitors, and lab appliances completely over the weekend.', xpReward: 250, pointsReward: 100, category: 'environmental', startDate: now.toISOString(), endDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString(), status: 'active' },
    { id: 'chal-2', title: 'Pedal Power Commute Challenge', description: 'Walk, cycle, or take electric public rail to work for 5 consecutive workdays instead of gas vehicles.', xpReward: 400, pointsReward: 150, category: 'environmental', startDate: now.toISOString(), endDate: new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString(), status: 'active' },
    { id: 'chal-3', title: 'Governance Ethics Cert Master', description: 'Score 100% on the yearly Compliance & Code of Ethical Business Conduct assessment questionnaire.', xpReward: 300, pointsReward: 100, category: 'governance', startDate: now.toISOString(), endDate: new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(), status: 'active' }
  ];

  // Challenge Participation
  const challengeParticipation: ChallengeParticipation[] = [
    { id: 'cp-1', userId: 'user-employee', challengeId: 'chal-1', joinedDate: now.toISOString(), progress: 80, status: 'active' },
    { id: 'cp-2', userId: 'user-employee', challengeId: 'chal-3', joinedDate: now.toISOString(), progress: 100, status: 'completed' }
  ];

  // Policies
  const policies: Policy[] = [
    { id: 'pol-1', title: 'Corporate Environmental Code of Conduct', description: 'Sets out our standards for waste reduction, direct carbon conservation, recycling compliance, and clean vendor procurement.', categoryId: 'cat-scope1', effectiveDate: '2026-01-01', version: '2.1', status: 'active' },
    { id: 'pol-2', title: 'Anti-Bribery and Corruption Policy', description: 'Strict compliance code and whistleblowing mechanism protocols dealing with all international partners, suppliers, and governmental agencies.', categoryId: 'cat-gov-compliance', effectiveDate: '2026-02-15', version: '1.0', status: 'active' },
    { id: 'pol-3', title: 'Workplace Equal Opportunity and Diversity Policy', description: 'Comprehensive guidelines establishing non-discriminatory hiring ratios, safe workspace audits, and pay-parity review standardizations.', categoryId: 'cat-social-div', effectiveDate: '2026-03-10', version: '1.2', status: 'active' }
  ];

  // Policy Acknowledgements
  const policyAcknowledgements: PolicyAcknowledgement[] = [
    { id: 'ack-1', userId: 'user-employee', policyId: 'pol-1', acknowledgedAt: now.toISOString() },
    { id: 'ack-2', userId: 'user-employee', policyId: 'pol-2', acknowledgedAt: now.toISOString() },
    { id: 'ack-3', userId: 'user-ops-head', policyId: 'pol-1', acknowledgedAt: now.toISOString() },
    { id: 'ack-4', userId: 'user-ops-head', policyId: 'pol-2', acknowledgedAt: now.toISOString() },
    { id: 'ack-5', userId: 'user-log-head', policyId: 'pol-1', acknowledgedAt: now.toISOString() }
  ];

  // Audits
  const audits: Audit[] = [
    { id: 'aud-1', title: 'Q1 Environmental Compliance Audit', description: 'On-site evaluation of toxic waste management, chemical scrap storage, and Scope 1 fugitive fuel safety checks.', leadAuditorId: 'user-auditor', departmentId: 'dept-ops', scheduledDate: new Date(now.getFullYear(), now.getMonth() - 2, 10).toISOString(), completedDate: new Date(now.getFullYear(), now.getMonth() - 2, 12).toISOString(), status: 'completed', scope: 'Manufacturing floor lines & Operations warehouse', score: 88 },
    { id: 'aud-2', title: 'Supply Chain Labor Standards Review', description: 'Remote assessment verify third-party contractors comply with strict ethical pay rules and worker age restrictions.', leadAuditorId: 'user-auditor', departmentId: 'dept-log', scheduledDate: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString(), completedDate: new Date(now.getFullYear(), now.getMonth() - 1, 22).toISOString(), status: 'completed', scope: 'Logistics third party haulage vendor list', score: 92 },
    { id: 'aud-3', title: 'Annual Safety & Emissions Inspection', description: 'Comprehensive inspection checking exhaust particulate levels and floor safety railing layouts.', leadAuditorId: 'user-auditor', departmentId: 'dept-mfg', scheduledDate: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(), status: 'in_progress', scope: 'Main assembly facility A, B & C' }
  ];

  // Compliance Issues
  const complianceIssues: ComplianceIssue[] = [
    { id: 'ci-1', auditId: 'aud-1', title: 'Inadequate secondary containment for lubricant waste drums', description: 'Several scrap barrels detected on direct concrete slabs. Requires metal safety spill tray buffers immediately.', severity: 'high', status: 'resolved', assignedToId: 'user-ops-head', dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(), resolvedAt: new Date(now.getFullYear(), now.getMonth() - 1, 8).toISOString(), resolutionNotes: 'Modular heavy-duty secondary containment palleted spill basins purchased and placed.' },
    { id: 'ci-2', auditId: 'aud-3', title: 'Safety barrier missing on assembly zone line-3 feed elevator', description: 'Intermittent safety sensor bypass switch configured. Highly dangerous and breaches governance guidelines.', severity: 'critical', status: 'open', assignedToId: 'user-ops-head', dueDate: new Date(now.getTime() + 5 * 24 * 3600 * 1000).toISOString() },
    { id: 'ci-3', auditId: 'aud-2', title: 'Aptitude/safety training logging gaps for temporary fleet drivers', description: 'Five driver logs missing current defensive vehicle handling qualification updates.', severity: 'medium', status: 'open', assignedToId: 'user-log-head', dueDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString() } // Overdue issue!
  ];

  // Badges
  const badges: Badge[] = [
    { id: 'bd-eco-pioneer', title: 'Eco Pioneer', description: 'Awarded for completing environmental challenges and promoting waste reduction.', iconName: 'Leaf', xpThreshold: 500, triggerType: 'challenges_completed' },
    { id: 'bd-carbon-buster', title: 'Carbon Buster', description: 'Authorized 5 or more approved carbon emission logs with accurate evidence uploads.', iconName: 'FlameKindling', xpThreshold: 1000, triggerType: 'carbon_logged' },
    { id: 'bd-social-star', title: 'Social Star', description: 'Volunteered for 10 or more approved hours of corporate social responsibility.', iconName: 'Users', xpThreshold: 800, triggerType: 'csr_hours' },
    { id: 'bd-compliance-hero', title: 'Compliance Shield', description: 'Successfully reviewed and acknowledged 100% of currently active governance policies.', iconName: 'ShieldCheck', xpThreshold: 1200, triggerType: 'policies_signed' }
  ];

  // User Badges
  const userBadges: UserBadge[] = [
    { id: 'ub-1', userId: 'user-employee', badgeId: 'bd-eco-pioneer', unlockedAt: now.toISOString() },
    { id: 'ub-2', userId: 'user-employee', badgeId: 'bd-compliance-hero', unlockedAt: now.toISOString() }
  ];

  // Rewards
  const rewards: Reward[] = [
    { id: 'rew-1', title: 'Organic Canvas Coffee Tote', description: 'Eco-sustainable sturdy tote bag displaying custom handcrafted EcoSphere logo embroidery.', costPoints: 200, stock: 45, active: true },
    { id: 'rew-2', title: 'Urban Tree Canopy Dedicated Planting', description: 'We will sponsor and plant one direct broadleaf oak sapling in your name, with GPS coordinate maps sent to you.', costPoints: 500, stock: 100, active: true },
    { id: 'rew-3', title: 'Double Wall Vacuum Thermos (750ml)', description: 'Premium insulated matte-black bottle keeping water ice-cold for 24 hours, eradicating disposable plastics.', costPoints: 800, stock: 12, active: true },
    { id: 'rew-4', title: 'Floating Carbon-Credit Floating Day off', description: 'Trade your high-earned community points for one paid floating relaxation/wellbeing day.', costPoints: 2000, stock: 5, active: true }
  ];

  // Reward Redemptions
  const rewardRedemptions: RewardRedemption[] = [
    { id: 'rr-1', userId: 'user-employee', rewardId: 'rew-1', redeemedAt: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString(), status: 'delivered' },
    { id: 'rr-2', userId: 'user-employee', rewardId: 'rew-2', redeemedAt: now.toISOString(), status: 'pending' }
  ];

  // Notifications
  const notifications: Notification[] = [
    { id: 'not-1', userId: 'user-employee', title: 'Welcome to EcoSphere!', message: 'Start participating in active sustainability challenges to earn XP and unlock beautiful achievements.', type: 'system', read: false, createdAt: now.toISOString() },
    { id: 'not-2', userId: 'user-employee', title: 'Compliance Shield Badge Unlocked!', message: 'Outstanding! You have acknowledged all core regulatory policies.', type: 'badge', read: false, createdAt: now.toISOString() },
    { id: 'not-3', userId: 'user-ops-head', title: 'Overdue Compliance Warning', message: 'Defensive safety log compliance gaps in Logistics are now flagged as Overdue.', type: 'compliance', read: false, createdAt: now.toISOString() }
  ];

  // Department scores
  const departmentScores: DepartmentScore[] = [
    { id: 'ds-ops', departmentId: 'dept-ops', environmentalScore: 82, socialScore: 78, governanceScore: 84, overallScore: 81, lastUpdated: now.toISOString() },
    { id: 'ds-log', departmentId: 'dept-log', environmentalScore: 75, socialScore: 85, governanceScore: 70, overallScore: 76, lastUpdated: now.toISOString() },
    { id: 'ds-it', departmentId: 'dept-it', environmentalScore: 90, socialScore: 80, governanceScore: 95, overallScore: 89, lastUpdated: now.toISOString() }
  ];

  return {
    users: usersWithPass,
    departments: depts,
    categories,
    emissionFactors,
    carbonTransactions,
    environmentalGoals,
    csrActivities,
    employeeParticipation,
    challenges,
    challengeParticipation,
    policies,
    policyAcknowledgements,
    audits,
    complianceIssues,
    badges,
    userBadges,
    rewards,
    rewardRedemptions,
    notifications,
    departmentScores,
    settings: DEFAULT_SETTINGS
  };
};

export class ESGDatabase {
  private data: Schema;

  constructor() {
    this.data = this.load();
    this.calculateAllScores();
  }

  private load(): Schema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      } catch (e) {
        console.error("Failed to parse db.json, generating default data...", e);
        const init = getInitialData();
        this.saveData(init);
        return init;
      }
    } else {
      const init = getInitialData();
      this.saveData(init);
      return init;
    }
  }

  private saveData(data: Schema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Failed to write to db.json", e);
    }
  }

  public persist() {
    this.saveData(this.data);
  }

  // --- SCORE CALCULATION SERVICE ---
  public calculateAllScores() {
    const weights = this.data.settings.weights;
    const nowStr = new Date().toISOString();

    this.data.departments.forEach((dept) => {
      if (dept.softDeleted) return;

      // 1. Environmental Score (40% weight default)
      // Base calculation: carbon transaction totals compared to pro-rated limit + goal success rate
      const deptTransactions = this.data.carbonTransactions.filter(
        (tx) => tx.departmentId === dept.id && tx.status === 'approved'
      );
      const totalEmissions = deptTransactions.reduce((acc, tx) => acc + tx.calculatedEmissions, 0);
      
      // Carbon score is 100 - (percentage of limit exceeded * 100). Cap at 0, max 100.
      let carbonScore = 100;
      if (dept.targetCarbonLimit > 0) {
        const ratio = totalEmissions / dept.targetCarbonLimit;
        if (ratio > 1) {
          carbonScore = Math.max(0, 100 - (ratio - 1) * 100);
        } else {
          carbonScore = 100 - (ratio * 20); // soft deduction based on consumption
        }
      }

      // Goal success rate
      const deptGoals = this.data.environmentalGoals.filter(
        (g) => g.departmentId === dept.id && !g.softDeleted
      );
      let goalScore = 80; // default benchmark if no goals
      if (deptGoals.length > 0) {
        const achieved = deptGoals.filter(g => g.status === 'achieved').length;
        const active = deptGoals.filter(g => g.status === 'active').length;
        goalScore = ((achieved + active * 0.7) / deptGoals.length) * 100;
      }
      const environmentalScore = Math.round(carbonScore * 0.6 + goalScore * 0.4);

      // 2. Social Score (30% weight default)
      // Measured by average employee CSR hours and active challenge completions
      const deptEmployees = this.data.users.filter(u => u.departmentId === dept.id);
      const employeeIds = deptEmployees.map(e => e.id);
      
      let socialScore = 75; // Default standard baseline
      if (employeeIds.length > 0) {
        const participations = this.data.employeeParticipation.filter(
          p => employeeIds.includes(p.userId) && p.status === 'approved'
        );
        const totalHours = participations.reduce((acc, p) => acc + p.hoursLogged, 0);
        const averageHours = totalHours / employeeIds.length;
        // Target: 8 hours per employee. Cap at 100
        const hourScore = Math.min(100, (averageHours / 8) * 100);

        const completions = this.data.challengeParticipation.filter(
          cp => employeeIds.includes(cp.userId) && cp.status === 'completed'
        ).length;
        const completionScore = Math.min(100, (completions / employeeIds.length) * 50);

        socialScore = Math.round(hourScore * 0.6 + completionScore * 0.4);
      }

      // 3. Governance Score (30% weight default)
      // Policy acknowledgement rate minus active compliance issue penalty
      let govScore = 100;
      if (deptEmployees.length > 0) {
        const activePolicies = this.data.policies.filter(p => p.status === 'active' && !p.softDeleted);
        let totalPossibleAcks = activePolicies.length * deptEmployees.length;
        let actualAcks = 0;
        
        deptEmployees.forEach((emp) => {
          const empAcks = this.data.policyAcknowledgements.filter(a => a.userId === emp.id).length;
          actualAcks += empAcks;
        });

        const ackRate = totalPossibleAcks > 0 ? (actualAcks / totalPossibleAcks) * 100 : 100;

        // Compliance issue penalties
        const openIssues = this.data.complianceIssues.filter(
          ci => ci.status === 'open' && this.data.audits.find(a => a.id === ci.auditId)?.departmentId === dept.id
        );
        const overdueIssues = this.data.complianceIssues.filter(
          ci => ci.status === 'overdue' && this.data.audits.find(a => a.id === ci.auditId)?.departmentId === dept.id
        );

        const penalty = (openIssues.length * 10) + (overdueIssues.length * 20);
        govScore = Math.max(0, Math.round(ackRate - penalty));
      }

      // Calculate total ESG Score based on configured settings weights
      const totalWeight = weights.environmental + weights.social + weights.governance;
      const overallScore = Math.round(
        (environmentalScore * weights.environmental + 
         socialScore * weights.social + 
         govScore * weights.governance) / totalWeight
      );

      // Find or create department score entry
      const existingScoreIdx = this.data.departmentScores.findIndex(ds => ds.departmentId === dept.id);
      const scoreObj: DepartmentScore = {
        id: `ds-${dept.id}`,
        departmentId: dept.id,
        environmentalScore,
        socialScore,
        governanceScore: govScore,
        overallScore,
        lastUpdated: nowStr
      };

      if (existingScoreIdx >= 0) {
        this.data.departmentScores[existingScoreIdx] = scoreObj;
      } else {
        this.data.departmentScores.push(scoreObj);
      }
    });

    this.persist();
  }

  public getOrganizationESGStats(): DashboardStats {
    const depts = this.data.departments.filter(d => !d.softDeleted);
    const scores = this.data.departmentScores.filter(s => depts.some(d => d.id === s.departmentId));

    // Organization averages
    const environmentalScore = Math.round(scores.reduce((acc, s) => acc + s.environmentalScore, 0) / (scores.length || 1));
    const socialScore = Math.round(scores.reduce((acc, s) => acc + s.socialScore, 0) / (scores.length || 1));
    const governanceScore = Math.round(scores.reduce((acc, s) => acc + s.governanceScore, 0) / (scores.length || 1));
    
    const weights = this.data.settings.weights;
    const totalWeight = weights.environmental + weights.social + weights.governance;
    const overallEsgScore = Math.round(
      (environmentalScore * weights.environmental + 
       socialScore * weights.social + 
       governanceScore * weights.governance) / totalWeight
    );

    const activeTx = this.data.carbonTransactions.filter(tx => tx.status === 'approved');
    const orgCarbonEmissions = parseFloat(activeTx.reduce((acc, tx) => acc + tx.calculatedEmissions, 0).toFixed(1));
    const orgCarbonTarget = depts.reduce((acc, d) => acc + d.targetCarbonLimit, 0);

    const activeGoalsCount = this.data.environmentalGoals.filter(g => g.status === 'active' && !g.softDeleted).length;

    // Social participation %
    const totalEmployees = this.data.users.filter(u => u.role === 'employee').length;
    const activeParticipators = new Set(this.data.employeeParticipation.map(p => p.userId)).size;
    const csrParticipationRate = totalEmployees > 0 ? Math.round((activeParticipators / totalEmployees) * 100) : 0;

    // Policy acknowledgement rate %
    const activePoliciesCount = this.data.policies.filter(p => p.status === 'active' && !p.softDeleted).length;
    const totalAcks = this.data.policyAcknowledgements.length;
    const policyAcknowledgementRate = (activePoliciesCount * totalEmployees) > 0 
      ? Math.min(100, Math.round((totalAcks / (activePoliciesCount * totalEmployees)) * 100)) 
      : 100;

    const openComplianceIssuesCount = this.data.complianceIssues.filter(ci => ['open', 'overdue'].includes(ci.status)).length;

    return {
      orgCarbonEmissions,
      orgCarbonTarget,
      activeGoalsCount,
      csrParticipationRate,
      policyAcknowledgementRate,
      openComplianceIssuesCount,
      overallEsgScore,
      environmentalScore,
      socialScore,
      governanceScore,
      departmentScores: scores.map(s => ({
        departmentId: s.departmentId,
        departmentName: depts.find(d => d.id === s.departmentId)?.name || 'Unknown',
        score: s.overallScore
      }))
    };
  }

  // --- MASTER CRUD APIS ---

  // Users
  public getUsers() { return this.data.users; }
  public findUserById(id: string) { return this.data.users.find(u => u.id === id); }
  public findUserByEmail(email: string) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  public createUser(user: User & { passwordHash: string }) {
    this.data.users.push(user);
    this.persist();
    return user;
  }
  public updateUser(id: string, updates: Partial<User>) {
    const user = this.findUserById(id);
    if (user) {
      Object.assign(user, updates);
      this.persist();
    }
    return user;
  }

  // Departments
  public getDepartments() { return this.data.departments.filter(d => !d.softDeleted); }
  public findDepartmentById(id: string) { return this.data.departments.find(d => d.id === id && !d.softDeleted); }
  public createDepartment(dept: Department) {
    this.data.departments.push(dept);
    this.calculateAllScores();
    return dept;
  }
  public updateDepartment(id: string, updates: Partial<Department>) {
    const dept = this.findDepartmentById(id);
    if (dept) {
      Object.assign(dept, updates);
      this.calculateAllScores();
    }
    return dept;
  }
  public deleteDepartment(id: string) {
    const dept = this.data.departments.find(d => d.id === id);
    if (dept) {
      dept.softDeleted = true;
      this.calculateAllScores();
    }
    return dept;
  }

  // Categories
  public getCategories() { return this.data.categories.filter(c => !c.softDeleted); }
  public findCategoryById(id: string) { return this.data.categories.find(c => c.id === id && !c.softDeleted); }
  public createCategory(cat: Category) {
    this.data.categories.push(cat);
    this.persist();
    return cat;
  }
  public updateCategory(id: string, updates: Partial<Category>) {
    const cat = this.findCategoryById(id);
    if (cat) {
      Object.assign(cat, updates);
      this.persist();
    }
    return cat;
  }
  public deleteCategory(id: string) {
    const cat = this.data.categories.find(c => c.id === id);
    if (cat) {
      cat.softDeleted = true;
      this.persist();
    }
    return cat;
  }

  // Emission Factors
  public getEmissionFactors() { return this.data.emissionFactors.filter(ef => !ef.softDeleted); }
  public findEmissionFactorById(id: string) { return this.data.emissionFactors.find(ef => ef.id === id && !ef.softDeleted); }
  public createEmissionFactor(ef: EmissionFactor) {
    this.data.emissionFactors.push(ef);
    this.persist();
    return ef;
  }
  public updateEmissionFactor(id: string, updates: Partial<EmissionFactor>) {
    const ef = this.findEmissionFactorById(id);
    if (ef) {
      Object.assign(ef, updates);
      this.persist();
    }
    return ef;
  }
  public deleteEmissionFactor(id: string) {
    const ef = this.data.emissionFactors.find(e => e.id === id);
    if (ef) {
      ef.softDeleted = true;
      this.persist();
    }
    return ef;
  }

  // Carbon Transactions
  public getCarbonTransactions() { return this.data.carbonTransactions; }
  public createCarbonTransaction(tx: CarbonTransaction) {
    this.data.carbonTransactions.push(tx);
    this.calculateAllScores();
    return tx;
  }
  public updateCarbonTransaction(id: string, status: 'approved' | 'rejected') {
    const tx = this.data.carbonTransactions.find(t => t.id === id);
    if (tx) {
      tx.status = status;
      this.calculateAllScores();
      
      // If approved, trigger gamification points for the recording user
      if (status === 'approved') {
        const user = this.findUserById(tx.recordedById);
        if (user) {
          user.xp += 150;
          user.balancePoints += 50;
          this.createNotification(
            tx.recordedById, 
            'Carbon Log Approved!', 
            `Your emission log (${tx.calculatedEmissions} Tons CO2e) has been approved. You earned 150 XP and 50 points.`,
            'system'
          );
          this.checkAndUnlockBadges(tx.recordedById);
        }
      }
    }
    return tx;
  }

  // Goals
  public getGoals() { return this.data.environmentalGoals.filter(g => !g.softDeleted); }
  public findGoalById(id: string) { return this.data.environmentalGoals.find(g => g.id === id && !g.softDeleted); }
  public createGoal(goal: EnvironmentalGoal) {
    this.data.environmentalGoals.push(goal);
    this.calculateAllScores();
    return goal;
  }
  public updateGoal(id: string, updates: Partial<EnvironmentalGoal>) {
    const goal = this.findGoalById(id);
    if (goal) {
      Object.assign(goal, updates);
      this.calculateAllScores();
    }
    return goal;
  }
  public deleteGoal(id: string) {
    const goal = this.data.environmentalGoals.find(g => g.id === id);
    if (goal) {
      goal.softDeleted = true;
      this.calculateAllScores();
    }
    return goal;
  }

  // CSR Activities & Participation
  public getCSRActivities() { return this.data.csrActivities.filter(c => !c.softDeleted); }
  public findCSRById(id: string) { return this.data.csrActivities.find(c => c.id === id && !c.softDeleted); }
  public createCSR(csr: CSRActivity) {
    this.data.csrActivities.push(csr);
    this.persist();
    return csr;
  }
  public updateCSR(id: string, updates: Partial<CSRActivity>) {
    const csr = this.findCSRById(id);
    if (csr) {
      Object.assign(csr, updates);
      this.persist();
    }
    return csr;
  }
  public deleteCSR(id: string) {
    const csr = this.data.csrActivities.find(c => c.id === id);
    if (csr) {
      csr.softDeleted = true;
      this.persist();
    }
    return csr;
  }

  // CSR Participation
  public getCSRParticipations() { return this.data.employeeParticipation; }
  public registerForCSR(userId: string, csrActivityId: string, hoursLogged: number, proofUrl?: string) {
    const activity = this.findCSRById(csrActivityId);
    if (!activity) throw new Error('CSR Activity not found');

    const id = `part-${Date.now()}`;
    const participation: EmployeeParticipation = {
      id,
      userId,
      csrActivityId,
      participationDate: new Date().toISOString(),
      hoursLogged,
      proofUrl,
      status: 'pending',
      xpEarned: activity.xpReward,
      pointsEarned: activity.pointsReward
    };
    this.data.employeeParticipation.push(participation);
    this.persist();
    return participation;
  }

  public approveCSRParticipation(id: string, status: 'approved' | 'rejected') {
    const part = this.data.employeeParticipation.find(p => p.id === id);
    if (part) {
      part.status = status;
      if (status === 'approved') {
        const user = this.findUserById(part.userId);
        if (user) {
          user.xp += part.xpEarned;
          user.balancePoints += part.pointsEarned;
          this.createNotification(
            part.userId, 
            'CSR Volunteering Approved!', 
            `Your CSR entry for ${part.hoursLogged} hours was approved. You received ${part.xpEarned} XP and ${part.pointsEarned} points.`, 
            'challenge'
          );
          this.checkAndUnlockBadges(part.userId);
        }
      }
      this.calculateAllScores();
    }
    return part;
  }

  // Challenges & Lifecycles
  public getChallenges() { return this.data.challenges.filter(c => !c.softDeleted); }
  public findChallengeById(id: string) { return this.data.challenges.find(c => c.id === id && !c.softDeleted); }
  public createChallenge(challenge: Challenge) {
    this.data.challenges.push(challenge);
    this.persist();
    return challenge;
  }
  public updateChallenge(id: string, updates: Partial<Challenge>) {
    const challenge = this.findChallengeById(id);
    if (challenge) {
      Object.assign(challenge, updates);
      this.persist();
    }
    return challenge;
  }
  public deleteChallenge(id: string) {
    const challenge = this.data.challenges.find(c => c.id === id);
    if (challenge) {
      challenge.softDeleted = true;
      this.persist();
    }
    return challenge;
  }

  // Challenge Join and Action
  public joinChallenge(userId: string, challengeId: string) {
    const existing = this.data.challengeParticipation.find(p => p.userId === userId && p.challengeId === challengeId);
    if (existing) return existing;

    const entry: ChallengeParticipation = {
      id: `cp-${Date.now()}`,
      userId,
      challengeId,
      joinedDate: new Date().toISOString(),
      progress: 0,
      status: 'active'
    };
    this.data.challengeParticipation.push(entry);
    this.persist();
    return entry;
  }

  public updateChallengeProgress(userId: string, challengeId: string, progress: number, proofUrl?: string) {
    const part = this.data.challengeParticipation.find(p => p.userId === userId && p.challengeId === challengeId);
    if (!part) return null;

    part.progress = Math.min(100, Math.max(0, progress));
    if (proofUrl) part.proofUrl = proofUrl;

    if (part.progress === 100) {
      part.status = 'under_review';
    }
    this.persist();
    return part;
  }

  public reviewChallengeCompletion(id: string, status: 'completed' | 'failed') {
    const part = this.data.challengeParticipation.find(p => p.id === id);
    if (part) {
      part.status = status;
      if (status === 'completed') {
        const challenge = this.findChallengeById(part.challengeId);
        const user = this.findUserById(part.userId);
        if (challenge && user) {
          user.xp += challenge.xpReward;
          user.balancePoints += challenge.pointsReward;
          this.createNotification(
            part.userId,
            'Challenge Completed!',
            `Awesome job! You completed the challenge "${challenge.title}" and earned ${challenge.xpReward} XP and ${challenge.pointsReward} Reward Points!`,
            'challenge'
          );
          this.checkAndUnlockBadges(part.userId);
        }
      }
      this.calculateAllScores();
    }
    return part;
  }

  // Policies & Acknowledgements
  public getPolicies() { return this.data.policies.filter(p => !p.softDeleted); }
  public findPolicyById(id: string) { return this.data.policies.find(p => p.id === id && !p.softDeleted); }
  public createPolicy(policy: Policy) {
    this.data.policies.push(policy);
    this.persist();
    return policy;
  }
  public updatePolicy(id: string, updates: Partial<Policy>) {
    const policy = this.findPolicyById(id);
    if (policy) {
      Object.assign(policy, updates);
      this.persist();
    }
    return policy;
  }
  public deletePolicy(id: string) {
    const policy = this.data.policies.find(p => p.id === id);
    if (policy) {
      policy.softDeleted = true;
      this.persist();
    }
    return policy;
  }

  public acknowledgePolicy(userId: string, policyId: string) {
    const existing = this.data.policyAcknowledgements.find(a => a.userId === userId && a.policyId === policyId);
    if (existing) return existing;

    const ack: PolicyAcknowledgement = {
      id: `ack-${Date.now()}`,
      userId,
      policyId,
      acknowledgedAt: new Date().toISOString()
    };
    this.data.policyAcknowledgements.push(ack);
    
    // Add XP to user
    const user = this.findUserById(userId);
    if (user) {
      user.xp += 100;
      user.balancePoints += 25;
      this.createNotification(
        userId,
        'Policy Acknowledged',
        `Thank you for reading and acknowledging corporate guidelines. You earned 100 XP and 25 points.`,
        'policy'
      );
      this.checkAndUnlockBadges(userId);
    }

    this.calculateAllScores();
    return ack;
  }

  // Audits & Compliance Issues
  public getAudits() { return this.data.audits.filter(a => !a.softDeleted); }
  public findAuditById(id: string) { return this.data.audits.find(a => a.id === id && !a.softDeleted); }
  public createAudit(audit: Audit) {
    this.data.audits.push(audit);
    this.persist();
    return audit;
  }
  public updateAudit(id: string, updates: Partial<Audit>) {
    const audit = this.findAuditById(id);
    if (audit) {
      Object.assign(audit, updates);
      if (updates.status === 'completed') {
        this.calculateAllScores();
        // Give Auditor XP
        const auditor = this.findUserById(audit.leadAuditorId);
        if (auditor) {
          auditor.xp += 200;
          this.persist();
        }
      }
    }
    return audit;
  }
  public deleteAudit(id: string) {
    const audit = this.data.audits.find(a => a.id === id);
    if (audit) {
      audit.softDeleted = true;
      this.persist();
    }
    return audit;
  }

  // Compliance Issues
  public getComplianceIssues() { return this.data.complianceIssues; }
  public findComplianceIssueById(id: string) { return this.data.complianceIssues.find(ci => ci.id === id); }
  public createComplianceIssue(issue: ComplianceIssue) {
    this.data.complianceIssues.push(issue);
    this.calculateAllScores();

    // Notify assigned user (usually department head)
    this.createNotification(
      issue.assignedToId,
      `New Compliance Issue Assigned: ${issue.title}`,
      `A safety/regulatory issue with ${issue.severity.toUpperCase()} severity was raised in your department. Action required by ${new Date(issue.dueDate).toLocaleDateString()}.`,
      'compliance'
    );
    return issue;
  }

  public resolveComplianceIssue(id: string, notes: string) {
    const issue = this.findComplianceIssueById(id);
    if (issue) {
      issue.status = 'resolved';
      issue.resolvedAt = new Date().toISOString();
      issue.resolutionNotes = notes;
      this.calculateAllScores();

      // Notify auditor
      const audit = this.findAuditById(issue.auditId);
      if (audit) {
        this.createNotification(
          audit.leadAuditorId,
          `Compliance Issue Resolved: ${issue.title}`,
          `The compliance breach assigned to department head has been marked resolved. Verification notes: "${notes}"`,
          'compliance'
        );
      }
    }
    return issue;
  }

  // Gamification: Badges & Rewards
  public getBadges() { return this.data.badges.filter(b => !b.softDeleted); }
  public findBadgeById(id: string) { return this.data.badges.find(b => b.id === id && !b.softDeleted); }
  public createBadge(badge: Badge) {
    this.data.badges.push(badge);
    this.persist();
    return badge;
  }
  public updateBadge(id: string, updates: Partial<Badge>) {
    const b = this.findBadgeById(id);
    if (b) {
      Object.assign(b, updates);
      this.persist();
    }
    return b;
  }
  public deleteBadge(id: string) {
    const b = this.data.badges.find(badge => badge.id === id);
    if (b) {
      b.softDeleted = true;
      this.persist();
    }
    return b;
  }

  public getRewards() { return this.data.rewards.filter(r => !r.softDeleted); }
  public findRewardById(id: string) { return this.data.rewards.find(r => r.id === id && !r.softDeleted); }
  public createReward(reward: Reward) {
    this.data.rewards.push(reward);
    this.persist();
    return reward;
  }
  public updateReward(id: string, updates: Partial<Reward>) {
    const reward = this.findRewardById(id);
    if (reward) {
      Object.assign(reward, updates);
      this.persist();
    }
    return reward;
  }
  public deleteReward(id: string) {
    const reward = this.data.rewards.find(r => r.id === id);
    if (reward) {
      reward.softDeleted = true;
      this.persist();
    }
    return reward;
  }

  // Reward Redemption
  public getRewardRedemptions() { return this.data.rewardRedemptions; }
  public redeemReward(userId: string, rewardId: string) {
    const reward = this.findRewardById(rewardId);
    const user = this.findUserById(userId);

    if (!reward) throw new Error('Reward not found');
    if (!user) throw new Error('User not found');
    if (reward.stock <= 0) throw new Error('Reward out of stock');
    if (user.balancePoints < reward.costPoints) throw new Error('Insufficient points balance');

    // Deduct points, decrement stock
    user.balancePoints -= reward.costPoints;
    reward.stock -= 1;

    const id = `rr-${Date.now()}`;
    const redemption: RewardRedemption = {
      id,
      userId,
      rewardId,
      redeemedAt: new Date().toISOString(),
      status: 'pending'
    };
    this.data.rewardRedemptions.push(redemption);
    
    this.createNotification(
      userId,
      'Reward Redeemed successfully!',
      `You redeemed "${reward.title}" for ${reward.costPoints} points. Status: Pending Delivery.`,
      'reward'
    );
    this.persist();
    return redemption;
  }

  public updateRedemptionStatus(id: string, status: 'delivered' | 'cancelled') {
    const red = this.data.rewardRedemptions.find(r => r.id === id);
    if (red) {
      red.status = status;
      if (status === 'cancelled') {
        // Refund points
        const user = this.findUserById(red.userId);
        const reward = this.findRewardById(red.rewardId);
        if (user && reward) {
          user.balancePoints += reward.costPoints;
          reward.stock += 1;
          this.createNotification(
            red.userId,
            'Redemption Refunded',
            `Your redemption order for "${reward.title}" was cancelled and ${reward.costPoints} points were refunded.`,
            'reward'
          );
        }
      } else if (status === 'delivered') {
        const reward = this.findRewardById(red.rewardId);
        this.createNotification(
          red.userId,
          'Reward Shipped/Delivered!',
          `Awesome! Your eco reward "${reward?.title}" has been completed and delivered. Enjoy!`,
          'reward'
        );
      }
      this.persist();
    }
    return red;
  }

  // Leaderboard service
  public getLeaderboard(): LeaderboardEntry[] {
    const activeUsers = this.data.users.filter(u => u.xp > 0);
    const depts = this.data.departments;

    const entries: LeaderboardEntry[] = activeUsers.map(u => {
      const dept = depts.find(d => d.id === u.departmentId);
      const badgesCount = this.data.userBadges.filter(ub => ub.userId === u.id).length;
      return {
        userId: u.id,
        userName: u.name,
        userRole: u.role,
        departmentName: dept ? dept.name : 'Corporate',
        xp: u.xp,
        badgesCount,
        rank: 0
      };
    });

    // Sort by XP descending
    entries.sort((a, b) => b.xp - a.xp);
    entries.forEach((e, index) => { e.rank = index + 1; });
    return entries;
  }

  // Badges automatic unlock checks
  public checkAndUnlockBadges(userId: string) {
    const user = this.findUserById(userId);
    if (!user) return;

    const activeBadges = this.getBadges();
    const existingBadges = this.data.userBadges.filter(ub => ub.userId === userId);

    // Calculate metrics
    const userChallengesCount = this.data.challengeParticipation.filter(
      cp => cp.userId === userId && cp.status === 'completed'
    ).length;

    const userCarbonLogsCount = this.data.carbonTransactions.filter(
      tx => tx.recordedById === userId && tx.status === 'approved'
    ).length;

    const userCSRHours = this.data.employeeParticipation.filter(
      p => p.userId === userId && p.status === 'approved'
    ).reduce((acc, p) => acc + p.hoursLogged, 0);

    const userPolicyAcks = this.data.policyAcknowledgements.filter(
      a => a.userId === userId
    ).length;

    activeBadges.forEach((badge) => {
      // Check if already unlocked
      if (existingBadges.some(eb => eb.badgeId === badge.id)) return;

      let meetsThreshold = false;
      if (badge.triggerType === 'challenges_completed' && userChallengesCount >= (badge.xpThreshold / 250)) {
        meetsThreshold = true;
      } else if (badge.triggerType === 'carbon_logged' && userCarbonLogsCount >= (badge.xpThreshold / 200)) {
        meetsThreshold = true;
      } else if (badge.triggerType === 'csr_hours' && userCSRHours >= (badge.xpThreshold / 100)) {
        meetsThreshold = true;
      } else if (badge.triggerType === 'policies_signed' && userPolicyAcks >= 2) { // signed at least 2 active policies
        meetsThreshold = true;
      }

      if (meetsThreshold) {
        // Unlock badge!
        const id = `ub-${Date.now()}-${badge.id}`;
        this.data.userBadges.push({
          id,
          userId,
          badgeId: badge.id,
          unlockedAt: new Date().toISOString()
        });

        // Give bonus XP
        user.xp += 500;
        user.balancePoints += 100;

        this.createNotification(
          userId,
          `🏆 Badge Unlocked: ${badge.title}!`,
          `Superb! You unlocked the "${badge.title}" badge: ${badge.description}. Earned +500 XP & +100 Rewards points!`,
          'badge'
        );
      }
    });

    this.persist();
  }

  // Settings
  public getSettings() { return this.data.settings; }
  public updateSettings(updates: Partial<OrganizationSettings>) {
    Object.assign(this.data.settings, updates);
    this.data.settings.lastUpdated = new Date().toISOString();
    this.calculateAllScores();
    return this.data.settings;
  }

  // Notifications
  public getNotifications(userId: string) {
    return this.data.notifications.filter(n => n.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
  public createNotification(userId: string, title: string, message: string, type: Notification['type']) {
    const notif: Notification = {
      id: `not-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.push(notif);
    this.persist();
    return notif;
  }
  public markAllNotificationsRead(userId: string) {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    this.persist();
  }
}

export const db = new ESGDatabase();

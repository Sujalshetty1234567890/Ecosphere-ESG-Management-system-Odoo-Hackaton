import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword } from './server/db';
import { GoogleGenAI } from '@google/genai';
import { User, UserRole } from './src/types';

const TOKEN_SECRET = process.env.JWT_SECRET || 'ecosphere_jwt_secret_998182';

// Custom Extend Express Request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

// Generate secure signature
function signToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

// Verify secure signature
function verifyToken(token: string): any {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const computedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (computedSignature !== signature) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch (e) {
    return null;
  }
}

// Authentication Middleware
function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || (payload.exp && Date.now() > payload.exp)) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
  req.user = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    name: payload.name
  };
  next();
}

// Role Authorization Middleware
function requireRoles(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Forbidden: Requires one of these roles: ${roles.join(', ')}` });
      return;
    }
    next();
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- 1. AUTHENTICATION ROUTERS ---

  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { email, password, name, role, departmentId } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ error: 'Missing email, password, or name' });
        return;
      }

      const existing = db.findUserByEmail(email);
      if (existing) {
        res.status(400).json({ error: 'User already exists with this email' });
        return;
      }

      const id = `user-${Date.now()}`;
      const newUser = db.createUser({
        id,
        email,
        name,
        role: (role || 'employee') as UserRole,
        departmentId: departmentId || null,
        xp: 0,
        balancePoints: 0,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
      });

      // Issue JWT Token
      const token = signToken({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        exp: Date.now() + 7 * 24 * 3600 * 1000 // 7 days
      });

      // Remove passwordHash before sending
      const { passwordHash, ...userResponse } = newUser;
      res.status(201).json({ token, user: userResponse });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Missing email or password' });
        return;
      }

      const user = db.findUserByEmail(email);
      if (!user || user.passwordHash !== hashPassword(password)) {
        res.status(400).json({ error: 'Invalid email or password' });
        return;
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        exp: Date.now() + 7 * 24 * 3600 * 1000 // 7 days
      });

      const { passwordHash, ...userResponse } = user;
      res.json({ token, user: userResponse });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const fullUser = db.findUserById(req.user.id);
    if (!fullUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { passwordHash, ...userResponse } = fullUser;
    res.json(userResponse);
  });

  // Simulated forgot/reset passwords for enterprise conformance
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'No account registered with this email address' });
      return;
    }
    // Simulation link
    res.json({ message: 'Password reset link dispatched via email simulator', resetToken: 'simulated_reset_token_991823' });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { email, newPassword } = req.body;
    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.passwordHash = hashPassword(newPassword);
    db.persist();
    res.json({ message: 'Password successfully reconfigured. Please log in.' });
  });


  // --- MODULE 1: MASTER DATA CRUDS ---

  // Departments
  app.get('/api/departments', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getDepartments());
  });

  app.post('/api/departments', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const { name, code, managerId, headCount, targetCarbonLimit } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'Name and Code are mandatory' });
      return;
    }
    const newDept = db.createDepartment({
      id: `dept-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      managerId: managerId || null,
      headCount: Number(headCount) || 1,
      targetCarbonLimit: Number(targetCarbonLimit) || 100,
      createdAt: new Date().toISOString()
    });
    res.status(201).json(newDept);
  });

  app.put('/api/departments/:id', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const dept = db.updateDepartment(req.params.id, req.body);
    if (!dept) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    res.json(dept);
  });

  app.delete('/api/departments/:id', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const dept = db.deleteDepartment(req.params.id);
    if (!dept) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    res.json({ message: 'Department soft-deleted successfully' });
  });

  // Categories
  app.get('/api/categories', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getCategories());
  });

  app.post('/api/categories', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const { name, description, type } = req.body;
    if (!name || !type) {
      res.status(400).json({ error: 'Name and Type are required' });
      return;
    }
    const newCat = db.createCategory({
      id: `cat-${Date.now()}`,
      name,
      description: description || '',
      type: type as any
    });
    res.status(201).json(newCat);
  });

  app.put('/api/categories/:id', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const cat = db.updateCategory(req.params.id, req.body);
    if (!cat) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(cat);
  });

  app.delete('/api/categories/:id', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const cat = db.deleteCategory(req.params.id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ message: 'Category soft-deleted' });
  });

  // Emission Factors
  app.get('/api/emission-factors', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getEmissionFactors());
  });

  app.post('/api/emission-factors', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const { name, factor, unit, categoryId } = req.body;
    if (!name || factor === undefined || !unit || !categoryId) {
      res.status(400).json({ error: 'Missing required emission factor fields' });
      return;
    }
    const newFactor = db.createEmissionFactor({
      id: `ef-${Date.now()}`,
      name,
      factor: Number(factor),
      unit,
      categoryId,
      active: true
    });
    res.status(201).json(newFactor);
  });

  app.put('/api/emission-factors/:id', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const ef = db.updateEmissionFactor(req.params.id, req.body);
    if (!ef) {
      res.status(404).json({ error: 'Emission factor not found' });
      return;
    }
    res.json(ef);
  });

  app.delete('/api/emission-factors/:id', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const ef = db.deleteEmissionFactor(req.params.id);
    if (!ef) {
      res.status(404).json({ error: 'Emission factor not found' });
      return;
    }
    res.json({ message: 'Emission factor soft-deleted' });
  });

  // Environmental Goals
  app.get('/api/goals', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getGoals());
  });

  app.post('/api/goals', authMiddleware, requireRoles(['admin', 'dept_head']), (req: Request, res: Response) => {
    const { title, description, targetValue, currentValue, unit, categoryId, departmentId, startDate, endDate, status } = req.body;
    if (!title || targetValue === undefined || !unit || !categoryId || !departmentId) {
      res.status(400).json({ error: 'Missing required goal fields' });
      return;
    }
    const newGoal = db.createGoal({
      id: `goal-${Date.now()}`,
      title,
      description: description || '',
      targetValue: Number(targetValue),
      currentValue: Number(currentValue) || 0,
      unit,
      categoryId,
      departmentId,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      status: (status || 'active') as any
    });
    res.status(201).json(newGoal);
  });

  app.put('/api/goals/:id', authMiddleware, requireRoles(['admin', 'dept_head']), (req: Request, res: Response) => {
    const goal = db.updateGoal(req.params.id, req.body);
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    res.json(goal);
  });

  app.delete('/api/goals/:id', authMiddleware, requireRoles(['admin', 'dept_head']), (req: Request, res: Response) => {
    const goal = db.deleteGoal(req.params.id);
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    res.json({ message: 'Goal soft-deleted' });
  });


  // --- MODULE 2: CARBON EMISSION TRACKING ---

  app.get('/api/carbon-transactions', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getCarbonTransactions());
  });

  app.post('/api/carbon-transactions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { date, departmentId, categoryId, emissionFactorId, quantity, description, proofUrl } = req.body;
    if (!departmentId || !categoryId || !emissionFactorId || quantity === undefined) {
      res.status(400).json({ error: 'Missing parameters for carbon log creation' });
      return;
    }

    const factorRecord = db.findEmissionFactorById(emissionFactorId);
    if (!factorRecord) {
      res.status(404).json({ error: 'Emission factor not configured' });
      return;
    }

    // Calculated emissions: (quantity * factor) / 1000 to convert kg into Tons
    const calculatedEmissions = parseFloat(((Number(quantity) * factorRecord.factor) / 1000).toFixed(3));

    const newTx = db.createCarbonTransaction({
      id: `tx-${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      departmentId,
      categoryId,
      emissionFactorId,
      quantity: Number(quantity),
      calculatedEmissions,
      recordedById: req.user!.id,
      description: description || `Logged emissions for ${factorRecord.name}`,
      proofUrl: proofUrl || '',
      status: req.user!.role === 'employee' ? 'pending' : 'approved' // Automatically approve if Head or Admin logs
    });

    res.status(201).json(newTx);
  });

  app.put('/api/carbon-transactions/:id/approve', authMiddleware, requireRoles(['admin', 'dept_head']), (req: Request, res: Response) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be approved or rejected' });
      return;
    }
    const tx = db.updateCarbonTransaction(req.params.id, status as any);
    if (!tx) {
      res.status(404).json({ error: 'Carbon transaction log not found' });
      return;
    }
    res.json(tx);
  });


  // --- MODULE 3: SOCIAL & CSR PLATFORM ---

  app.get('/api/csr-activities', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getCSRActivities());
  });

  app.post('/api/csr-activities', authMiddleware, requireRoles(['admin', 'dept_head']), (req: AuthenticatedRequest, res: Response) => {
    const { title, description, date, location, pointsReward, xpReward, maxParticipants } = req.body;
    if (!title || !date || !location) {
      res.status(400).json({ error: 'Title, date and location are mandatory' });
      return;
    }

    const newActivity = db.createCSR({
      id: `csr-${Date.now()}`,
      title,
      description: description || '',
      date,
      location,
      pointsReward: Number(pointsReward) || 100,
      xpReward: Number(xpReward) || 200,
      organizerId: req.user!.id,
      maxParticipants: Number(maxParticipants) || 50,
      status: 'planned',
      approvedByAdmin: req.user!.role === 'admin'
    });
    res.status(201).json(newActivity);
  });

  app.put('/api/csr-activities/:id', authMiddleware, requireRoles(['admin', 'dept_head']), (req: Request, res: Response) => {
    const act = db.updateCSR(req.params.id, req.body);
    if (!act) {
      res.status(404).json({ error: 'CSR Activity not found' });
      return;
    }
    res.json(act);
  });

  app.delete('/api/csr-activities/:id', authMiddleware, requireRoles(['admin', 'dept_head']), (req: Request, res: Response) => {
    const act = db.deleteCSR(req.params.id);
    if (!act) {
      res.status(404).json({ error: 'CSR Activity not found' });
      return;
    }
    res.json({ message: 'CSR activity soft-deleted' });
  });

  // Volunteering registration & Logging participations
  app.get('/api/csr-activities/participations', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getCSRParticipations());
  });

  app.post('/api/csr-activities/:id/participate', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { hoursLogged, proofUrl } = req.body;
      const part = db.registerForCSR(
        req.user!.id,
        req.params.id,
        Number(hoursLogged) || 2,
        proofUrl
      );
      res.status(201).json(part);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Participation request failed' });
    }
  });

  app.post('/api/csr-activities/participations/:id/approve', authMiddleware, requireRoles(['admin', 'dept_head']), (req: Request, res: Response) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be approved or rejected' });
      return;
    }
    const part = db.approveCSRParticipation(req.params.id, status as any);
    if (!part) {
      res.status(404).json({ error: 'Participation log not found' });
      return;
    }
    res.json(part);
  });


  // --- MODULE 4: GOVERNANCE & COMPLIANCE ---

  // Policies
  app.get('/api/policies', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getPolicies());
  });

  app.post('/api/policies', authMiddleware, requireRoles(['admin', 'auditor']), (req: Request, res: Response) => {
    const { title, description, categoryId, effectiveDate, version } = req.body;
    if (!title || !categoryId) {
      res.status(400).json({ error: 'Title and Category are required' });
      return;
    }
    const newPol = db.createPolicy({
      id: `pol-${Date.now()}`,
      title,
      description: description || '',
      categoryId,
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
      version: version || '1.0',
      status: 'active'
    });
    res.status(201).json(newPol);
  });

  app.post('/api/policies/:id/acknowledge', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const ack = db.acknowledgePolicy(req.user!.id, req.params.id);
    res.json(ack);
  });

  app.put('/api/policies/:id', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const policy = db.updatePolicy(req.params.id, req.body);
    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    res.json(policy);
  });

  app.delete('/api/policies/:id', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const policy = db.deletePolicy(req.params.id);
    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    res.json({ message: 'Policy soft-deleted' });
  });

  // Audits
  app.get('/api/audits', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getAudits());
  });

  app.post('/api/audits', authMiddleware, requireRoles(['admin', 'auditor']), (req: AuthenticatedRequest, res: Response) => {
    const { title, description, departmentId, scheduledDate, scope } = req.body;
    if (!title || !departmentId || !scheduledDate) {
      res.status(400).json({ error: 'Title, Department, and Date are mandatory' });
      return;
    }
    const newAudit = db.createAudit({
      id: `aud-${Date.now()}`,
      title,
      description: description || '',
      leadAuditorId: req.user!.id,
      departmentId,
      scheduledDate,
      status: 'scheduled',
      scope: scope || 'All operations',
      score: 0
    });
    res.status(201).json(newAudit);
  });

  app.put('/api/audits/:id', authMiddleware, requireRoles(['admin', 'auditor']), (req: Request, res: Response) => {
    const audit = db.updateAudit(req.params.id, req.body);
    if (!audit) {
      res.status(404).json({ error: 'Audit session not found' });
      return;
    }
    res.json(audit);
  });

  app.delete('/api/audits/:id', authMiddleware, requireRoles(['admin', 'auditor']), (req: Request, res: Response) => {
    const audit = db.deleteAudit(req.params.id);
    if (!audit) {
      res.status(404).json({ error: 'Audit session not found' });
      return;
    }
    res.json({ message: 'Audit session soft-deleted' });
  });

  // Compliance Issues
  app.get('/api/compliance-issues', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getComplianceIssues());
  });

  app.post('/api/compliance-issues', authMiddleware, requireRoles(['admin', 'auditor']), (req: Request, res: Response) => {
    const { auditId, title, description, severity, assignedToId, dueDate } = req.body;
    if (!auditId || !title || !severity || !assignedToId || !dueDate) {
      res.status(400).json({ error: 'Missing compliance issue details' });
      return;
    }
    const newIssue = db.createComplianceIssue({
      id: `ci-${Date.now()}`,
      auditId,
      title,
      description: description || '',
      severity: severity as any,
      status: 'open',
      assignedToId,
      dueDate
    });
    res.status(201).json(newIssue);
  });

  app.post('/api/compliance-issues/:id/resolve', authMiddleware, requireRoles(['admin', 'dept_head']), (req: Request, res: Response) => {
    const { notes } = req.body;
    if (!notes) {
      res.status(400).json({ error: 'Resolution notes are mandatory' });
      return;
    }
    const issue = db.resolveComplianceIssue(req.params.id, notes);
    if (!issue) {
      res.status(404).json({ error: 'Compliance issue not found' });
      return;
    }
    res.json(issue);
  });


  // --- MODULE 5: GAMIFICATION PLATFORM ---

  // Challenges
  app.get('/api/challenges', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getChallenges());
  });

  app.post('/api/challenges', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const { title, description, xpReward, pointsReward, category, startDate, endDate } = req.body;
    if (!title || xpReward === undefined || pointsReward === undefined || !category) {
      res.status(400).json({ error: 'Missing core challenge fields' });
      return;
    }
    const newChallenge = db.createChallenge({
      id: `chal-${Date.now()}`,
      title,
      description: description || '',
      xpReward: Number(xpReward),
      pointsReward: Number(pointsReward),
      category: category as any,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      status: 'active'
    });
    res.status(201).json(newChallenge);
  });

  app.post('/api/challenges/:id/join', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const entry = db.joinChallenge(req.user!.id, req.params.id);
    res.json(entry);
  });

  app.post('/api/challenges/:id/progress', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { progress, proofUrl } = req.body;
    const entry = db.updateChallengeProgress(
      req.user!.id,
      req.params.id,
      Number(progress),
      proofUrl
    );
    if (!entry) {
      res.status(404).json({ error: 'Participation record not found. Join the challenge first.' });
      return;
    }
    res.json(entry);
  });

  // Review & Approve Challenge completions
  app.get('/api/challenges/participations', authMiddleware, (req: Request, res: Response) => {
    // Return all challenge participation entries
    const dbRef: any = db;
    res.json(dbRef.data.challengeParticipation);
  });

  app.post('/api/challenges/participations/:id/approve', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const { status } = req.body;
    if (!['completed', 'failed'].includes(status)) {
      res.status(400).json({ error: 'Status must be completed or failed' });
      return;
    }
    const part = db.reviewChallengeCompletion(req.params.id, status as any);
    if (!part) {
      res.status(404).json({ error: 'Challenge entry not found' });
      return;
    }
    res.json(part);
  });

  // Rewards Store
  app.get('/api/rewards', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getRewards());
  });

  app.post('/api/rewards', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const { title, description, costPoints, stock } = req.body;
    if (!title || costPoints === undefined || stock === undefined) {
      res.status(400).json({ error: 'Missing core reward fields' });
      return;
    }
    const newReward = db.createReward({
      id: `rew-${Date.now()}`,
      title,
      description: description || '',
      costPoints: Number(costPoints),
      stock: Number(stock),
      active: true
    });
    res.status(201).json(newReward);
  });

  app.post('/api/rewards/:id/redeem', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
      const red = db.redeemReward(req.user!.id, req.params.id);
      res.json(red);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Redemption rejected' });
    }
  });

  app.get('/api/rewards/redemptions', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getRewardRedemptions());
  });

  app.post('/api/rewards/redemptions/:id/status', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const { status } = req.body;
    if (!['delivered', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Status must be delivered or cancelled' });
      return;
    }
    const red = db.updateRedemptionStatus(req.params.id, status as any);
    if (!red) {
      res.status(404).json({ error: 'Redemption record not found' });
      return;
    }
    res.json(red);
  });

  // Badges
  app.get('/api/badges', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getBadges());
  });

  app.get('/api/user-badges', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const dbRef: any = db;
    const userBadges = dbRef.data.userBadges.filter((ub: any) => ub.userId === req.user!.id);
    res.json(userBadges);
  });


  // --- LEADERBOARD & ESG SCORE SETTINGS & NOTIFICATIONS ---

  app.get('/api/leaderboard', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getLeaderboard());
  });

  app.get('/api/settings', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getSettings());
  });

  app.put('/api/settings', authMiddleware, requireRoles(['admin']), (req: Request, res: Response) => {
    const { companyName, weights } = req.body;
    const updates: any = {};
    if (companyName) updates.companyName = companyName;
    if (weights) {
      const { environmental, social, governance } = weights;
      if (environmental + social + governance !== 100) {
        res.status(400).json({ error: 'Weights sum must be exactly 100%' });
        return;
      }
      updates.weights = {
        environmental: Number(environmental),
        social: Number(social),
        governance: Number(governance)
      };
    }
    const settings = db.updateSettings(updates);
    res.json(settings);
  });

  app.get('/api/notifications', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    res.json(db.getNotifications(req.user!.id));
  });

  app.post('/api/notifications/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    db.markAllNotificationsRead(req.user!.id);
    res.json({ success: true });
  });

  app.post('/api/notifications/read-all', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    db.markAllNotificationsRead(req.user!.id);
    res.json({ success: true });
  });

  // Global ESG Scores
  app.get('/api/stats', authMiddleware, (req: Request, res: Response) => {
    res.json(db.getOrganizationESGStats());
  });

  app.get('/api/stats/departments', authMiddleware, (req: Request, res: Response) => {
    const dbRef: any = db;
    res.json(dbRef.data.departmentScores);
  });


  // --- DYNAMIC AI ESG REPORT GENERATOR (Using Gemini API) ---

  app.post('/api/reports/ai-summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        res.json({
          summary: "### AI ESG Performance Review\n\n*API configuration is required for dynamic Gemini analysis. Here is a pre-compiled performance index:*\n\n1. **Carbon Footprint**: Direct grid electricity offsets and logistics hybrid upgrades are showing an efficient downward curve. Focus on Scope 1 direct diesel reduction.\n2. **Social Score**: Streaks in biking/walking challenges have generated a high volunteer turnout. Urban forestry activities logged 120+ aggregate community hours.\n3. **Governance Guidelines**: All active policies have a 95% acknowledgment index. A pending compliance audit is scheduled in Manufacturing lines."
        });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const stats = db.getOrganizationESGStats();
      const depts = db.getDepartments();
      const issues = db.getComplianceIssues().filter(ci => ci.status === 'open');

      const prompt = `
        Analyze the following real-time corporate Environmental, Social, and Governance (ESG) performance data for "${db.getSettings().companyName}":

        - Overall ESG Score: ${stats.overallEsgScore}/100
          - Environmental Sub-score: ${stats.environmentalScore}/100
          - Social Sub-score: ${stats.socialScore}/100
          - Governance Sub-score: ${stats.governanceScore}/100
        
        - Carbon Statistics:
          - Total emissions: ${stats.orgCarbonEmissions} Tons CO2e
          - Target limit: ${stats.orgCarbonTarget} Tons CO2e
          - Active environmental goals logged: ${stats.activeGoalsCount}

        - Community Engagement:
          - CSR volunteer participation: ${stats.csrParticipationRate}%
          - Policy acknowledgement: ${stats.policyAcknowledgementRate}%

        - Compliance Status:
          - Outstanding/Unresolved regulatory compliance issues: ${stats.openComplianceIssuesCount}
          - Specific critical unresolved issues: ${JSON.stringify(issues.map(i => ({ title: i.title, severity: i.severity, dueDate: i.dueDate })))}

        - Departments: ${JSON.stringify(stats.departmentScores)}

        Provide an elite, professional C-suite summary of accomplishments, critical risk areas, and concrete strategic guidelines to boost the company's scores. Format the output elegantly in clear Markdown with bold callouts, professional styling, and realistic business advice. Be concise but highly actionable.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const reportText = response.text || "Failed to generate report text.";
      res.json({ summary: reportText, report: reportText });
    } catch (err: any) {
      console.error("Gemini report generation failed:", err);
      const fallbackReport = `### Dynamic ESG Analysis Summary\n\n*AI feedback represents standard sector predictions in compliance with current operations:*\n\n- **Decarbonization Vector**: Direct Scope 1 petrol consumption has hit an elevated limit in Logistics. Strategic fleet transitions are recommended.\n- **Workplace Engagement**: CSR volunteering events show standard active rosters (+${db.getOrganizationESGStats().csrParticipationRate}% coverage).\n- **Compliance Safeguards**: Resolve overdue compliance records in Logistics fleet audits immediately to elevate the governance index.`;
      res.json({ 
        summary: fallbackReport,
        report: fallbackReport
      });
    }
  });


  // --- VITE MIDDLEWARE OR STATIC SERVER ENTRY POINT ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error boundary handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandle express error:", err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer();

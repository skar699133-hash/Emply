import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { classifyRequest } from '../services/request-classifier.service.js';
import { routeRequest } from '../services/routing-agent.service.js';
import { assessPriority } from '../services/priority-agent.service.js';
import { answerPolicyQuestion } from '../services/policy-agent.service.js';
import { evaluateAdvocacyContext } from '../services/employee-advocacy.service.js';
import { analyzeLeaveRequest, suggestOptimalLeaveDates } from '../services/leave-agent.service.js';
import { generateEmployeeRequestSummary } from '../services/summary-agent.service.js';

const router = Router();

// POST /api/ai/ask - Universal intelligent entry point
router.post('/ask', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    const employeeId = req.user?.userId;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ error: 'Query text is required' });
      return;
    }

    if (!employeeId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Step 1: Understand & Classify
    const classification = await classifyRequest(query, { employeeId });

    // Step 2: Route to correct organizational team
    const routing = await routeRequest(classification, employeeId);

    // Step 3: Assess Priority & Organizational SLA
    const priority = await assessPriority(classification);

    // Step 4: Transparent Employee Preview Summary
    const summary = generateEmployeeRequestSummary({
      title: query.length > 80 ? query.substring(0, 77) + '...' : query,
      categoryName: classification.category,
      priority: priority.priority,
      teamName: routing.teamName,
      slaDescription: priority.slaDescription,
      confidentiality: priority.sensitivity,
      nextStep: classification.requiresImmediateEscalation
        ? 'Emergency protocol active: immediate human dispatch to Safety team.'
        : `${routing.teamName} will review and acknowledge within ${priority.recommendedSlaHours} hours.`,
    });

    res.json({
      classification,
      routing,
      priority,
      summary,
      isEmergency: classification.requiresImmediateEscalation,
      isConfidential: routing.confidential,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/policy-qa - Grounded Policy Inquiries
router.post('/policy-qa', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { question } = req.body;
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const answer = await answerPolicyQuestion(question);
    res.json(answer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/advocacy - Employee Advocacy & Fairness Review
router.post('/advocacy', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { concernText, leaveRequestId, workplaceRequestId } = req.body;
    const employeeId = req.user?.userId!;

    const advocacy = await evaluateAdvocacyContext({
      employeeId,
      concernText: concernText || '',
      leaveRequestId,
      workplaceRequestId,
    });

    res.json(advocacy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/leave-analysis - Analyze Leave Proposal
router.post('/leave-analysis', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { leaveTypeCode, startDate, endDate, durationDays, reason } = req.body;
    const employeeId = req.user?.userId!;

    const analysis = await analyzeLeaveRequest({
      employeeId,
      leaveTypeCode: leaveTypeCode || 'ANNUAL',
      startDate,
      endDate,
      durationDays: parseFloat(durationDays || '1'),
      reason: reason || 'Vacation',
    });

    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/leave-date-suggestions
router.post('/leave-date-suggestions', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { durationDays, monthOffset } = req.body;
    const employeeId = req.user?.userId!;

    const suggestions = await suggestOptimalLeaveDates(
      employeeId,
      parseInt(durationDays || '3', 10),
      parseInt(monthOffset || '1', 10)
    );

    res.json(suggestions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

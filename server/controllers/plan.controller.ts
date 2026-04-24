import { Request, Response } from 'express';
import { runDeterministicChecks } from '../services/deterministic.js';
import { generateLLMNarrative } from '../services/geminiService.js';
import Plan from '../models/Plan.js';

/**
 * @desc    Generate a new career plan
 * @route   POST /api/plans/generate
 * @access  Private
 */
export const generatePlanController = async (req: Request, res: Response) => {
  try {
    const { origin, destination, target_role, salary_expectation, timeline_months, work_authorisation_constraint } = req.body;

    if (!origin || !destination || !target_role || !salary_expectation || !timeline_months) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const profile = {
      origin,
      destination,
      target_role,
      salary_expectation: Number(salary_expectation),
      timeline_months: Number(timeline_months),
      work_authorisation_constraint: work_authorisation_constraint || 'none'
    };

    
    const deterministicResult = runDeterministicChecks(profile);

    // ---- EDGE CASE: Missing data — return structured response, not a hallucinated plan ----
    if (!deterministicResult.dataFound) {
      res.status(200).json({
        data: {
          dataFound: false,
          message: `No data available for "${destination}" + "${target_role}". ` +
            `Currently supported combinations are: Germany/Senior Backend Engineer, UK/Product Manager.`,
          input: profile,
          data_confidence_summary: { overall: 'placeholder', fields: {} }
        }
      });
      return;
    }

    // ---- Step 2: LLM narrative (non-blocking style — runs after deterministic) ----
    let narrative = '';
    let action_steps: string[] = [];

    try {
      const llmResult = await generateLLMNarrative({
        ...profile,
        feasibility_label: deterministicResult.feasibility_label,
        conflicts: deterministicResult.conflicts,
        eligible_routes: deterministicResult.eligible_routes,
        salary_analysis: deterministicResult.salary_analysis,
        destinationData: deterministicResult.destinationData
      });
      narrative = llmResult.narrative;
      action_steps = llmResult.action_steps;
    } catch {
      // LLM failed — use fallback
      narrative = 'Plan generated. Please review the conflicts and eligible routes below.';
      action_steps = ['Review conflicts', 'Check eligible visa routes', 'Begin job search'];
    }

    // ---- Assemble final plan result ----
    const planResult = {
      feasibility_score: deterministicResult.feasibility_score,
      feasibility_label: deterministicResult.feasibility_label,
      conflicts: deterministicResult.conflicts,
      eligible_routes: deterministicResult.eligible_routes,
      salary_analysis: deterministicResult.salary_analysis,
      narrative,
      action_steps,
      data_confidence_summary: deterministicResult.data_confidence_summary
    };

    res.json({ data: { dataFound: true, input: profile, plan: planResult } });
  } catch (err) {
    console.error('Plan generation error:', err);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
};

/**
 * @desc    Save a generated career plan
 * @route   POST /api/plans/save
 * @access  Private
 */
export const savePlanController = async (req: Request, res: Response) => {
  try {
    const { title, profile, plan } = req.body;

    if (!title || !profile || !plan) {
      res.status(400).json({ error: 'title, profile and plan are required' });
      return;
    }

    const newPlan = await Plan.create({
      userId: req.user,
      title,
      profile,
      plan
    });

    res.status(201).json({ data: { plan: newPlan } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save plan' });
  }
};

/**
 * @desc    Get all saved plans for logged-in user
 * @route   GET /api/plans
 * @access  Private
 */
export const getPlanListController = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find({ userId: req.user })
      .select('title profile.destination profile.target_role plan.feasibility_label savedAt')
      .sort({ savedAt: -1 });

    res.json({ data: plans });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

/**
 * @desc    Get a specific saved plan
 * @route   GET /api/plans/:id
 * @access  Private
 */
export const getPlanDetailController = async (req: Request, res: Response) => {
  try {
    const plan = await Plan.findOne({ _id: req.params.id, userId: req.user });

    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    res.json({ data: plan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
};

/**
 * @desc    Delete a saved plan
 * @route   DELETE /api/plans/:id
 * @access  Private
 */
export const deletePlanController = async (req: Request, res: Response) => {
  try {
    await Plan.findOneAndDelete({ _id: req.params.id, userId: req.user });
    res.json({ data: { message: 'Plan deleted' } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete plan' });
  }
};
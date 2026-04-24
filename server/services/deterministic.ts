import destinationsData from '../data/destinations.json';

interface UserInput {
  origin: string;
  destination: string;
  target_role: string;
  salary_expectation: number;
  timeline_months: number;
  work_authorisation_constraint: string;
}

interface DeterministicResult {
  dataFound: boolean;
  dataKey: string | null;
  destinationData: any | null;
  conflicts: string[];
  eligible_routes: any[];
  salary_analysis: {
    user_expectation: number;
    market_median: number;
    currency_code: string;
    shortfall: number | null;
    is_below_threshold: boolean;
    threshold_route: string | null;
  };
  feasibility_score: number;
  feasibility_label: 'feasible' | 'challenging' | 'not_feasible';
  data_confidence_summary: {
    overall: string;
    fields: Record<string, string>;
  };
}

// Build a lookup key from destination + role
function buildDataKey(destination: string, role: string): string {
  const dest = destination.toLowerCase().replace(/\s+/g, '_');
  const r = role.toLowerCase().replace(/\s+/g, '_');
  return `${dest}_${r}`;
}

export function runDeterministicChecks(input: UserInput): DeterministicResult {
  const dataKey = buildDataKey(input.destination, input.target_role);
  const data = (destinationsData as Record<string, any>)[dataKey];

  // ---- EDGE CASE: Missing data ----
  if (!data) {
    return {
      dataFound: false,
      dataKey,
      destinationData: null,
      conflicts: [],
      eligible_routes: [],
      salary_analysis: {
        user_expectation: input.salary_expectation,
        market_median: 0,
        currency_code: 'N/A',
        shortfall: null,
        is_below_threshold: false,
        threshold_route: null
      },
      feasibility_score: 0,
      feasibility_label: 'not_feasible',
      data_confidence_summary: {
        overall: 'placeholder',
        fields: {}
      }
    };
  }

  const conflicts: string[] = [];
  const eligibleRoutes: any[] = [];
  let lowestThresholdRoute: string | null = null;
  let lowestThreshold: number | null = null;
  let isBelowThreshold = false;

  
  for (const route of data.work_authorisation_routes) {
    if (
      input.work_authorisation_constraint === 'needs_employer_sponsorship' &&
      route.sponsorship_required === false
    ) {
      // Skip routes that don't offer sponsorship if user needs it
      // (actually user needs sponsorship, so keep sponsored routes)
    }

    // ---- EDGE CASE: Timeline conflict ----
    const minProcessingMonths = route.processing_time_months.min;
    if (input.timeline_months < minProcessingMonths) {
      conflicts.push(
        `Timeline conflict: Your ${input.timeline_months}-month timeline is shorter than the minimum ` +
        `${minProcessingMonths}-month processing time for the "${route.name}" route. ` +
        `A realistic timeline is ${minProcessingMonths}–${route.processing_time_months.max} months for this route.`
      );
    }

    // ---- EDGE CASE: Salary shortfall ----
    const threshold = route.minimum_salary_threshold || 0;
    if (threshold > 0 && input.salary_expectation < threshold) {
      const shortfall = threshold - input.salary_expectation;
      isBelowThreshold = true;
      conflicts.push(
        `Salary shortfall: Your expected ${data.salary.currency_code} ${input.salary_expectation.toLocaleString()} ` +
        `is ${data.salary.currency_code} ${shortfall.toLocaleString()} below the minimum salary threshold ` +
        `(${data.salary.currency_code} ${threshold.toLocaleString()}) required for the "${route.name}" route.`
      );
      if (lowestThreshold === null || threshold < lowestThreshold) {
        lowestThreshold = threshold;
        lowestThresholdRoute = route.name;
      }
    } else {
      eligibleRoutes.push(route);
    }
  }

  // ---- Salary analysis (market comparison) ----
  const marketMedian = data.salary.median;
  const salaryShortfall = marketMedian > input.salary_expectation
    ? marketMedian - input.salary_expectation
    : null;

  // ---- Feasibility score (0-100, deterministic) ----
  let score = 100;
  if (conflicts.length > 0) score -= conflicts.length * 25;
  if (eligibleRoutes.length === 0) score -= 30;
  if (salaryShortfall && salaryShortfall > 10000) score -= 10;
  score = Math.max(0, score);

  const feasibilityLabel: 'feasible' | 'challenging' | 'not_feasible' =
    score >= 70 ? 'feasible' : score >= 40 ? 'challenging' : 'not_feasible';

  // ---- Data confidence summary ----
  const confidenceSummary = {
    overall: data.credentials.data_confidence === 'verified' ? 'estimated' : 'estimated',
    fields: {
      salary: data.salary.data_confidence,
      work_authorisation: data.work_authorisation_routes[0]?.data_confidence || 'estimated',
      credentials: data.credentials.data_confidence,
      timeline: data.timeline.data_confidence,
      market_demand: data.market_demand.data_confidence
    }
  };

  return {
    dataFound: true,
    dataKey,
    destinationData: data,
    conflicts,
    eligible_routes: eligibleRoutes,
    salary_analysis: {
      user_expectation: input.salary_expectation,
      market_median: marketMedian,
      currency_code: data.salary.currency_code,
      shortfall: salaryShortfall,
      is_below_threshold: isBelowThreshold,
      threshold_route: lowestThresholdRoute
    },
    feasibility_score: score,
    feasibility_label: feasibilityLabel,
    data_confidence_summary: confidenceSummary
  };
}
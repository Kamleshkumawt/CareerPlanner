import React from 'react';

interface Props {
  plan: any;
  onSave: () => void;
  onBack: () => void;
}

export default function PlanResult({ plan, onSave, onBack }: Props) {
  // Handle missing data case
  if (!plan.dataFound) {
    return (
      <div className="p-6 border-2 border-yellow-400 rounded-lg bg-yellow-50">
        <h3 className="text-lg font-bold text-yellow-900 mb-2">No Data Available</h3>
        <p className="text-yellow-800 mb-4">{plan.message}</p>
        <button onClick={onBack} className="px-4 py-2 text-gray-700 hover:bg-yellow-100 rounded font-medium transition-colors">← New Plan</button>
      </div>
    );
  }

  const result = plan.plan;
  const getBorderColor = (label: string) => {
    switch(label) {
      case 'feasible': return 'border-green-500';
      case 'challenging': return 'border-amber-500';
      case 'not_feasible': return 'border-red-500';
      default: return 'border-gray-300';
    }
  };
  
  const getTextColor = (label: string) => {
    switch(label) {
      case 'feasible': return 'text-green-600';
      case 'challenging': return 'text-amber-600';
      case 'not_feasible': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex gap-2">
        <button onClick={onBack} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors">← New Plan</button>
        <button onClick={onSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors">
          Save Plan
        </button>
      </div>

      {/* Feasibility badge */}
      <div className={`mb-6 p-4 border-2 ${getBorderColor(result.feasibility_label)} rounded-lg`}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-bold text-gray-900">Feasibility Assessment</span>
          <span className={`font-bold text-lg capitalize ${getTextColor(result.feasibility_label)}`}>
            {result.feasibility_label.replace('_', ' ')} ({result.feasibility_score}/100)
          </span>
        </div>
        <p className="text-gray-700">{result.narrative}</p>
      </div>

      {/* Conflicts — shown prominently if any */}
      {result.conflicts.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
          <h3 className="text-red-600 font-bold mb-3 mt-0">⚠ Conflicts Detected</h3>
          {result.conflicts.map((c: string, i: number) => (
            <p key={i} className="text-red-700 my-2">• {c}</p>
          ))}
        </div>
      )}

      {/* Salary analysis */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-bold text-gray-900 mt-0 mb-4">Salary Analysis</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Your expectation</div>
            <div className="font-bold text-gray-900">{result.salary_analysis.currency_code} {result.salary_analysis.user_expectation?.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Market median</div>
            <div className="font-bold text-gray-900">{result.salary_analysis.currency_code} {result.salary_analysis.market_median?.toLocaleString()}</div>
          </div>
        </div>
        {result.salary_analysis.is_below_threshold && (
          <p className="text-red-600 font-medium mt-3">
            Your salary is below the minimum threshold for {result.salary_analysis.threshold_route}.
          </p>
        )}
      </div>

      {/* Eligible visa routes */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Eligible Visa Routes ({result.eligible_routes.length})</h3>
        {result.eligible_routes.length === 0 && (
          <p className="text-red-600 font-medium">No eligible routes found given your salary and timeline.</p>
        )}
        {result.eligible_routes.map((route: any, i: number) => (
          <div key={i} className="p-4 border border-green-200 rounded-lg mb-3 bg-green-50">
            <strong className="text-gray-900 block">{route.name}</strong>
            <div className="text-sm text-gray-700 mt-1">
              Processing: {route.processing_time_months.min}–{route.processing_time_months.max} months &nbsp;|&nbsp;
              Sponsorship required: {route.sponsorship_required ? 'Yes' : 'No'}
            </div>
            <ul className="my-2 pl-5 space-y-1">
              {route.eligibility_criteria.map((c: string, j: number) => <li key={j} className="text-sm text-gray-700">• {c}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Action steps */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Action Plan</h3>
        {result.action_steps.map((step: string, i: number) => (
          <div key={i} className="flex gap-3 mb-2 p-3 border border-gray-200 rounded-md">
            <span className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full flex-shrink-0 font-bold text-sm">
              {i + 1}
            </span>
            <span className="text-gray-700 pt-0.5">{step}</span>
          </div>
        ))}
      </div>

      {/* Data confidence */}
      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <strong>Data confidence:</strong> {result.data_confidence_summary.overall} &nbsp;|&nbsp;
        {Object.entries(result.data_confidence_summary.fields || {}).map(([k, v]) => (
          <span key={k}>{k}: {v as string} &nbsp;</span>
        ))}
      </div>
    </div>
  );
}
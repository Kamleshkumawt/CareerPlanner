import React, { useState } from 'react';

interface Props {
  onSubmit: (data: any) => void;
  loading: boolean;
}

export default function PlanForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    origin: 'India',
    destination: 'Germany',
    target_role: 'Senior Backend Engineer',
    salary_expectation: '',
    timeline_months: '',
    work_authorisation_constraint: 'needs_employer_sponsorship'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const field = (label: string, key: string, type = 'text', options?: string[]) => (
    <div>
      <label className="block text-gray-700 font-medium mb-1.5">{label}</label>
      {options ? (
        <select
          value={(form as any)[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={(form as any)[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Your Career Relocation Plan</h2>
      {field('Origin Country', 'origin')}
      {field('Destination Country', 'destination', 'text', ['Germany', 'United Kingdom'])}
      {field('Target Role', 'target_role', 'text', ['Senior Backend Engineer', 'Product Manager'])}
      {field('Salary Expectation (in destination currency)', 'salary_expectation', 'number')}
      {field('Timeline (months)', 'timeline_months', 'number')}
      <div>
        <label className="block text-gray-700 font-medium mb-1.5">Work Authorisation Constraint</label>
        <select
          value={form.work_authorisation_constraint}
          onChange={e => setForm({ ...form, work_authorisation_constraint: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">No constraint</option>
          <option value="needs_employer_sponsorship">Needs employer sponsorship</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base transition-colors"
      >
        {loading ? 'Generating plan... (may take 10-15s for AI narrative)' : 'Generate Plan'}
      </button>
    </form>
  );
}
import mongoose, { Document, Schema } from 'mongoose';

const SalarySchema = new Schema({
  min: Number,
  median: Number,
  max: Number,
  currency_code: String,
  data_confidence: { type: String, enum: ['verified', 'estimated', 'placeholder'] }
}, { _id: false });

const RouteSchema = new Schema({
  name: String,
  type: String,
  sponsorship_required: Boolean,
  processing_time_months: { min: Number, max: Number },
  eligibility_criteria: [String],
  minimum_salary_threshold: Number,
  data_confidence: { type: String, enum: ['verified', 'estimated', 'placeholder'] }
}, { _id: false });

export interface IPlan extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  profile: {
    origin: string;
    destination: string;
    target_role: string;
    salary_expectation: number;
    timeline_months: number;
    work_authorisation_constraint: string;
  };
   plan: {
    feasibility_score: number;           
    feasibility_label: string;           
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
    narrative: string;                  
    action_steps: string[];             
    data_confidence_summary: {
      overall: string;
      fields: Record<string, string>;
    };
  };
  savedAt: Date;
}

const PlanSchema = new Schema<IPlan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  profile: {
    origin: String,
    destination: String,
    target_role: String,
    salary_expectation: Number,
    timeline_months: Number,
    work_authorisation_constraint: String
  },
  plan: {
    feasibility_score: Number,
    feasibility_label: String,
    conflicts: [String],
    eligible_routes: [RouteSchema],
    salary_analysis: {
      user_expectation: Number,
      market_median: Number,
      currency_code: String,
      shortfall: Number,
      is_below_threshold: Boolean,
      threshold_route: String
    },
    narrative: String,
    action_steps: [String],
    data_confidence_summary: {
      overall: String,
      fields: Schema.Types.Mixed
    }
  },
  savedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPlan>('Plan', PlanSchema);
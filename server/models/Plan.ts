import { Document, model, Schema, Types } from "mongoose";

export interface IPlan extends Document {
  userId: Types.ObjectId;
  origin: string;
  destination: string;
  role: string;
  salary: {
    min: number;
    median: number;
    max: number;
    currencyCode: string;
  };
  workAuthorization: [
    {
      name: string;
      type: string;
      sponsorshipRequired: boolean;
      processingTimeMonths: number;
      eligibilityCriteria: [string];
    }
  ];
  credentials: [
    {
      qualification: string;
      languageRequirements: string;
      degreeEquivalency: string;
    }
  ];
  timeline:{
    typicalHiringDuration: number;
    workAuthorizationProcessingWindow: number;
    totalEstimatedTimeToStart: number;
  };
  marketDemand: string;
  dataConfidence:{
    salary: 'verified' | 'estimated' | 'placeholder';
    workAuthorization: 'verified' | 'estimated' | 'placeholder';
    credentials: 'verified' | 'estimated' | 'placeholder';
    timeline: 'verified' | 'estimated' | 'placeholder';
    marketDemand: 'verified' | 'estimated' | 'placeholder';
  }
}

const planSchema = new Schema<IPlan>({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  origin: { type: String, required: true },   
  destination: { type: String, required: true }, 
  role: { type: String, required: true },      
  salary: {
    min: { type: Number, required: true },     
    median: { type: Number, required: true },  
    max: { type: Number, required: true },     
    currencyCode: { type: String, required: true } // Currency code (EUR, GBP)
  },
  workAuthorization: [
    {
      name: { type: String, required: true }, 
      type: { type: String, required: true },
      sponsorshipRequired: { type: Boolean, required: true },
      processingTimeMonths: { type: Number, required: true },
      eligibilityCriteria: [{ type: String }]
    }
  ],
  credentials: [
    {
      qualification: { type: String, required: true },
      languageRequirements: { type: String, required: true },
      degreeEquivalency: { type: String }
    }
  ],
  timeline: {
    typicalHiringDuration: { type: Number, required: true },
    workAuthorizationProcessingWindow: { type: Number, required: true },
    totalEstimatedTimeToStart: { type: Number, required: true }
  },
  marketDemand: { type: String, required: true },
  dataConfidence: {
    salary: { type: String, enum: ['verified', 'estimated', 'placeholder'], default: 'estimated' },
    workAuthorization: { type: String, enum: ['verified', 'estimated', 'placeholder'], default: 'estimated' },
    credentials: { type: String, enum: ['verified', 'estimated', 'placeholder'], default: 'estimated' },
    timeline: { type: String, enum: ['verified', 'estimated', 'placeholder'], default: 'estimated' },
    marketDemand: { type: String, enum: ['verified', 'estimated', 'placeholder'], default: 'estimated' }
  },
}, {
  timestamps: true,
});

planSchema.index({ userId: 1 });



const Plan = model<IPlan>("Plan", planSchema);

export default Plan;
import { Document, model, Schema } from "mongoose";

export interface IBlacklistedToken extends Document {
  token: string;
}

const BlacklistedTokenSchema = new Schema<IBlacklistedToken>({
  token: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,  
});


BlacklistedTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days in seconds

export const BlacklistedToken = model<IBlacklistedToken>("BlacklistedToken", BlacklistedTokenSchema);
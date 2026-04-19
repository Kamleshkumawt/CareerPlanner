import{ Document, Model, model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export interface IUser {
  username: string;
  email: string;
  password: string;
}

export interface IUserDocument extends IUser, Document {
  isValidPassword(password: string): Promise<boolean>;
  generateJWT(): string;
}

export interface IUserModel extends Model<IUserDocument> {
  hashPassword(password: string): Promise<string>;
}

const userSchema = new Schema<IUserDocument, IUserModel>({
    username:{
        type: String,
        required: true,
        trim: true,
        minLength: [3, "Username must be at least 3 characters long"],
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: [6, "Email must be at least 6 characters long"],
    },
    password: {
        type: String,
        select: false,
        required: true,
        trim: true,
        minLength: [6, "Password must be at least 6 characters long"],
    }
},{
    timestamps: true,
})

userSchema.statics.hashPassword = async function(password: string) {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
}

userSchema.methods.isValidPassword = async function(password: string) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateJWT = function() {
    return jwt.sign(
        { _id: this._id, email: this.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
    );
}

const User = model<IUserDocument, IUserModel>("User", userSchema);

export default User;
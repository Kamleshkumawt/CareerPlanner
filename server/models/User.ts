import{ Document, model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
}

const userSchema = new Schema<IUser>({
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


userSchema.index({ email: 1 });

userSchema.statics.hashPassword = async function(password: string) {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
}

userSchema.methods.isValidPassword = async function(this: IUser, password: string) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateJWT = function(this: IUser) {
    return jwt.sign(
        { _id: this._id, email: this.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
    );
}

const User = model<IUser>("User", userSchema);

export default User;
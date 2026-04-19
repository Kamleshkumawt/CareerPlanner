import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log("mongoDB connected successfully......");
    } catch (error) {
        console.log(error);
        console.error("Failed to connect to MongoDB", error);
        process.exit(1);
    }
};

export default connectDB;
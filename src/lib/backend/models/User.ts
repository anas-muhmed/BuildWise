// models/User.ts
import mongoose, { Model, Schema } from "mongoose";

// Step 1: Define TypeScript interface (what a User looks like in code)
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "student" | "admin" | "teacher" | "guest";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
// Step 2: Define Mongoose schema (what a User looks like in database)
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, //no duplicate emails allowed
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "admin", "teacher", "guest"], // Only these values allowed
      default: "student", // New users = student by default
    },
    isActive: {
      type: Boolean,
      default: true, // New users are active by default
    },
  },
  {
    timestamps: true, // Auto-adds createdAt & updatedAt fields)
  }
);
// Step 3: Export the model (check if already exists to avoid HMR errors)
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

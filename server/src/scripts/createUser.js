const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

// .env load karna server root se
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const createInitialUser = async () => {
  const args = process.argv.slice(2);
  const name = args[0] || "Admin";
  const email = args[1] || "admin@biztek.com";
  const rawPassword = args[2] || "admin@123";

  if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI does not exist in the .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const normalizedEmail = email.toLowerCase().trim();

    // Check karein agar user pehle se exist karta hai
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log(`User with email "${normalizedEmail}" already exists.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Password hash generate karein
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // User create karein
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    console.log("-----------------------------------------");
    console.log("User has been created successfully:");
    console.log(`Name:     ${newUser.name}`);
    console.log(`Email:    ${newUser.email}`);
    console.log(`Password: ${rawPassword}`);
    console.log("-----------------------------------------");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error in user creation:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createInitialUser();

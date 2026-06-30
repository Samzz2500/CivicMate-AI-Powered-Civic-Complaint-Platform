const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists:");
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const adminUser = new User({
      username: "admin",
      email: "admin@civicmate.com",
      password: hashedPassword,
      firstname: "Admin",
      lastname: "User",
      city: "Thane",
      state: "Maharashtra",
      pincode: "400601",
      role: "admin",
    });

    await adminUser.save();
    
    console.log("✅ Admin user created successfully!");
    console.log("   Username: admin");
    console.log("   Email: admin@civicmate.com");
    console.log("   Password: admin123");
    console.log("   Role: admin");
    console.log("\n🔐 Please login with these credentials to access Admin Dashboard");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
};

createAdminUser();

const db = require('./dbconnection/db');
const User = require('./models/users/user');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    await db.authenticate();
    console.log("Database connected.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: 'tomas.manazza@gmail.com' } });
    if (existingUser) {
      console.log("User already exists, updating role and password...");
      await existingUser.update({
        password: hashedPassword,
        role: 'admin'
      });
      console.log("User updated successfully:", existingUser.toJSON());
    } else {
      const newUser = await User.create({
        name: "Tomas Manazza",
        email: "tomas.manazza@gmail.com",
        password: hashedPassword,
        number: "1122334455", // Required by model
        role: "admin"
      });
      console.log("User created successfully:", newUser.toJSON());
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating/updating user:", error);
    process.exit(1);
  }
}

createAdmin();

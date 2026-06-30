const db = require('./dbconnection/db');
const User = require('./models/users/user');
const bcrypt = require('bcrypt');

async function createDesigner() {
  try {
    await db.authenticate();
    console.log("Database connected.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("526354Avila", salt);

    const newUser = await User.create({
      name: "RODRIGO AVILA",
      email: "rodrigoavila@gmail.com",
      password: hashedPassword,
      number: "1122334455", // Número inventado requerido
      role: "diseñador"
    });

    console.log("User created successfully:");
    console.log(newUser.toJSON());
    process.exit(0);
  } catch (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  }
}

createDesigner();

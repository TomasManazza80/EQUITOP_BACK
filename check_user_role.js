const { model } = require('./models/index');

async function checkUser() {
  try {
    const user = await model.user.findOne({
      where: { id: 7 }
    });
    
    if (user) {
      console.log(`USER FOUND:`);
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
    } else {
      console.log("User with ID 7 not found.");
    }
  } catch (error) {
    console.error("Error querying database:", error);
  } finally {
    process.exit(0);
  }
}

checkUser();

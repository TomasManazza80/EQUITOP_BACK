
const { updateUserRole } = require("./services/userServices");
const { model } = require("./models/index");

async function test() {
    try {
        const users = await model.user.findAll();
        if (users.length === 0) {
            console.log("No users found to test.");
            return;
        }
        const targetUser = users[0];
        console.log(`Testing with user: ${targetUser.email} [ID: ${targetUser.id}] [Current Role: ${targetUser.role}]`);
        
        const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
        console.log(`Attempting to change role to: ${newRole}`);
        
        const result = await updateUserRole(targetUser.id, newRole);
        console.log("Result:", result);
        
        const updatedUser = await model.user.findByPk(targetUser.id);
        console.log(`Updated Role in DB: ${updatedUser.role}`);
        
        if (updatedUser.role === newRole) {
            console.log("SUCCESS: Role updated correctly.");
        } else {
            console.log("FAILURE: Role did not change.");
        }
    } catch (error) {
        console.error("Test failed with error:", error);
    }
}

test();

import { writeFileSync } from 'fs';

// Fetch JSON array of users
const data = await fetch(`https://api.obamabot.me/v2/badges/getAllUsers?key=${process.env.SPECIAL_KEY}`).then(res => res.json());

// Loop through the users in the database
for (const user of data) {
    const filePath = "./User/" + user.userId + ".json";
    const userData = JSON.stringify(user);
    
    // Write every single user to the folder
    writeFileSync(filePath, userData);
}

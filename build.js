const core = require('@actions/core');
const { writeFileSync, existsSync, unlinkSync, readdirSync  } = require('fs');
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userId: String,
    badge: String,
    name: String,
})


async function read() {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = mongoose.model('User', userSchema)

    const users = await user.find({})

    await mongoose.disconnect()
    return users
}

async function compile() {
    const data = await read()
    const dir = './User/'
     // Loop through the files in the directory
     const fileNames = readdirSync(dir)
     fileNames.forEach((fileName) => {
         const userId = fileName.split('.')[0]
         const filePath = dir + fileName
 
         // Check if the user exists in the database
         const userExists = data.some((user) => user.userId === userId)
 
         if (!userExists) {
             // If the user doesn't exist, delete the file
             unlinkSync(filePath)
         }
     })
 
     // Loop through the users in the database
     for (const user of data) {
         const filePath = dir + user.userId + '.json'
 
         // Check if the file for the user exists
         if (!existsSync(filePath)) {
             // If the file doesn't exist, create it and write the user data to it
             const userData = JSON.stringify(user)
             writeFileSync(filePath, userData)
         }
     }
 

}

compile()
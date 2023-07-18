const core = require('@actions/core');
const { writeFileSync, existsSync, unlinkSync, readdirSync, readFileSync } = require('fs');



async function read() {
    const users = await fetch(`https://api.obamabot.me/v2/badges/getAllUsers?key=${process.env.SPECIAL_KEY}`).then(res => res.json())
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
        } else {
            // If the file already exists, read its contents and compare them to the user data from the database
            console.log(filePath)
            const fileData = readFileSync(filePath, 'utf8')
            const fileUser = JSON.parse(fileData);
            if (fileUser._id !== user._id || fileUser.badge !== user.badge || fileUser.name !== user.name) {
                // If the user data in the file doesn't match the user data from the database, overwrite the file
                const userData = JSON.stringify(user);
                writeFileSync(filePath, userData);
            }
        }
    }


}

compile()
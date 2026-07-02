import { writeFileSync } from "node:fs";
import { MongoClient } from "mongodb";

// biome-ignore lint/style/noNonNullAssertion: GitHub Actions
const mongo = new MongoClient(process.env.MONGODB_URI!);

await mongo.connect();

const db = mongo.db("GlobalBadges");
const usersCollection = db.collection("database");

const filteredUsers = usersCollection.aggregate([
	// Blocked Users
	{
		$match: { blocked: { $ne: true } },
	},
	// Remove internal _id elements
	{
		$project: {
			_id: 0,
			__v: 0,
			"badges._id": 0,
		},
	},
	// Pending Badges
	{
		$set: {
			badges: {
				$filter: {
					input: "$badges",
					as: "badge",
					cond: { $ne: ["$$badge.pending", true] },
				},
			},
		},
	},
]);

for await (const user of filteredUsers) {
	writeFileSync(`./User/${user.userId}.json`, JSON.stringify(user));
}

await mongo.close();

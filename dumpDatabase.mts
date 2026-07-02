import { mkdirSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { MongoClient } from "mongodb";

type Badge = { name: string; badge: string; pending: boolean };

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

const usersToDrop = [];
const singleFile: Record<string, Badge[]> = {};

// Actively remove users that are no longer in the database
rmSync("./User", { recursive: true, force: true });
mkdirSync("./User");

for await (const user of filteredUsers) {
	if (user.badges && user.badges.length > 0) {
		writeFileSync(`./User/${user.userId}.json`, JSON.stringify(user));
		singleFile[user.userId] = user.badges;
	} else {
		usersToDrop.push(user.userId);
	}
}

writeFileSync("./User/all.json", JSON.stringify(singleFile));

if (usersToDrop.length > 0) {
	await usersCollection.deleteMany({
		userId: { $in: usersToDrop },
	});
}

await mongo.close();

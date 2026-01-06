import { Client, Databases } from "node-appwrite";

export default async ({ req, res }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const userId = req.headers["x-appwrite-user-id"];
    if (!userId) {
      return res.json({ error: "Unauthenticated" }, 401);
    }

    const result = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.USERS_META_TABLE_ID,
      [`equal("userId","${userId}")`]
    );

    if (result.total > 0) {
      return res.json({ status: "exists" });
    }

    await databases.createDocument(
      process.env.DATABASE_ID,
      process.env.USERS_META_TABLE_ID,
      "unique()",
      {
        userId,
        role: "player",
        isBanned: false,
        currentQuestion: 0,
        score: 0,
        lastCorrectTime: null
      }
    );

    return res.json({ status: "created" });
  } catch (err) {
    return res.json({ error: err.message }, 500);
  }
};

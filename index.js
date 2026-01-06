import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  // 1. Parse the Event Payload
  // When triggered by users.create, the payload contains the user object
  let payload;
  try {
    // req.body can be a JSON string or object depending on runtime
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    // If parsing fails, it's not a valid event trigger
    return res.json({ error: "Invalid payload" }, 400);
  }

  // 2. Get the User ID from the payload (NOT headers)
  const userId = payload.$id;

  if (!userId) {
    error("No userId found in event payload.");
    return res.json({ error: "Missing User ID" }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Try fetching by documentId = userId
    await databases.getDocument(
      process.env.DATABASE_ID,
      process.env.USERS_META_TABLE_ID,
      userId
    );

    log(`User ${userId} already exists in DB.`);
    return res.json({ status: "exists" });

  } catch (err) {
    // If document not found (404), create it
    log(`Creating meta entry for user: ${userId}`);
    
    try {
      await databases.createDocument(
        process.env.DATABASE_ID,
        process.env.USERS_META_TABLE_ID,
        userId,
        {
          userId: userId, // Ensure this matches your attribute name exactly
          role: "player",
          isBanned: false,
          currentQuestion: 0,
          score: 0,
          lastCorrectTime: null
        }
      );
      return res.json({ status: "created" });
    } catch (createError) {
      error("Failed to create document: " + createError.message);
      return res.json({ error: createError.message }, 500);
    }
  }
};
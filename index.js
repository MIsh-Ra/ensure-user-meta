import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    const userId = req.headers["x-appwrite-user-id"];
    if(!userId){
      return res.json({ error:"Unauthenticated" },401);
    }

    const client=new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases=new Databases(client);

    try{
      // Try fetching by documentId = userId
      await databases.getDocument(
        process.env.DATABASE_ID,
        process.env.USERS_META_TABLE_ID,
        userId
      );

      return res.json({ status:"exists" });
    }catch{
      // If not found → create
      await databases.createDocument(
        process.env.DATABASE_ID,
        process.env.USERS_META_TABLE_ID,
        userId,
        {
          userId,
          role:"player",
          isBanned:false,
          currentQuestion:0,
          score:0,
          lastCorrectTime:null
        }
      );

      return res.json({ status:"created" });
    }
  }catch(e){
    error(e);
    return res.json({ error:e.message },500);
  }
};

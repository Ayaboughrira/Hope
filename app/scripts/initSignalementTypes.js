import { connectDB } from '../config/mongodb';

async function initTypes() {
  try {
    // Connect to MongoDB directly (not using Mongoose)
    const db = await connectDB();
    const collection = db.collection('typesignalements');
    
    const types = [
      { nom: 'disparition', createdAt: new Date() },
      { nom: 'maltraitance', createdAt: new Date() }
    ];
    
    // Use MongoDB native operations for upserting data
    for (const type of types) {
      await collection.updateOne(
        { nom: type.nom },
        { $set: type },
        { upsert: true }
      );
      console.log(`Type ${type.nom} initialized`);
    }
    
    console.log('All signalement types initialized successfully');
  } catch (error) {
    console.error('Error initializing signalement types:', error);
  } finally {
    process.exit(0);
  }
}

initTypes().catch(error => {
  console.error('Failed to initialize signalement types:', error);
  process.exit(1);
});
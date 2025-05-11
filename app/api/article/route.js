import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';

export async function POST(request) {
  try {
    // Parse the JSON request body
    const data = await request.json();
    
    // Check if all required fields are present
    if (!data.titre || !data.excerpt || !data.contenu || !data.typeArticle || !data.typeAnimal) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Connect to database
    const db = await connectDB();
    
    // Create new article object
    const newArticle = {
      titre: data.titre,
      excerpt: data.excerpt,
      contenu: data.contenu,
      typeArticle: data.typeArticle,
      typeAnimal: data.typeAnimal,
      dateCreation: new Date()
    };
    
    // Insert the article into the database
    const result = await db.collection('article').insertOne(newArticle);
    
    // Return success response with the created article
    return NextResponse.json({
      success: true,
      message: 'Article created successfully',
      article: {
        ...newArticle,
        id: result.insertedId.toString(),
        _id: result.insertedId.toString()
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
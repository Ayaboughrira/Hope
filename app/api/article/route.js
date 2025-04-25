import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';


export async function POST(request) {
  try {
    const articleData = await request.json();
    
    const db = await connectDB();
    
    const result = await db.collection('article').insertOne(articleData);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'Article ajouté avec succès'
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur dans l\'API articles:', error);
    return NextResponse.json({ 
      message: 'Erreur lors de l\'ajout de l\'article', 
      error: error.message 
    }, { status: 500 });
  }
}
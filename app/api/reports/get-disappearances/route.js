import { NextResponse } from 'next/server';
import { connectDB } from '../../../config/mongodb';

export async function GET(request) {
  let db;
  
  try {
    // Connect to database
    console.log('Connecting to MongoDB to fetch disappearance reports...');
    db = await connectDB();
    console.log('MongoDB connection established');
    
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 6;
    const skip = (page - 1) * limit;
    
    // Find all signalements of type 'disparition'
    const collection = db.collection('signalements');
    
    // Create query to filter by type 'disparition'
    const query = { type: 'disparition' };
    
    // Get count for pagination
    const totalDocuments = await collection.countDocuments(query);
    
    // Fetch documents with pagination
    const signalements = await collection
      .find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Format the data to match expectations of the frontend
    const formattedData = signalements.map(doc => ({
      id: doc._id.toString(),
      reportType: 'disparition', // Keep consistent with the form naming
      species: doc.species,
      breed: doc.breed,
      gender: doc.gender,
      disappearanceDate: doc.dateIncident,
      publishDate: doc.createdAt,
      photos: doc.media.photos,
      location: {
        wilaya: doc.location.wilaya,
        commune: doc.location.commune,
        neighborhood: doc.location.neighborhood
      },
      contact: doc.contact || '',
      description: doc.description || ''
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        total: totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching disappearance reports:', error);
    
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
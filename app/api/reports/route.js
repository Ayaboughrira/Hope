//api/reports/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '../../config/mongodb';
import cloudinary from '../../config/cloudinary';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  let db;
  
  try {
    // Connect to database with the improved connection function
    console.log('Connecting to MongoDB...');
    db = await connectDB();
    console.log('MongoDB connection established');
    
    // Authentication verification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('Session user:', session.user);
    
    const formData = await request.formData();
    
    // Process media uploads
    const photos = [];
    const photoFiles = formData.getAll('photos');
    
    try {
      for (const file of photoFiles) {
        if (file instanceof Blob) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const result = await uploadToCloudinary(buffer, 'image');
          photos.push(result.secure_url);
        }
      }
    } catch (uploadError) {
      console.error('Photo upload error:', uploadError);
      return NextResponse.json(
        { success: false, message: 'Error while uploading photos' },
        { status: 500 }
      );
    }
    
    let videoUrl = null;
    const videoFile = formData.get('video');
    if (videoFile instanceof Blob) {
      try {
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const result = await uploadToCloudinary(buffer, 'video');
        videoUrl = result.secure_url;
      } catch (videoUploadError) {
        console.error('Video upload error:', videoUploadError);
        return NextResponse.json(
          { success: false, message: 'Error while uploading video' },
          { status: 500 }
        );
      }
    }
    
    // Get report type - IMPORTANT FIX: Don't transform the type value
    const reportType = formData.get('reportType');
    console.log('Received report type:', reportType);
    
    // Ensure userType is valid based on signalementSchema's enum
    let userType = 'owner'; // Default value
    if (session.user && session.user.userType) {
      // Map the session userType to match the expected enum values
      switch(session.user.userType) {
        case 'owner':
        case 'vet':
        case 'association':
        case 'store':
          userType = session.user.userType;
          break;
        default:
          userType = 'owner'; // Fallback to default
      }
    }
    
    // Build the base signalement data object
    const signalementData = {
      type: reportType, // FIXED: Use the reportType directly without transformation
      createdBy: new ObjectId(session.user.id),
      userType: userType,
      location: {
        wilaya: formData.get('wilaya'),
        commune: formData.get('commune'),
        neighborhood: formData.get('neighborhood')
      },
      media: {
        photos,
        video: videoUrl
      },
      description: formData.get('description') || '',
      status: 'nouveau',
      createdAt: new Date()
    };
    
    // Add specific fields based on report type
    if (reportType === 'disparition') {
      signalementData.species = formData.get('species');
      signalementData.breed = formData.get('breed');
      signalementData.gender = formData.get('gender');
      signalementData.dateIncident = new Date(formData.get('disappearanceDate'));
      signalementData.contact = formData.get('ownerContact');
    } else {
      signalementData.dateIncident = new Date(formData.get('abuseDate'));
    }
    
    console.log('Creating signalement with data:', {
      type: signalementData.type,
      userType: signalementData.userType,
      species: signalementData.species,
      breed: signalementData.breed
    });
    
    // Use native MongoDB driver to insert into the "signalements" collection
    const collection = db.collection('signalements');
    const result = await collection.insertOne(signalementData);
    
    console.log('Signalement saved successfully with ID:', result.insertedId);
    
    // Fetch the inserted document to return it
    const savedSignalement = await collection.findOne({ _id: result.insertedId });
    
    return NextResponse.json(
      { success: true, data: savedSignalement },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creating signalement:', error);
    
    // More detailed error logging
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      console.error('MongoDB Error:', error.message);
    }
    
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

async function uploadToCloudinary(buffer, resourceType) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}
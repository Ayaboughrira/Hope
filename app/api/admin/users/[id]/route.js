// /app/api/admin/users/[id]/route.js
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../config/adminconfig-server';
import { connectDB } from '../../../../config/mongodb';

export async function DELETE(request, { params }) {
  try {
    // Admin verification
    const session = await requireAdmin();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID required', success: false },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID format', success: false },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    // Search in all your collections with better error handling
    const collections = [
      { name: 'user', type: 'owner' },
      { name: 'veterinaire', type: 'vet' },
      { name: 'association', type: 'association' },
      { name: 'animalrie', type: 'store' }
    ];
    
    let user = null;
    let collectionInfo = null;
    
    for (const collection of collections) {
      try {
        const foundUser = await db.collection(collection.name).findOne({ 
          _id: new ObjectId(id) 
        });
        
        if (foundUser) {
          user = foundUser;
          collectionInfo = collection;
          break;
        }
      } catch (err) {
        console.error(`Error searching in ${collection.name}:`, err);
        continue;
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in any collection', success: false },
        { status: 404 }
      );
    }
    
    // Prevent deletion of own account
    if (user.email && user.email.toLowerCase() === session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account', success: false },
        { status: 403 }
      );
    }
    
    // Additional check: prevent deletion of other admin accounts
   const { isAdmin } = require('../../../../config/adminconfig-server');
    if (user.email && isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Cannot delete another admin account', success: false },
        { status: 403 }
      );
    }
    
    // Delete from the correct collection with transaction-like behavior
    try {
      const deleteResult = await db.collection(collectionInfo.name).deleteOne({ 
        _id: new ObjectId(id) 
      });

      if (deleteResult.deletedCount === 0) {
        return NextResponse.json(
          { error: 'Failed to delete user - user may have been already deleted', success: false },
          { status: 500 }
        );
      }

      // Log the action for audit trail
      console.log(`[ADMIN ACTION] ${session.user.email} deleted user ${user.email} (${collectionInfo.type}) from ${collectionInfo.name} collection at ${new Date().toISOString()}`);
      
      // Get display name for response
      const userName = getUserDisplayName(user, collectionInfo.type);
      
      return NextResponse.json({
        success: true,
        message: `User "${userName}" has been successfully deleted`,
        userType: collectionInfo.type
      });
      
    } catch (deleteError) {
      console.error('Error during user deletion:', deleteError);
      return NextResponse.json(
        { error: 'Database error during deletion', success: false },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Delete user API error:', error);
    
    // Handle specific error types
    if (error.message === 'Access denied - Admin required') {
      return NextResponse.json(
        { error: 'Admin access required', success: false },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error during user deletion',
        success: false 
      },
      { status: 500 }
    );
  }
}

// Helper function to get display name based on user type
function getUserDisplayName(user, userType) {
  if (!user) return 'Unknown User';
  
  switch (userType) {
    case 'owner':
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || user.email || 'Pet Owner';
      
    case 'vet':
      return user.clinicName || user.email || 'Veterinarian';
      
    case 'association':
      return user.associationName || user.email || 'Association';
      
    case 'store':
      return user.storeName || user.email || 'Pet Store';
      
    default:
      return user.email || 'User';
  }
}
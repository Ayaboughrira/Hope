//admin/users/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../config/mongodb';
import { requireAdmin } from '../../../config/adminconfig-server';

export async function GET(request) {
  try {
    // Admin verification
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('userType') || 'all';
    const sortBy = searchParams.get('sortBy') || 'newest';
    
    const db = await connectDB();

    
    if (!db) {
    return NextResponse.json(
      { error: 'Database connection failed', success: false },
      { status: 500 }
    );
   }
    
    // Collection mapping to your actual MongoDB collections
    const collections = [
      { name: 'user', userType: 'owner' },
      { name: 'veterinaire', userType: 'vet' },
      { name: 'association', userType: 'association' },
      { name: 'animalrie', userType: 'store' }
    ];
    
    let allUsers = [];
    
    // Fetch users from all collections
    for (const collection of collections) {
      // Filter by type if specified
      if (userType !== 'all' && collection.userType !== userType) {
        continue;
      }
      
      let query = {};
      
      // Search filter adapted to each collection
      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        query.$or = [
          { email: searchRegex },
          // Type-specific search fields
          ...(collection.userType === 'owner' ? [
            { firstName: searchRegex },
            { lastName: searchRegex }
          ] : []),
          ...(collection.userType === 'vet' ? [
            { clinicName: searchRegex }
          ] : []),
          ...(collection.userType === 'association' ? [
            { associationName: searchRegex }
          ] : []),
          ...(collection.userType === 'store' ? [
            { storeName: searchRegex }
          ] : [])
        ];
      }
      
      try {
        // Fetch users with adapted projection
        const users = await db.collection(collection.name)
          .find(query)
          .project({
            email: 1,
            createdAt: 1,
            phone: 1,
            address: 1,
            // Project name fields based on type
            ...(collection.userType === 'owner' && { firstName: 1, lastName: 1 }),
            ...(collection.userType === 'vet' && { clinicName: 1, licenseNumber: 1, services: 1 }),
            ...(collection.userType === 'association' && { associationName: 1, description: 1 }),
            ...(collection.userType === 'store' && { storeName: 1, openingtime: 1, description: 1 })
          })
          .toArray();
        
        // Add userType and format display name
        const formattedUsers = users.map(user => ({
          ...user,
          userType: collection.userType,
          name: getUserDisplayName(user, collection.userType),
          collectionName: collection.name // For deletion
        }));
        
        allUsers = [...allUsers, ...formattedUsers];
      } catch (error) {
        console.error(`Error fetching from ${collection.name}:`, error);
        // Continue with other collections
      }
    }
    
    // Sort by date
    const sortOrder = sortBy === 'newest' ? -1 : 1;
    allUsers.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return sortOrder * (dateA - dateB);
    });
    
    // Pagination
    const limit = 20;
    const totalUsers = allUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);
    
    return NextResponse.json({
      users: paginatedUsers,
      totalPages,
      currentPage: page,
      totalUsers,
      success: true
    });
    
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Server error',
        success: false
      },
      { status: error.message === 'Access denied - Admin required' ? 403 : 500 }
    );
  }
}

// Helper function to get display name based on user type
function getUserDisplayName(user, userType) {
  switch (userType) {
    case 'owner':
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    case 'vet':
      return user.clinicName || user.email;
    case 'association':
      return user.associationName || user.email;
    case 'store':
      return user.storeName || user.email;
    default:
      return user.email;
  }
}
// /app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../config/mongodb';
import { requireAdmin } from '../../../config/adminconfig-server';
import { Owner, Vet, Association, Store } from '../../../models/user';

export async function GET() {
  try {
    // Vérification admin
    await requireAdmin();
    
    await connectDB();
    
    // Compter les utilisateurs par type
    const [owners, vets, associations, stores] = await Promise.all([
      Owner.countDocuments(),
      Vet.countDocuments(), 
      Association.countDocuments(),
      Store.countDocuments()
    ]);
    
    const totalUsers = owners + vets + associations + stores;
    
    // Statistiques additionnelles (optionnel)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [newOwnersToday, newVetsToday, newAssociationsToday, newStoresToday] = await Promise.all([
      Owner.countDocuments({ createdAt: { $gte: today } }),
      Vet.countDocuments({ createdAt: { $gte: today } }),
      Association.countDocuments({ createdAt: { $gte: today } }),
      Store.countDocuments({ createdAt: { $gte: today } })
    ]);
    
    const newUsersToday = newOwnersToday + newVetsToday + newAssociationsToday + newStoresToday;
    
    return NextResponse.json({
      totalUsers,
      owners,
      vets,
      associations,
      stores,
      newUsersToday,
      breakdown: {
        owners: Math.round((owners / totalUsers) * 100),
        vets: Math.round((vets / totalUsers) * 100),
        associations: Math.round((associations / totalUsers) * 100),
        stores: Math.round((stores / totalUsers) * 100)
      }
    });
    
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: error.message === 'Access denied - Admin required' ? 403 : 500 }
    );
  }
}
// services/authservices.js
import { connectDB } from '../config/mongodb';
import bcrypt from 'bcryptjs';


const SALT_ROUNDS = 12;



// Mappage des types utilisateur vers les collections
const COLLECTION_MAP = {
  owner: 'user',
  vet: 'veterinaire',
  association: 'association',
  store: 'animalrie'
};

export async function signup(userType, userData) {
  try {
    console.log('Tentative d\'inscription pour:', userType, userData.email);
   
    //Vérifie que le userType existe dans COLLECTION_MAP
    if (!COLLECTION_MAP[userType]) {
      return { success: false, error: 'Type d\'utilisateur invalide' };
    }
    
    const db = await connectDB();
    const collectionName = COLLECTION_MAP[userType];

    // Vérifie si l'email existe
    const existingUser = await db.collection(collectionName).findOne({ 
      email: userData.email 
    });
    if (existingUser) {
      return { success: false, error: 'Email déjà utilisé' };
    }

    // Hachage du mot de passe avec 12 iterations 
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Insertion du nv user dans la collection 
    const result = await db.collection(collectionName).insertOne({
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      userType: userType
    });

    console.log('Inscription réussie pour:', userData.email);
    
    return { 
      success: true, 
      userId: result.insertedId.toString(),
      userType: userType
    };

  } catch (error) {
    console.error('Erreur inscription:', error);
    return { 
      success: false, 
      error: error.message || 'Échec de l\'inscription' 
    };
  }
}

export async function login(email, password) {
  try {
    console.log('Tentative de connexion pour:', email);
    
    const db = await connectDB();

    // Cherche dans toutes les collections dans COLLECTION_MAP
    for (const [type, collection] of Object.entries(COLLECTION_MAP)) {
      const user = await db.collection(collection).findOne({ email });

      if (user) {
        // Compare les mots de passe hachés
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
          console.log('Connexion réussie pour:', email);
          // Ne renvoie PAS le mot de passe
          const { password: _, ...userData } = user;
          return { 
            success: true, 
            user: { ...userData, userType: type }
          };
        }
      }
    }

    console.log('Échec de connexion pour:', email);
    return { 
      success: false, 
      error: 'Email ou mot de passe incorrect' 
    };

  } catch (error) {
    console.error('Erreur connexion:', error);
    return { 
      success: false, 
      error: 'Erreur lors de la connexion' 
    };
  }
}


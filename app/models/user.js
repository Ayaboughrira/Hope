// models/User.js
import mongoose from 'mongoose';

// Schéma de base pour tous les utilisateurs
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Format d\'email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Ajouter des timestamps automatiques
  timestamps: true,
  // Activer les virtuals lors de la conversion en JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Schéma pour les propriétaires d'animaux
const ownerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  // Ici, on pourrait ajouter une relation avec les animaux de compagnie
  // pets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }]
});

// Schéma pour les vétérinaires
const vetSchema = new mongoose.Schema({
  clinicName: {
    type: String,
    required: [true, 'Le nom de la clinique est requis'],
    trim: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'Le numéro de licence est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Services offerts, spécialités, etc.
  services: [String],
  specialties: [String]
});

// Schéma pour les associations
const associationSchema = new mongoose.Schema({
  associationName: {
    type: String,
    required: [true, 'Le nom de l\'association est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Informations sur l'association, mission, objectifs, etc.
  missionStatement: String,
  foundedYear: Number
});

// Schéma pour les magasins/animaleries
const storeSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Le nom du magasin est requis'],
    trim: true
  },
  openingtime: {
    type: String,
    required: [true, 'Les horaires d\'ouverture sont requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Catégories de produits, promotions, etc.
  productCategories: [String]
});

// Créer les modèles en combinant le schéma de base avec les schémas spécifiques
const Owner = mongoose.models.Owner || mongoose.model('Owner', { ...userSchema.obj, ...ownerSchema.obj });
const Vet = mongoose.models.Vet || mongoose.model('Vet', { ...userSchema.obj, ...vetSchema.obj });
const Association = mongoose.models.Association || mongoose.model('Association', { ...userSchema.obj, ...associationSchema.obj });
const Store = mongoose.models.Store || mongoose.model('Store', { ...userSchema.obj, ...storeSchema.obj });

export { Owner, Vet, Association, Store };
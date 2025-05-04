// lib/auth.js
import jwt from 'jsonwebtoken';

// Clé secrète pour le JWT (JSON Web Token)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Veuillez définir la variable d\'environnement JWT_SECRET');
}

/**
 * Génère un token JWT à partir des données utilisateur
 * @param {Object} user - Les données utilisateur à inclure dans le token
 * @returns {string} Le token JWT généré
 */
export function generateToken(user) {
  // Créer le payload du token
  const payload = {
    userId: user._id,
    email: user.email,
    userType: user.userType || 'owner',
  };

  // Générer le token avec une durée de validité de 7 jours
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Vérifie la validité d'un token JWT
 * @param {string} token - Le token JWT à vérifier
 * @returns {Object|null} Les données du token si valide, null sinon
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return null;
  }
}
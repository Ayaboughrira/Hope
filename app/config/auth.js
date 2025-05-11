import jwt from 'jsonwebtoken';

// Secret pour la vérification des tokens JWT (doit correspondre à celui utilisé par NextAuth)
// Il est préférable de le récupérer depuis les variables d'environnement
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'votre_secret_de_fallback';

/**
 * Vérifie un token JWT et renvoie les données décodées
 * @param {string} token - Le token JWT à vérifier
 * @returns {object|null} - Les données décodées du token ou null en cas d'erreur
 */
export function verifyToken(token) {
  try {
    // Vérification basique du format du token avant de tenter la vérification
    if (!token || typeof token !== 'string') {
      console.error('Format de token invalide');
      return null;
    }
    
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return null;
  }
}

/**
 * Génère un token JWT pour un utilisateur
 * @param {object} payload - Les données à encoder dans le token
 * @param {string} expiresIn - Durée de validité du token (par défaut: '7d')
 * @returns {string} - Le token JWT généré
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
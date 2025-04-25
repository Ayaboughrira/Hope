import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;

// Fonction utilitaire pour supprimer un fichier de Cloudinary
export async function deleteCloudinaryFile(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return result;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier Cloudinary:', error);
      throw error;
    }
  }
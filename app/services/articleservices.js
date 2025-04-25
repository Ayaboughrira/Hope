// Next.js API Routes
export async function addArticleToMongoDB(articleData) {
    try {
      const response = await fetch('/api/article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de l\'article');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
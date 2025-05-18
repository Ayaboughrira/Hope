// /api/article/[animal]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../config/mongodb';

export async function GET(request, context) {
  try {
    // Extract the animal parameter from the URL
    const { animal } = context.params;
    
    // Get the type parameter from the query
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const authorId = searchParams.get('authorId'); // Parameter to filter by author
    
    console.log("API called with animal:", animal, "type:", type, "authorId:", authorId);
    
    // Connect to the database
    const db = await connectDB();
    
    // Build the filter with the correct field names
    const filter = { typeAnimal: animal };
    if (type && type !== 'all') filter.typeArticle = type;
    if (authorId) filter.auteurId = authorId; // Filter by author if specified
    
    // Retrieve filtered articles with a pipeline to include author information
    const pipeline = [
      { $match: filter },
      // Add a stage to add a field indicating if lookup should be with vet or association
      {
        $addFields: {
          lookupCollection: { $cond: { if: { $eq: ["$auteurType", "vet"] }, then: "veterinaire", else: "association" } }
        }
      },
      // Conditional lookup for veterinaire
      {
        $lookup: {
          from: "veterinaire",
          let: { auteurId: "$auteurId", auteurType: "$auteurType" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ["$_id", { $toObjectId: "$auteurId" }] },
                    { $eq: ["$auteurType", "vet"] }
                  ]
                } 
              }
            }
          ],
          as: "vetInfo"
        }
      },
      // Conditional lookup for association
      {
        $lookup: {
          from: "association",
          let: { auteurId: "$auteurId", auteurType: "$auteurType" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ["$_id", { $toObjectId: "$auteurId" }] },
                    { $eq: ["$auteurType", "association"] }
                  ]
                } 
              }
            }
          ],
          as: "associationInfo"
        }
      },
      // Unwind the arrays (one will be empty, the other will have at most one element)
      { 
        $addFields: {
          auteurInfo: { 
            $cond: { 
              if: { $eq: ["$auteurType", "vet"] }, 
              then: { $arrayElemAt: ["$vetInfo", 0] }, 
              else: { $arrayElemAt: ["$associationInfo", 0] } 
            }
          }
        }
      }
    ];
    
    const articles = await db.collection('article').aggregate(pipeline).toArray();
    console.log("Articles found:", articles.length);
    
    // Convert _id to string for JSON compatibility and include author info
    const formattedArticles = articles.map(article => {
      // Extract appropriate author info based on type
      let authorDetails = {};
      
      if (article.auteurType === 'vet' && article.auteurInfo) {
        authorDetails = {
          nomVeterinaire: article.auteurInfo.nom || null,
          prenomVeterinaire: article.auteurInfo.prenom || null,
          clinicName: article.auteurInfo.clinique || null
        };
      } else if (article.auteurType === 'association' && article.auteurInfo) {
        authorDetails = {
          nomAssociation: article.auteurInfo.nom || null
        };
      }
      
      return {
        ...article,
        id: article._id.toString(),
        // Include the extracted author details
        ...authorDetails,
        // Remove the raw author info to keep the response clean
        vetInfo: undefined,
        associationInfo: undefined,
        auteurInfo: undefined
      };
    });
    
    return NextResponse.json(formattedArticles);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
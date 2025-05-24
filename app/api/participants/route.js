// app/api/participants/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import { ObjectId } from 'mongodb';

// Import conditionnel de nodemailer avec gestion d'erreur
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.warn('Nodemailer n\'est pas installé. Les emails ne seront pas envoyés.');
}

// Configuration du transporteur email CORRIGÉE
const createEmailTransporter = () => {
  if (!nodemailer) {
    throw new Error('Nodemailer n\'est pas disponible');
  }
  
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true pour le port 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Options supplémentaires pour éviter les erreurs
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Fonction pour envoyer un email à l'association AVEC DEBUGGING
const sendNotificationEmail = async (participantData, associationEmail) => {
  if (!nodemailer) {
    console.log('Email simulation (nodemailer non installé):', {
      to: associationEmail,
      subject: `Nouvelle participation : ${participantData.campaignName}`,
      participant: `${participantData.firstName} ${participantData.lastName}`
    });
    return; // Simulation sans erreur
  }

  console.log('Début envoi email vers:', associationEmail);
  console.log('Configuration EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD défini:', !!process.env.EMAIL_PASSWORD);

  try {
    const transporter = createEmailTransporter();
    
    // Vérifier la configuration du transporteur
    console.log('Vérification de la configuration du transporteur...');
    await transporter.verify();
    console.log('Configuration transporteur OK');
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Nouvelle Participation à votre Campagne</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Détails de la Campagne</h3>
          <p><strong>Nom de la campagne :</strong> ${participantData.campaignName}</p>
          <p><strong>Association :</strong> ${participantData.associationName}</p>
        </div>
        
        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Informations du Participant</h3>
          <p><strong>Nom complet :</strong> ${participantData.firstName} ${participantData.lastName}</p>
          <p><strong>Email :</strong> ${participantData.email}</p>
          <p><strong>Téléphone :</strong> ${participantData.phone}</p>
          
          ${participantData.message ? `
            <div style="margin-top: 15px;">
              <strong>Message du participant :</strong>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 8px; border-left: 4px solid #2c5aa0;">
                ${participantData.message}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>Date de soumission :</strong> ${new Date(participantData.submittedAt).toLocaleString('fr-FR')}
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px; margin: 0;">
            Cet email a été généré automatiquement suite à une demande de participation à votre campagne.
            Veuillez contacter le participant directement pour la suite du processus.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Hope Platform" <${process.env.EMAIL_USER}>`,
      to: associationEmail,
      subject: `Nouvelle participation : ${participantData.campaignName}`,
      html: emailHtml,
      // Ajout d'options pour améliorer la délivrabilité
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    console.log('Envoi de l\'email avec les options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });
    
    return info;
    
  } catch (error) {
    console.error('Erreur détaillée lors de l\'envoi de l\'email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Log spécifique pour les erreurs d'authentification Gmail
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('ERREUR D\'AUTHENTIFICATION GMAIL:');
      console.error('- Vérifiez que l\'authentification à 2 facteurs est activée');
      console.error('- Vérifiez que vous utilisez un "Mot de passe d\'application" et non votre mot de passe Gmail');
      console.error('- Le mot de passe d\'application doit être généré depuis https://myaccount.google.com/apppasswords');
    }
    
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
  }
};

export async function POST(request) {
  try {
    const participantData = await request.json();
    
    // Validation des données requises
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'campaignId'];
    const missingFields = requiredFields.filter(field => !participantData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Champs manquants: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(participantData.email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    const db = await connectDB();
    
    // Vérifier que la campagne existe et récupérer les détails
    const campaign = await db.collection('campaigns').findOne({
      _id: new ObjectId(participantData.campaignId)
    });
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a déjà participé à cette campagne
    const existingParticipant = await db.collection('participants').findOne({
      campaignId: participantData.campaignId,
      email: participantData.email
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Vous avez déjà soumis une demande de participation pour cette campagne' },
        { status: 409 }
      );
    }

    // Préparer les données du participant
    const participantDocument = {
      campaignId: participantData.campaignId,
      campaignName: participantData.campaignName,
      associationName: participantData.associationName,
      firstName: participantData.firstName.trim(),
      lastName: participantData.lastName.trim(),
      email: participantData.email.toLowerCase().trim(),
      phone: participantData.phone.trim(),
      message: participantData.message ? participantData.message.trim() : '',
      userId: participantData.userId || null,
      status: 'pending', // pending, accepted, rejected
      submittedAt: new Date(),
    };

    // Insérer le participant dans la base de données
    const result = await db.collection('participants').insertOne(participantDocument);

    if (!result.insertedId) {
      throw new Error('Erreur lors de l\'insertion du participant');
    }

    // Récupérer l'email de l'association qui a publié cette campagne
    let associationEmail = null;
    let associationName = null;
    
    console.log('Recherche de l\'association pour la campagne:', {
      campaignId: campaign._id,
      campaignName: campaign.name,
      campaignEmail: campaign.email,
      associationId: campaign.associationId,
      userId: campaign.userId,
      createdBy: campaign.createdBy,
      association: campaign.association
    });
    
    // 1. Vérifier si l'email est directement dans la campagne
    if (campaign.email) {
      associationEmail = campaign.email;
      associationName = campaign.association || campaign.associationName || participantData.associationName;
      console.log('Email trouvé dans la campagne:', associationEmail);
    }
    
    // 2. Si pas d'email, chercher par associationId dans la collection association
    if (!associationEmail && campaign.associationId) {
      try {
        const association = await db.collection('association').findOne({
          _id: new ObjectId(campaign.associationId)
        });
        
        if (association && association.email) {
          associationEmail = association.email;
          associationName = association.name || association.associationName;
          console.log('Email trouvé via associationId:', associationEmail);
        }
      } catch (error) {
        console.warn('Erreur lors de la recherche par associationId:', error);
      }
    }
    
    // 3. Chercher par userId (si la campagne a été créée par un utilisateur association)
    if (!associationEmail && (campaign.userId || campaign.createdBy)) {
      try {
        const userId = campaign.userId || campaign.createdBy;
        const user = await db.collection('user').findOne({
          _id: new ObjectId(userId)
        });
        
        if (user && user.email && user.role === 'association') {
          associationEmail = user.email;
          associationName = user.associationName || user.name || campaign.association;
          console.log('Email trouvé via userId:', associationEmail);
        }
      } catch (error) {
        console.warn('Erreur lors de la recherche par userId:', error);
      }
    }
    
    // 4. Chercher dans la collection associations par nom
    if (!associationEmail && (campaign.association || participantData.associationName)) {
      const searchName = campaign.association || participantData.associationName;
      try {
        const association = await db.collection('association').findOne({
          $or: [
            { name: { $regex: new RegExp(searchName, 'i') } },
            { associationName: { $regex: new RegExp(searchName, 'i') } }
          ]
        });
        
        if (association && association.email) {
          associationEmail = association.email;
          associationName = association.name || association.associationName;
          console.log('Email trouvé via nom d\'association:', associationEmail);
        }
      } catch (error) {
        console.warn('Erreur lors de la recherche par nom:', error);
      }
    }
    
    // 5. Dernière tentative : chercher dans la collection users par nom d'association
    if (!associationEmail && (campaign.association || participantData.associationName)) {
      const searchName = campaign.association || participantData.associationName;
      try {
        const user = await db.collection('user').findOne({
          $and: [
            { role: 'association' },
            {
              $or: [
                { associationName: { $regex: new RegExp(searchName, 'i') } },
                { name: { $regex: new RegExp(searchName, 'i') } }
              ]
            }
          ]
        });
        
        if (user && user.email) {
          associationEmail = user.email;
          associationName = user.associationName || user.name;
          console.log('Email trouvé dans users par nom d\'association:', associationEmail);
        }
      } catch (error) {
        console.warn('Erreur lors de la recherche dans users:', error);
      }
    }

    // Variable pour tracker le succès de l'envoi d'email
    let emailSent = false;
    let emailError = null;

    // Envoyer l'email de notification à l'association qui a publié la campagne
    if (associationEmail) {
      try {
        console.log(`Tentative d'envoi d'email à l'association: ${associationName} (${associationEmail})`);
        await sendNotificationEmail(participantDocument, associationEmail);
        console.log(`Email de notification envoyé avec succès à l'association: ${associationName} (${associationEmail})`);
        emailSent = true;
      } catch (emailSendError) {
        console.error('Erreur lors de l\'envoi de l\'email à l\'association:', emailSendError);
        emailError = emailSendError.message;
        // Ne pas faire échouer la participation si l'email échoue
        // mais log l'erreur pour le suivi
      }
    } else {
      console.warn(`Aucun email trouvé pour l'association de la campagne: ${participantData.campaignName}`);
      console.warn('Association recherchée:', participantData.associationName);
      console.warn('Données de la campagne:', {
        campaignId: campaign._id,
        associationId: campaign.associationId,
        email: campaign.email
      });
    }

    // Mettre à jour le compteur de participants dans la campagne (optionnel)
    await db.collection('campaigns').updateOne(
      { _id: new ObjectId(participantData.campaignId) },
      { 
        $addToSet: { participantsIds: result.insertedId },
        $inc: { participantsCount: 1 }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Participation enregistrée avec succès',
      participantId: result.insertedId.toString(),
      emailSent: emailSent,
      emailError: emailError,
      associationEmail: associationEmail // Pour debug
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la participation:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// GET pour récupérer les participants d'une campagne (pour les administrateurs)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'ID de campagne requis' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    const participants = await db.collection('participants')
      .find({ campaignId: campaignId })
      .sort({ submittedAt: -1 })
      .toArray();

    // Formatter les données pour la réponse
    const formattedParticipants = participants.map(participant => ({
      id: participant._id.toString(),
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      phone: participant.phone,
      message: participant.message,
      status: participant.status,
      submittedAt: participant.submittedAt
    }));

    return NextResponse.json({
      participants: formattedParticipants,
      count: formattedParticipants.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des participants:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
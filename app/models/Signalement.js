import mongoose from 'mongoose';

const signalementSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['disparition', 'maltraitance']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Reference to User collection
  },
  userType: {
    type: String,
    required: true,
    enum: ['owner', 'vet', 'store', 'association'],
    default: 'owner'
  },
  // Common fields
  species: String,
  breed: String,
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  dateIncident: Date,
  location: {
    wilaya: {
      type: String,
      required: true
    },
    commune: {
      type: String,
      required: true
    },
    neighborhood: {
      type: String,
      required: true
    }
  },
  media: {
    photos: {
      type: [String], // Cloudinary URLs
      validate: {
        validator: function(photos) {
          return photos.length >= 2 && photos.length <= 3;
        },
        message: 'Between 2 and 3 photos are required'
      },
      required: true
    },
    video: String // Optional video URL
  },
  contact: String,
  description: String,
  status: {
    type: String,
    default: 'nouveau',
    enum: ['nouveau', 'en_cours', 'résolu', 'fermé']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate required fields based on signalement type
signalementSchema.pre('validate', function(next) {
  if (this.type === 'disparition') {
    if (!this.species) {
      this.invalidate('species', 'Species is required for missing animal reports');
    }
    if (!this.breed) {
      this.invalidate('breed', 'Breed is required for missing animal reports');
    }
    if (!this.dateIncident) {
      this.invalidate('dateIncident', 'Disappearance date is required');
    }
    if (!this.contact) {
      this.invalidate('contact', 'Contact information is required for missing animal reports');
    }
  } else if (this.type === 'maltraitance') {
    if (!this.dateIncident) {
      this.invalidate('dateIncident', 'Abuse date is required');
    }
  }
  next();
});

// Export the model
export default mongoose.models.Signalement || mongoose.model('Signalement', signalementSchema);
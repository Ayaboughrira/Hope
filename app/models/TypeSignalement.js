import mongoose from 'mongoose';

const typeSignalementSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    enum: ['disparition', 'maltraitance'],
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model
export default mongoose.models.TypeSignalement || mongoose.model('TypeSignalement', typeSignalementSchema);
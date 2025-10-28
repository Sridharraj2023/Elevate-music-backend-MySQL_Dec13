import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    path: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['Song', 'Wave'], // Only allow these two values
      required: true,
    },
  },
  { timestamps: true },
);

const File = mongoose.model('File', fileSchema);
export default File;

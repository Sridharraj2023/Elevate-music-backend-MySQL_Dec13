import mongoose from 'mongoose';

const categoryTypeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    types: [categoryTypeSchema], // Array of category types (subcategories)
  },
  {
    timestamps: true,
  },
);

const Category = mongoose.model('Category', categorySchema);

export default Category;

import Category from '../models/Category.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all categories with their types
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new category with optional types
// @route   POST /api/categories/create
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, types } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  const category = await Category.create({
    name,
    description,
    types: types || [], // Expecting types as an array of {name, description}
    user: req.user._id,
  });

  if (category) {
    res.status(201).json(category);
  } else {
    res.status(400);
    throw new Error('Invalid category data');
  }
});

// @desc    Update a category (including its types)
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, types } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  category.name = name || category.name;
  category.description = description || category.description;
  if (types !== undefined) category.types = types; // Replace types if provided

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted successfully' });
});

// @desc    Add a type to an existing category
// @route   POST /api/categories/:id/types
// @access  Private/Admin
const addCategoryType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (!name) {
    res.status(400);
    throw new Error('Type name is required');
  }

  // Check if type name already exists in this category
  if (category.types.some((type) => type.name === name)) {
    res.status(400);
    throw new Error('Type already exists in this category');
  }

  category.types.push({ name, description });
  const updatedCategory = await category.save();
  res.status(201).json(updatedCategory);
});

// @desc    Update a specific type in a category
// @route   PUT /api/categories/:id/types/:typeId
// @access  Private/Admin
const updateCategoryType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const type = category.types.id(req.params.typeId);
  if (!type) {
    res.status(404);
    throw new Error('Type not found');
  }

  type.name = name || type.name;
  type.description = description || type.description;

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

// @desc    Delete a specific type from a category
// @route   DELETE /api/categories/:id/types/:typeId
// @access  Private/Admin
const deleteCategoryType = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const type = category.types.id(req.params.typeId);
  if (!type) {
    res.status(404);
    throw new Error('Type not found');
  }

  category.types.pull(req.params.typeId);
  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

export {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addCategoryType,
  updateCategoryType,
  deleteCategoryType,
};

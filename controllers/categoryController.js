import Category from '../models/Category.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all categories with their types
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    // Ensure types is always an array for each category
    const processedCategories = categories.map(category => {
      const categoryData = category.toJSON();
      categoryData.types = Array.isArray(categoryData.types) ? categoryData.types : [];
      return categoryData;
    });
    res.json(processedCategories);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Helper function to get next available ID for types
const getNextTypeId = (existingTypes) => {
  if (!existingTypes || existingTypes.length === 0) return 1;
  const maxId = Math.max(...existingTypes.map(type => parseInt(type.id) || 0));
  return maxId + 1;
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

  const categoryExists = await Category.findOne({ where: { name } });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  // Add auto-increment IDs to types
  const typesWithIds = (types || []).map((type, index) => ({
    id: index + 1,
    name: type.name,
    description: type.description
  }));

  const category = await Category.create({
    name,
    description,
    types: typesWithIds,
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
  const category = await Category.findByPk(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  category.name = name || category.name;
  category.description = description || category.description;
  
  if (types !== undefined) {
    // Add auto-increment IDs to types that don't have them
    const typesWithIds = types.map((type, index) => ({
      id: type.id || (index + 1),
      name: type.name,
      description: type.description
    }));
    category.types = typesWithIds;
  }

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  await Category.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Category deleted successfully' });
});

// @desc    Add a type to an existing category
// @route   POST /api/categories/:id/types
// @access  Private/Admin
const addCategoryType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.findByPk(req.params.id);

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

  const nextId = getNextTypeId(category.types);
  category.types.push({ 
    id: nextId,
    name, 
    description 
  });
  const updatedCategory = await category.save();
  res.status(201).json(updatedCategory);
});

// @desc    Update a specific type in a category
// @route   PUT /api/categories/:id/types/:typeId
// @access  Private/Admin
const updateCategoryType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.findByPk(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const typeIndex = category.types.findIndex(type => type.id == req.params.typeId);
  if (typeIndex === -1) {
    res.status(404);
    throw new Error('Type not found');
  }

  category.types[typeIndex].name = name || category.types[typeIndex].name;
  category.types[typeIndex].description = description || category.types[typeIndex].description;

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

// @desc    Delete a specific type from a category
// @route   DELETE /api/categories/:id/types/:typeId
// @access  Private/Admin
const deleteCategoryType = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const typeIndex = category.types.findIndex(type => type.id == req.params.typeId);
  if (typeIndex === -1) {
    res.status(404);
    throw new Error('Type not found');
  }

  category.types.splice(typeIndex, 1);
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

import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addCategoryType,
  updateCategoryType,
  deleteCategoryType,
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', getCategories); // Public access
router.post('/create', protect, adminOnly, createCategory); // Admin only
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);
router.post('/:id/types', protect, adminOnly, addCategoryType);
router.put('/:id/types/:typeId', protect, adminOnly, updateCategoryType);
router.delete('/:id/types/:typeId', protect, adminOnly, deleteCategoryType);

export default router;

import express from 'express';
import {
  getMusic,
  createMusic,
  updateMusic,
  deleteMusic,
  getMusicByCategory,
  uploadFile,
  updateDatabaseUrls,
} from '../controllers/musicController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireSubscription } from '../middleware/subscriptionMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Admin routes (no subscription required)
router.get('/admin', protect, adminOnly, getMusic);
router.get('/admin/category/:categoryId', protect, adminOnly, getMusicByCategory);

// Public/User routes (requires authentication and active subscription)
router.get('/', protect, requireSubscription, getMusic);
router.get('/category/:categoryId', protect, requireSubscription, getMusicByCategory);
router.post(
  '/upload',
  protect,
  adminOnly,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }
      next();
    });
  },
  uploadFile,
); // Bulk file upload

// Update database URLs from local to production
router.post('/update-urls', protect, adminOnly, updateDatabaseUrls);

router.post(
  '/create',
  protect,
  adminOnly,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }
      next();
    });
  },
  createMusic,
);
router
  .route('/:id')
  .delete(protect, adminOnly, deleteMusic)
  .put(
    protect,
    adminOnly,
    (req, res, next) => {
      upload(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: 'File upload error', error: err.message });
        }
        next();
      });
    },
    updateMusic,
  );

export default router;

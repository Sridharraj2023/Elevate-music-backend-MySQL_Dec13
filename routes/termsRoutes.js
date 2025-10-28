import express from 'express';
import {
  getActiveTerms,
  getActiveDisclaimer,
  getAllTermsVersions,
  getAllDisclaimerVersions,
  getTermsById,
  createTerms,
  updateTerms,
  publishTerms,
  unpublishTerms,
  deleteTerms,
} from '../controllers/termsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public routes (for Flutter app and users)
router.get('/active', getActiveTerms);
router.get('/disclaimer/active', getActiveDisclaimer);

// Admin routes (for web admin panel)
router.get('/admin', protect, adminOnly, getAllTermsVersions);
router.get('/admin/disclaimer', protect, adminOnly, getAllDisclaimerVersions);
router.post('/admin', protect, adminOnly, createTerms);
router.get('/admin/:id', protect, adminOnly, getTermsById);
router.put('/admin/:id', protect, adminOnly, updateTerms);
router.put('/admin/:id/publish', protect, adminOnly, publishTerms);
router.put('/admin/:id/unpublish', protect, adminOnly, unpublishTerms);
router.delete('/admin/:id', protect, adminOnly, deleteTerms);

export default router;

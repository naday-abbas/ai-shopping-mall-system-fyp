import { Router } from 'express';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/products — list products; supports ?category= ?search= ?includeInactive=true
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

    const products = await Product.find(filter).sort({ clickCount: -1, createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:id/click — increment clickCount by 1
router.patch('/:id/click', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    res.json({ success: true, clickCount: product.clickCount });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id — soft delete (sets isActive: false)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (err) {
    next(err);
  }
});

export default router;

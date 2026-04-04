const express = require('express');
const router = express.Router();
const { explainContent, suggestImprovements, generateDocs, generateReadme } = require('../controllers/geminiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/explain', protect, explainContent);
router.post('/suggest', protect, suggestImprovements);
router.post('/docs', protect, generateDocs);
router.post('/readme', protect, generateReadme);

module.exports = router;

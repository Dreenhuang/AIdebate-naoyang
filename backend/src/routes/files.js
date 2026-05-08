const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

const debatesDir = path.join(process.cwd(), '..', '..', 'debates');

// List files
router.get('/list', async (req, res) => {
  try {
    // For demo, return mock files
    const files = [
      { name: 'debate-framework.md', size: 2048, content: '# Debate Framework\n\nThis is the debate framework...' },
      { name: 'consensus.md', size: 1024, content: '# Consensus\n\nConsensus reached...' },
      { name: 'prd.md', size: 4096, content: '# PRD Document\n\nProduct Requirements Document...' },
    ];
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download files
router.get('/download', async (req, res) => {
  try {
    const files = req.query.files?.split(',') || [];
    
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files specified' });
    }

    if (files.length === 1) {
      // Single file download
      const filePath = path.join(debatesDir, files[0]);
      res.download(filePath);
    } else {
      // Multiple files - create zip
      const archive = archiver('zip');
      res.attachment('debate-files.zip');
      archive.pipe(res);
      
      for (const file of files) {
        const filePath = path.join(debatesDir, file);
        archive.file(filePath, { name: file });
      }
      
      await archive.finalize();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

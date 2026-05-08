const express = require('express');
const router = express.Router();
const debateService = require('../services/debateService');

// Get debate state
router.get('/state', (req, res) => {
  res.json(debateService.getState());
});

// Get messages
router.get('/messages', (req, res) => {
  const state = debateService.getState();
  res.json(state.messages);
});

// Get commitments
router.get('/commitments', (req, res) => {
  const state = debateService.getState();
  res.json(state.commitments);
});

module.exports = router;

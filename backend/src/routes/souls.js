const express = require('express');
const router = express.Router();
const debateService = require('../services/debateService');

// Get all custom souls
router.get('/', async (req, res) => {
  try {
    const souls = await debateService.getAllSouls();
    res.json(souls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get souls by role type
router.get('/:roleType', async (req, res) => {
  try {
    const { roleType } = req.params;
    const souls = await debateService.getAllSouls();
    res.json(souls[roleType] || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add custom soul
router.post('/:roleType', async (req, res) => {
  try {
    const { roleType } = req.params;
    const soulConfig = req.body;
    
    if (!soulConfig.name || !soulConfig.soul) {
      return res.status(400).json({ error: 'Name and soul content are required' });
    }
    
    const newSoul = await debateService.addCustomSoul(roleType, soulConfig);
    res.status(201).json(newSoul);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update custom soul
router.put('/:roleType/:soulId', async (req, res) => {
  try {
    const { roleType, soulId } = req.params;
    const updates = req.body;
    
    const success = await debateService.updateCustomSoul(roleType, soulId, updates);
    if (!success) {
      return res.status(404).json({ error: 'Soul not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete custom soul
router.delete('/:roleType/:soulId', async (req, res) => {
  try {
    const { roleType, soulId } = req.params;
    
    const success = await debateService.removeCustomSoul(roleType, soulId);
    if (!success) {
      return res.status(404).json({ error: 'Soul not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

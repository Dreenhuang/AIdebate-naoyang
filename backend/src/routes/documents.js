/**
 * Document Upload & Analysis Routes
 * 文档上传与分析路由
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { analyzeDocument, recommendExperts, generateDebateConfig } = require('../services/documentAnalyzer');

const router = express.Router();

// 配置 multer 文件上传
const uploadDir = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.md', '.txt', '.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式，仅支持 .md .txt .pdf .docx'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// ===== API Routes =====

/**
 * POST /api/documents/upload
 * 上传并分析文档
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const { originalname, filename, size, mimetype } = req.file;
    
    // 读取文件内容（针对文本文件）
    const ext = path.extname(originalname).toLowerCase();
    let content = '';
    
    if (ext === '.md' || ext === '.txt') {
      const filePath = path.join(uploadDir, filename);
      content = await fs.readFile(filePath, 'utf-8');
    } else if (ext === '.pdf' || ext === '.docx') {
      // PDF 和 DOCX 需要额外处理，这里先返回基础信息
      content = `[${path.extname(originalname).toUpperCase()} 文件内容暂不支持提取]`;
    }
    
    // 分析文档
    const analysis = analyzeDocument(originalname, content);
    
    // 推荐专家角色
    const recommendedExperts = recommendExperts(analysis, content);
    
    // 生成辩论配置建议
    const debateConfig = generateDebateConfig(analysis, recommendedExperts);
    
    res.json({
      success: true,
      data: {
        fileName: originalname,
        fileSize: size,
        fileType: ext,
        analysis,
        recommendedExperts: recommendedExperts.map(e => ({
          id: e.id,
          name: e.name,
          matchScore: e.matchScore,
          focus: e.focus,
        })),
        debateConfig: {
          roles: debateConfig.roles.map(r => ({
            id: r.id,
            name: r.name,
            model: r.model,
            soul: r.soul,
            roleType: r.roleType,
          })),
        },
      },
    });
  } catch (error) {
    console.error('[Document] Upload error:', error);
    res.status(500).json({ error: '文档处理失败', details: error.message });
  }
});

/**
 * GET /api/documents/experts
 * 获取所有可用的 PRD 专家角色
 */
router.get('/experts', (req, res) => {
  const { PRD_EXPERT_ROLES } = require('../services/documentAnalyzer');
  
  res.json({
    success: true,
    data: PRD_EXPERT_ROLES.map(expert => ({
      id: expert.id,
      name: expert.name,
      model: expert.model,
      focus: expert.focus,
      perspective: expert.perspective,
      triggers: expert.triggers,
    })),
  });
});

/**
 * POST /api/documents/analyze
 * 单独分析文档（不上传文件，仅传入内容）
 */
router.post('/analyze', async (req, res) => {
  try {
    const { fileName, content } = req.body;
    
    if (!fileName && !content) {
      return res.status(400).json({ error: '请提供文件名或内容' });
    }
    
    const analysis = analyzeDocument(fileName, content);
    const recommendedExperts = recommendExperts(analysis, content);
    const debateConfig = generateDebateConfig(analysis, recommendedExperts);
    
    res.json({
      success: true,
      data: {
        analysis,
        recommendedExperts,
        debateConfig,
      },
    });
  } catch (error) {
    console.error('[Document] Analyze error:', error);
    res.status(500).json({ error: '文档分析失败', details: error.message });
  }
});

module.exports = router;

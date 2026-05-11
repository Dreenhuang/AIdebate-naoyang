const express = require('express');
const router = express.Router();
const exportService = require('../services/exportService');

router.post('/markdown', async (req, res) => {
  try {
    const debateData = req.body;
    const result = await exportService.exportToMarkdown(debateData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Markdown 导出成功',
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Markdown 导出失败',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[Export] Markdown error:', error);
    res.status(500).json({
      success: false,
      message: '导出过程中发生错误',
      error: error.message,
    });
  }
});

router.post('/pdf', async (req, res) => {
  try {
    const debateData = req.body;
    const result = await exportService.exportToPDF(debateData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'HTML 导出成功（可在浏览器中打印为 PDF）',
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: '导出失败',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[Export] PDF error:', error);
    res.status(500).json({
      success: false,
      message: '导出过程中发生错误',
      error: error.message,
    });
  }
});

router.post('/docx', async (req, res) => {
  try {
    const debateData = req.body;

    if (!debateData || Object.keys(debateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '请求体不能为空',
      });
    }

    const result = await exportService.exportToDocx(debateData);

    if (result.success && result.buffer) {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="debate.docx"'
      );
      return res.send(result.buffer);
    } else {
      return res.status(500).json({
        success: false,
        message: 'DOCX 导出失败',
        error: result.error || '未知错误',
      });
    }
  } catch (error) {
    console.error('[Export] DOCX error:', error);
    return res.status(500).json({
      success: false,
      message: '导出过程中发生错误',
      error: error.message,
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const list = await exportService.getExportList();
    res.json({ success: true, data: list });
  } catch (error) {
    console.error('[Export] List error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await exportService.deleteExport(filename);
    
    if (result.success) {
      res.json({ success: true, message: '文件已删除' });
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('[Export] Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

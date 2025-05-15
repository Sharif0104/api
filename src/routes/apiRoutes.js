const express = require("express");
const {getHealthStatus, getLivenessProbe, getReadinessProbe, getSystemStatus, getMetrics, getAppInfo, getVersion, checkDatabase, checkSecurity, checkCertificates, startMaintenance, stopMaintenance, clearCache, queueBackgroundTask, getJobStatus, getLogs, getAuditHistory, cacheImageMetadata, getCachedImageMetadata, cacheImageData, getCachedImageData } = require("../controllers/apiController");
const router = express.Router();

router.get('/', getHealthStatus);
router.get('/live', getLivenessProbe);
router.get('/ready', getReadinessProbe);
router.get('/status', getSystemStatus);
router.get('/metrics', getMetrics);
router.get('/info', getAppInfo);
router.get('/version', getVersion);
router.get('/database', checkDatabase);
router.get('/security', checkSecurity);
router.get('/certificates', checkCertificates);

router.post('/maintenance/start', startMaintenance);
router.post('/maintenance/stop', stopMaintenance);

// Add new routes for cache management, job queue, and audit logging
router.delete('/cache', clearCache);
router.post('/jobs', queueBackgroundTask);
router.get('/jobs/status/:id', getJobStatus);
router.get('/logs', getLogs);
router.get('/audit', getAuditHistory);

// Add routes for image caching
router.post('/cache/image/metadata', cacheImageMetadata);
router.get('/cache/image/metadata/:key', getCachedImageMetadata);
router.post('/cache/image/data', cacheImageData);
router.get('/cache/image/data/:key', getCachedImageData);

module.exports = router;
const router = require('express').Router();
const authentication = require('../../middlewares/authentication');
const notificationController = require('../../controllers/notification.controller');

router.use(authentication);
router.get('/', notificationController.listNotiByUser);

module.exports = router;
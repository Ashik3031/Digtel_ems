const express = require('express');
const { createUser, getUsers, subscribeUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.put('/subscribe', subscribeUser);

router.use(authorize('Super Admin', 'Admin'));

router.route('/')
    .get(getUsers)
    .post(createUser);

module.exports = router;

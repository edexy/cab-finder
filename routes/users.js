const express = require('express');
const router = express.Router();
const userModel = require('../models/user');
const { userValidator } = require('../middleware/validator')

/* POST register driver */
router.post('/register', userValidator, async(req, res, next) => {
    try {
        const { name, email, phone_number, license_number, car_number } = req.body;

        const user = await userModel.create({ name, email, phone_number, license_number, car_number });
        return res.status(201).json({
            status: true,
            message: 'User Created',
            user
        });
    } catch (error) {
        next({ message: error, status: 500 });
    }

});

router.post('/:_id/locations/', async(req, res, next) => {
    console.log(req.body)
    const { latitude, longitude } = req.body;
    let _id = req.params._id;

    if (!latitude || !longitude) {
        return res.status(400).json({
            status: "failure",
            reason: 'All fields are required'
        });
    }

    try {
        await userModel.updateOne({ _id }, { latitude, longitude });
        return res.status(201).json({
            data: null,
            status: true,
            message: 'Location updated',
        });
    } catch (error) {
        next({ message: error, status: 500 });
    }

});

module.exports = router;
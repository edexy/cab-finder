const userModel = require('../models/user');

exports.userValidator = async(req, res, next) => {
    const { name, email, phone_number, license_number, car_number } = req.body;

    //check for required fields
    if (!name || !email || !phone_number || !license_number || !car_number) {

        return res.status(422).json({
            data: null,
            statusCode: 422,
            status: false,
            message: 'All fields are required'
        });
    }

    // check if phone is valid
    let num = phone_number;
    if (num.toString().length != 10) {
        return res.status(422).json({
            data: null,
            statusCode: 422,
            status: false,
            message: 'Phone number must be 10 digits'
        });
    }
    // check if phone numbger contains digit only
    if (!/^\d+$/.test(phone_number)) {
        return res.status(422).json({
            data: null,
            statusCode: 422,
            status: false,
            message: 'Phone number must not be digits only'
        });
    }
    const checkEmail = await userModel.findOne({ email }).exec();
    if (checkEmail) {
        return res.status(409).json({
            data: null,
            statusCode: 409,
            status: false,
            message: `Email already exist`
        })
    }

    const checkPhone = await userModel.findOne({ phone_number }).exec();
    if (checkPhone) {
        return res.status(409).json({
            data: null,
            statusCode: 409,
            status: false,
            message: `Phone number already exist`
        })
    }

    const checkLicense = await userModel.findOne({ license_number }).exec();
    if (checkLicense) {
        return res.status(409).json({
            data: null,
            statusCode: 409,
            status: false,
            message: `License already exist`
        })
    }

    const checkCarNumber = await userModel.findOne({ car_number }).exec();
    if (checkCarNumber) {
        return res.status(409).json({
            data: null,
            statusCode: 409,
            status: false,
            message: `Car number already exist`
        })
    }
    next();
}
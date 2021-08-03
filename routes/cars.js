const express = require('express');
const router = express.Router();
const userModel = require('../models/user');

router.get('/', async(req, res, next) => {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
        return res.status(400).json({
            data: null,
            status: false,
            statusCode: 400,
            message: 'All fields are required'
        });
    }

    try {
        const cars = await userModel.find().exec();
        const available_cabs = await returnCabs(cars, { latitude, longitude });
        if (available_cabs.length > 0) {

            console.log(available_cabs)
            return res.status(200).json({
                message: "Available cars!",
                data: available_cabs,
                status: true,
                statusCode: 200,

            });
        } else {
            return res.status(200).json({
                data: null,
                status: true,
                statusCode: 200,
                message: "No cabs available!"
            })
        }
    } catch (error) {
        next({ message: error, status: 500 });
    }


});

const returnCabs = async(rows, postData) => {
    let available_cabs = [];

    for (const item of rows) {
        var lat1 = item.latitude;
        var lon1 = item.longitude;
        var lat2 = postData.latitude;
        var lon2 = postData.longitude;

        let d = await getDistanceFromLatLng(lat1, lon1, lat2, lon2);

        if (d <= 4) {
            let cab = {
                name: item.name,
                car_number: item.car_number,
                phone_number: item.phone_number
            }
            available_cabs.push(cab);
        }
        console.log('distance is: ' + d)
    }
    return available_cabs;



}

async function getDistanceFromLatLng(lat1, lng1, lat2, lng2) { // miles optional
    function deg2rad(deg) { return deg * (Math.PI / 180); }

    function square(x) { return Math.pow(x, 2); }
    var r = 6371; // radius of the earth in km
    lat1 = deg2rad(lat1);
    lat2 = deg2rad(lat2);
    var lat_dif = lat2 - lat1;
    var lng_dif = deg2rad(lng2 - lng1);
    var a = square(Math.sin(lat_dif / 2)) + Math.cos(lat1) * Math.cos(lat2) * square(Math.sin(lng_dif / 2));
    var d = 2 * r * Math.asin(Math.sqrt(a));
    return d; //return km
}

module.exports = router;
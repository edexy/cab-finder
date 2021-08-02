var express = require('express');
var router = express.Router();
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');

});

db.run('CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT,name text,email text,phone_number number,license_number text,car_number text,latitude double,longitude double)');

/* POST register driver */
router.post('/register', async(req, res, next) => {
    // console.log(req.body)
    const { name, email, phone_number, license_number, car_number } = req.body;

    //check for required fields
    if (!name || !email || !phone_number || !license_number || !car_number) {

        return res.status(400).json({
            status: "failure",
            reason: 'All fields are required'
        });
    }

    // check if pphone is valid
    let num = phone_number;
    if (num.toString().length != 10) {
        return res.status(400).json({
            status: "failure",
            reason: 'Phone number must be 10 digits'
        });
    }
    // check if phone numbger contains digit only
    if (!/^\d+$/.test(phone_number)) {
        return res.status(400).json({
            status: "failure",
            reason: 'Phone number must not be digits only'
        });
    }

    let sql = `SELECT * FROM users  WHERE email  = ?`;
    let sql1 = `SELECT * FROM users  WHERE phone_number  = ?`;
    let sql2 = `SELECT * FROM users  WHERE license_number  = ?`;
    let sql3 = `SELECT * FROM users  WHERE car_number  = ?`;

    const checkEmail = await checkUnique(sql, [email], 'Email', res);
    const checkPhone = await checkUnique(sql1, [phone_number], 'Phone number', res);
    const checkLicense = await checkUnique(sql2, [license_number], 'License number', res);
    const checkCarNumber = await checkUnique(sql3, [car_number], 'Car number', res);

    if (checkEmail && checkPhone && checkLicense && checkCarNumber) {
        let query = `INSERT INTO users(name,email,phone_number,license_number,car_number) VALUES(?,?,?,?,?)`;
        let columns = [name, email, phone_number, license_number, car_number];
        const insertId = await insertRow(query, columns, res)

        if (insertId) {
            let sqlGet = `SELECT id, name, email,phone_number,license_number,car_number FROM users WHERE email  = ?`
            db.all(sqlGet, [email], (err, row) => {
                if (err) {
                    return res.status(500).json({
                        status: "failure",
                        reason: err.message
                    });
                }
                if (row) {
                    return res.status(201)
                        .json(row);
                } else {

                    return res.status(500).json({
                        status: "failure",
                        reason: err
                    });
                }

            });
        }
    }



    // db.close((err) => {
    //     if (err) {
    //         return console.error(err.message);
    //     }
    //     console.log('Close the database connection.');
    // });

});

router.post('/:id/sendLocation/', async(req, res, next) => {
    const { latitude, longitude } = req.body;
    let user_id = req.params.id;
    console.log('user: ' + req.params.id)

    if (user_id == '$driverA_id') {
        user_id = 1;
    } else if (user_id == '$driverB_id') {
        user_id = 2;
    } else if (user_id == '$driverC_id') {
        user_id = 3;
    }

    console.log('user: ' + req.params.id)

    if (!latitude || !longitude) {
        return res.status(400).json({
            status: "failure",
            reason: 'All fields are required'
        });
    }
    const data = [latitude, longitude, user_id]
    let sql = `UPDATE users
            SET latitude = ?,
                longitude = ?
            WHERE id = ?`;

    await insertRow(sql, data, res);

    return res.status(202).json({ status: "success" })
});

router.post('/available_cabs', async(req, res, next) => {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
        return res.status(400).json({
            status: "failure",
            reason: 'All fields are required'
        });
    }

    let sqlGet = `SELECT id, name, email,phone_number,license_number,car_number,latitude,longitude  FROM users`
    db.all(sqlGet, async(err, rows) => {
        if (err) {
            return res.status(500).json({
                status: "failure",
                reason: err.message
            });
        }

        if (rows) {
            await returnCabs(rows, { latitude, longitude }, res)
        } else {

            return res.status(500).json({
                status: "failure",
                reason: err
            });
        }

    });


})

// set of rows read
const checkUnique = (query, params, fieldName, res) => {
    return new Promise(function(resolve, reject) {
        if (params == undefined) params = []

        db.all(query, params, function(err, rows) {
            if (err) {
                return res.status(500).json({
                    status: "failure",
                    reason: err.message
                });
            } //reject("Read error: " + err.message)
            if (rows.length > 0) {
                // console.log(rows)
                return res.status(400).json({
                    status: "failure",
                    reason: `${fieldName} already exist`
                })
            } else {
                resolve(rows)
            }
        })
    })
}

insertRow = (query, columns, res) => {
    return new Promise(function(resolve, reject) {
        db.run(query, columns,
            function(err) {
                if (err) {
                    console.log(err.message);
                    return res.status(400).json({
                        status: "failure",
                        reason: err.message
                    })
                } else resolve(true)
            })
    })
}

const returnCabs = async(rows, postData, res) => {
    let available_cabs = [];

    for (const item of rows) {
        var lat1 = item.latitude;
        var lon1 = item.longitude;
        var lat2 = postData.latitude;
        var lon2 = postData.longitude;

        let d = await getDistanceFromLatLng(lat1, lon1, lat2, lon2)

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

    if (available_cabs.length > 0) {

        console.log(available_cabs)
        return res.status(200).json({ available_cabs });
    } else {
        return res.status(200).json({
            message: "No cabs available!"
        })
    }

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
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb+srv://dikatrailovic_db_user:pfFXYaepqmxULuiq@m0.0tackd9.mongodb.net/meverik_staging?retryWrites=true&w=majority').then(async () => {
    await User.create({
        name: 'Admin',
        email: 'admin@meverik.at',
        password: 'Admin1234!',
        role: 'admin',
        tokenBalance: 999,
    });
    console.log('Admin created!');
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
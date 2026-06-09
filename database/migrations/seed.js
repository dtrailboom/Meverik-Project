require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Ticket = require('../src/models/Ticket');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding...');

  await User.deleteMany({});
  await Ticket.deleteMany({});

  const admin = await User.create({
    name: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@meverik.com',
    password: 'admin1234',
    role: 'admin',
    tokenBalance: 999,
  });

  const bella = await User.create({
    name: 'Bella Huber',
    email: 'bella@bakery.at',
    password: 'password123',
    businessName: "Bella's Bakery",
    websiteUrl: 'bellasbakery.at',
    plan: 'growth',
    planTokensPerMonth: 25,
    tokenBalance: 18,
    subscriptionStatus: 'active',
  });

  const nils = await User.create({
    name: 'Nils Karlsson',
    email: 'info@nordiccuts.at',
    password: 'password123',
    businessName: 'Nordic Cuts',
    plan: 'starter',
    planTokensPerMonth: 10,
    tokenBalance: 4,
    subscriptionStatus: 'active',
  });

  await Ticket.create([
    {
      client: bella._id,
      title: 'Add online order form',
      description: 'Add a simple order form to the homepage so customers can pre-order bread.',
      complexity: 'large',
      tokenCost: 8,
      status: 'new',
    },
    {
      client: bella._id,
      title: 'Update opening hours',
      description: 'Change Saturday hours to 8am–2pm.',
      complexity: 'small',
      tokenCost: 1,
      status: 'in_progress',
    },
    {
      client: nils._id,
      title: 'Update pricing section',
      description: 'New prices for all haircut packages.',
      complexity: 'medium',
      tokenCost: 3,
      status: 'new',
    },
  ]);

  console.log('Seed complete.');
  console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@meverik.com'} / admin1234`);
  console.log("Client: bella@bakery.at / password123");
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });

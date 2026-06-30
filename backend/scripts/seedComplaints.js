const mongoose = require('mongoose');
const User = require('../models/User');
const Tweet = require('../models/Tweet');
require('dotenv').config();

// Sample complaints data with existing images
const sampleComplaints = [
  {
    title: "Dangerous Pothole on Main Road",
    description: "Dangerous pothole on Thane Belapur Road near Kalwa Naka causing accidents. Urgent repair needed!",
    category: "potholes",
    location: "Thane Belapur Road, Kalwa",
    image: "1744693408023-pothole at Thane Belapur Road near kalwa naka.jpg",
    status: "submitted"
  },
  {
    title: "Street Lights Not Working",
    description: "Street lights not working in our area for past 2 weeks. Safety concern for residents.",
    category: "streetlight",
    location: "Ghodbunder Road, Thane West",
    image: "1743671652514-streeet light issue.jpg",
    status: "under-review"
  },
  {
    title: "Overflowing Garbage Bins",
    description: "Garbage bins overflowing for days. Creating unhygienic conditions and bad smell.",
    category: "garbage",
    location: "Majiwada, Thane",
    image: "1761499505037-bins overflow.jpg",
    status: "verified"
  },
  {
    title: "Water Pipe Burst",
    description: "Water pipe burst causing flooding on the road. Immediate attention required.",
    category: "water_leakage",
    location: "Vartak Nagar, Thane",
    image: "1744693207477-pipe fultla.jpg",
    status: "assigned"
  },
  {
    title: "Sewage Blockage Issue",
    description: "Sewage blockage in residential area. Water logging and foul smell affecting residents.",
    category: "drainage",
    location: "Wagle Estate, Thane",
    image: "1761499639683-Sewage cholkeup.jpeg",
    status: "in-progress"
  },
  {
    title: "Multiple Potholes on Road",
    description: "Multiple potholes on main road causing vehicle damage. Needs urgent repair.",
    category: "potholes",
    location: "Pokhran Road, Thane",
    image: "1761499689134-Pothole.jpg",
    status: "submitted"
  },
  {
    title: "Damaged Street Light Pole",
    description: "Street light pole damaged and hanging dangerously. Risk of electrocution.",
    category: "streetlight",
    location: "Kolshet Road, Thane",
    image: "1771533057635-0_Faulty-streetlights.webp",
    status: "under-review"
  },
  {
    title: "Garbage Dumped on Roadside",
    description: "Garbage dumped on roadside for weeks. No collection by municipal workers.",
    category: "garbage",
    location: "Manpada, Thane",
    image: "1771533849781-Garbage_by_a_road,_Talisay,_Cebu.jpg",
    status: "verified"
  },
  {
    title: "Pothole Near School",
    description: "Large pothole near school causing safety issues for children and parents.",
    category: "potholes",
    location: "Hiranandani Estate, Thane",
    image: "1759265519296-pothole.webp",
    status: "assigned"
  },
  {
    title: "Water Pipeline Leakage",
    description: "Water pipeline leakage wasting water and damaging road structure.",
    category: "water_leakage",
    location: "Brahmand, Thane",
    image: "1761499567826-pipedamage.jpg",
    status: "in-progress"
  },
  {
    title: "Street Lights Off in Locality",
    description: "Street lights off in entire locality. Residents facing security issues at night.",
    category: "streetlight",
    location: "Teen Hath Naka, Thane",
    image: "1744692812075-Street light off.jpg",
    status: "resolved"
  },
  {
    title: "Litter in Park",
    description: "Litter scattered all over the park. Need immediate cleaning and dustbins.",
    category: "garbage",
    location: "Louis Wadi, Thane",
    image: "1761499465704-Litter2.jpg",
    status: "submitted"
  },
  {
    title: "Deep Pothole with Water",
    description: "Deep pothole filled with water creating mosquito breeding ground.",
    category: "potholes",
    location: "Kalwa, Thane",
    image: "1761499769473-pothole.webp",
    status: "under-review"
  },
  {
    title: "Sewage Overflow on Road",
    description: "Sewage overflow on main road. Unbearable smell and health hazard.",
    category: "drainage",
    location: "Mumbra, Thane",
    image: "1761499597202-sewage 2.jpeg",
    status: "verified"
  },
  {
    title: "Multiple Potholes Causing Traffic",
    description: "Multiple potholes on residential road causing traffic jams and accidents.",
    category: "potholes",
    location: "Kasarvadavli, Thane",
    image: "1771534223630-43960-Repairing-Potholes-1.webp",
    status: "assigned"
  },
  {
    title: "Street Light Near Bus Stop",
    description: "Street light not working near bus stop. Safety concern for commuters.",
    category: "streetlight",
    location: "Naupada, Thane",
    image: "1761499832340-streetlig.jpg",
    status: "in-progress"
  },
  {
    title: "No Garbage Collection",
    description: "Garbage collection not done for 10 days. Bins overflowing on streets.",
    category: "garbage",
    location: "Charai, Thane",
    image: "1744692969303-garbage bins.jpg",
    status: "resolved"
  },
  {
    title: "Road Full of Potholes",
    description: "Road full of potholes after monsoon. Urgent repair needed before more damage.",
    category: "potholes",
    location: "Kopri, Thane",
    image: "1771534911789-500x300_426556-kochin-roads.jpg",
    status: "completed"
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urbanml');
    console.log('✅ Connected to MongoDB');

    // Find or create a demo user
    let demoUser = await User.findOne({ username: 'demo_citizen' });
    
    if (!demoUser) {
      demoUser = new User({
        username: 'demo_citizen',
        email: 'demo@civicmate.com',
        password: '$2a$10$YourHashedPasswordHere', // This won't be used for login
        firstname: 'Demo',
        lastname: 'Citizen',
        mobile: '9876543210',
        city: 'Thane',
        state: 'Maharashtra',
        pincode: '400601',
        role: 'user'
      });
      await demoUser.save();
      console.log('✅ Created demo user');
    }

    // Clear existing tweets (optional - comment out if you want to keep existing)
    // await Tweet.deleteMany({});
    // console.log('🗑️  Cleared existing complaints');

    // Create sample complaints
    const complaints = [];
    for (const complaint of sampleComplaints) {
      const tweet = new Tweet({
        user: demoUser._id,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        location: complaint.location,
        image: complaint.image,
        completed: complaint.status,
        comments: []
      });

      complaints.push(tweet);
    }

    await Tweet.insertMany(complaints);
    console.log(`✅ Created ${complaints.length} sample complaints`);

    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Total complaints: ${complaints.length}`);
    console.log('👤 Demo user: demo_citizen');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();

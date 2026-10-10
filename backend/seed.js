import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({
    name: String, price: Number, isActive: Boolean, clickCount: Number, storeLocation: String, imageUrl: String,
    targetDemographics: [{ age: String, gender: String }]
  }));
  
  console.log("Connecting to database...");
  await Product.insertMany([
    { name: "Premium Leather Watch", price: 4500, isActive: true, clickCount: 0, storeLocation: "Floor 1 - Hub", imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80", targetDemographics: [{age: "Adult", gender: "Male"}, {age: "Young", gender: "Male"}] },
    { name: "Summer Floral Dress", price: 3200, isActive: true, clickCount: 0, storeLocation: "Floor 2 - Khaadi", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80", targetDemographics: [{age: "Adult", gender: "Female"}, {age: "Young", gender: "Female"}] },
    { name: "Kids Smart Toy Robot", price: 8500, isActive: true, clickCount: 0, storeLocation: "Floor 3 - Bachaa Party", imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&q=80", targetDemographics: [{age: "Kid", gender: "All"}] },
    { name: "Wireless Gaming Headset", price: 6000, isActive: true, clickCount: 0, storeLocation: "Floor 1 - TechZone", imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80", targetDemographics: [{age: "Young", gender: "Male"}, {age: "Teen", gender: "Male"}] }
  ]);
  
  console.log("Products injected successfully!");
  process.exit();
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
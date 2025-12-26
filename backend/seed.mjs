import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import connectDB from './config/mongodb.js'
import productModel from './models/productModel.js'
import userModel from './models/userModel.js'
import bcrypt from 'bcrypt'

const run = async () => {
  try {
    await connectDB()
    // Create admin user (if not exists)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@clickshop.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123'
    const existingAdmin = await userModel.findOne({ email: adminEmail })
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10)
      const hashed = await bcrypt.hash(adminPassword, salt)
      const adminUser = new userModel({ name: 'Admin', email: adminEmail, password: hashed })
      await adminUser.save()
      console.log('✅ Admin user created:', adminEmail)
    } else {
      console.log('ℹ️ Admin user already exists:', adminEmail)
    }

    // Create sample product
    const sampleProduct = {
      name: 'Sample Product',
      description: 'Seeded sample product',
      price: 49,
      category: 'Sample',
      subCategory: 'Seed',
      sizes: ['S', 'M', 'L'],
      bestSeller: false,
      image: [],
      date: Date.now(),
    }

    const existing = await productModel.findOne({ name: sampleProduct.name })
    if (!existing) {
      const p = new productModel(sampleProduct)
      await p.save()
      console.log('✅ Sample product created')
    } else {
      console.log('ℹ️ Sample product already exists')
    }

    console.log('Seeding completed')
    process.exit(0)
  } catch (error) {
    console.error('Seed failed', error)
    process.exit(1)
  }
}

run()

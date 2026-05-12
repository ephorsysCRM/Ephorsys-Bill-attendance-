const mongoose = require('mongoose');
require('dotenv').config();

async function fixDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    // Drop quotationNumber_1 index from quotations and invoiceNumber_1 from invoices
    const db = mongoose.connection.db;
    
    try {
      await db.collection('quotations').dropIndex('quotationNumber_1');
      console.log('Dropped quotationNumber_1 index');
    } catch (e) {
      console.log('quotationNumber_1 index might not exist or already dropped:', e.message);
    }
    
    try {
      await db.collection('invoices').dropIndex('invoiceNumber_1');
      console.log('Dropped invoiceNumber_1 index');
    } catch (e) {
      console.log('invoiceNumber_1 index might not exist or already dropped:', e.message);
    }

    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

fixDb();

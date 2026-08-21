import { connectDB } from './lib/mongodb';
import { Invoice } from './lib/models';
async function test() {
  await connectDB();
  const invoices = await Invoice.find().select('invoiceNumber').lean();
  console.log('All Invoices: ', invoices);
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthStr = String(currentMonth).padStart(2, '0');
  const yearStr = currentYear.toString();
  
  console.log(`Regex testing: /${monthStr}/${yearStr}$`);

  const currentMonthInvoices = await Invoice.find({
    invoiceNumber: new RegExp(`/${monthStr}/${yearStr}$`)
  }).select('invoiceNumber').lean();
  console.log('Current Month Invoices: ', currentMonthInvoices);

  process.exit(0);
}
test();

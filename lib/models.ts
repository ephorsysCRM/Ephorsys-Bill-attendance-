import mongoose, { Schema, Document, Model } from 'mongoose';

// User Interface and Schema
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    company: String,
    phone: String,
    address: String,
  },
  { timestamps: true }
);

// Client Interface and Schema
export interface IClient extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: String,
    address: String,
    city: String,
    country: String,
    taxNumber: String,
  },
  { timestamps: true }
);

// Quotation Interface and Schema
export interface IQuotation extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  quotationNumber: string;
  date: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    sacCode?: string;
  }>;
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  tax: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    quotationNumber: { type: String, required: true },
    date: { type: Date, default: Date.now },
    dueDate: Date,
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        taxRate: Number,
        sacCode: String,
      },
    ],
    notes: String,
    status: { type: String, enum: ['draft', 'sent', 'accepted', 'declined'], default: 'draft' },
    subtotal: Number,
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    tax: Number,
    total: Number,
  },
  { timestamps: true }
);

// Invoice Interface and Schema
export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    sacCode?: string;
  }>;
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  tax: number;
  total: number;
  paidAmount?: number;
  deposits?: Array<{
    amount: number;
    date: Date;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    invoiceNumber: { type: String, required: true },
    date: { type: Date, default: Date.now },
    dueDate: Date,
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        taxRate: Number,
        sacCode: String,
      },
    ],
    notes: String,
    status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
    subtotal: Number,
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    tax: Number,
    total: Number,
    paidAmount: { type: Number, default: 0 },
    deposits: [
      {
        amount: Number,
        date: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

// Settings Interface and Schema
export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  companyLogo?: string;
  taxRate: number;
  currency: string;
  language: string;
  theme: 'dark' | 'light';
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyLogo: String,
    taxRate: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  },
  { timestamps: true }
);

// Employee Interface and Schema
export interface IEmployee extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  empId: string;
  designation: string;
  empType: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    empId: { type: String, required: true },
    designation: { type: String, required: true },
    empType: { type: String, required: true },
  },
  { timestamps: true }
);

// Attendance Interface and Schema
export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  status: 'full-day' | 'half-day' | 'absent' | 'leave' | 'wfh';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['full-day', 'half-day', 'absent', 'leave', 'wfh'], required: true },
    notes: String,
  },
  { timestamps: true }
);

// Clear mongoose models on hot-reload to prevent schema caching issues
mongoose.models = {};

// Export models
export const User: Model<IUser> = mongoose.model('User', UserSchema);
export const Client: Model<IClient> = mongoose.model('Client', ClientSchema);
export const Quotation: Model<IQuotation> = mongoose.model('Quotation', QuotationSchema);
export const Invoice: Model<IInvoice> = mongoose.model('Invoice', InvoiceSchema);
export const Settings: Model<ISettings> = mongoose.model('Settings', SettingsSchema);
export const Employee: Model<IEmployee> = mongoose.model('Employee', EmployeeSchema);
export const Attendance: Model<IAttendance> = mongoose.model('Attendance', AttendanceSchema);

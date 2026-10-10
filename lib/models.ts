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
  email?: string;
  password?: string;
  role: 'admin' | 'hr' | 'employee';
  status: 'active' | 'terminated';
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
    email: { type: String, lowercase: true, trim: true, sparse: true, index: true },
    password: { type: String },
    role: { type: String, enum: ['admin', 'hr', 'employee'], default: 'employee' },
    status: { type: String, enum: ['active', 'terminated'], default: 'active' },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models.Employee) {
  delete (mongoose.models as any).Employee;
}

// Attendance Interface and Schema
export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  status: 'full-day' | 'half-day' | 'absent' | 'leave' | 'wfh' | 'holiday';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['full-day', 'half-day', 'absent', 'leave', 'wfh', 'holiday'], required: true },
    notes: String,
  },
  { timestamps: true }
);

// Export models
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Client: Model<IClient> = mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
export const Quotation: Model<IQuotation> = mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema);
export const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
export const Employee: Model<IEmployee> = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
if (process.env.NODE_ENV !== 'production' && mongoose.models.Attendance) {
  delete (mongoose.models as any).Attendance;
}
export const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

// Password Reset Interface and Schema
export interface IPasswordReset extends Document {
  email: string;
  otpHash?: string;
  salt?: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  lastRequestedAt: Date;
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    otpHash: { type: String },
    salt: { type: String },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    lastRequestedAt: { type: Date, default: Date.now },
    resetTokenHash: String,
    resetTokenExpiresAt: Date,
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models.PasswordReset) {
  delete (mongoose.models as any).PasswordReset;
}

export const PasswordReset: Model<IPasswordReset> =
  mongoose.models.PasswordReset || mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);



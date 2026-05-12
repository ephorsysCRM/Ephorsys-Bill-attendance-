// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { FileText, BarChart3, Users, Zap } from 'lucide-react';

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-background">
//       {/* Navigation */}
//       <nav className="flex items-center justify-between p-6 md:p-8 max-w-7xl mx-auto">
//         <div className="flex items-center gap-3">
//           <img src="https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png" alt="Ephorsys Logo" className="w-8 h-8" />
//           <div className="text-2xl font-bold gradient-text">Ephorsys</div>
//         </div>
//         <div className="flex items-center gap-4">
//           <Link href="/login">
//             <Button className='cursor-pointer'>Sign In</Button>
//           </Link>
//         </div>
//       </nav>

//       {/* Hero */}
//       <section className="px-6 md:px-8 py-20 max-w-7xl mx-auto">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
//           <div>
//             <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
//               Professional Billing Made Simple
//             </h1>
//             <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
//               Create invoices and quotations in minutes. Manage your clients, track payments, and generate beautiful PDFs with Ephorsys.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4">
//               <Link href="/login">
//                 <Button size="lg" className="w-full sm:w-auto cursor-pointer">
//                   Sign In
//                 </Button>
//               </Link>
//             </div>
//           </div>
//           <div className="glass-card p-8 hidden md:block">
//             <div className="space-y-4">
//               <div className="h-3 bg-primary/30 rounded-full w-3/4"></div>
//               <div className="h-3 bg-primary/20 rounded-full w-1/2"></div>
//               <div className="mt-6 space-y-2">
//                 {[1, 2, 3].map((i) => (
//                   <div key={i} className="flex gap-3">
//                     <div className="w-3 h-3 rounded-full bg-accent/40"></div>
//                     <div className="h-2 bg-primary/20 rounded-full flex-1"></div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features */}
//       <section className="px-6 md:px-8 py-20 max-w-7xl mx-auto">
//         <h2 className="text-4xl font-bold text-foreground mb-12 text-center">Powerful Features</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {[
//             {
//               icon: FileText,
//               title: 'Invoices & Quotations',
//               description: 'Create professional invoices and quotations with customizable templates',
//             },
//             {
//               icon: Users,
//               title: 'Client Management',
//               description: 'Keep all your client information organized in one place',
//             },
//             {
//               icon: BarChart3,
//               title: 'Analytics Dashboard',
//               description: 'Track your revenue, invoices, and business metrics at a glance',
//             },
//             {
//               icon: Zap,
//               title: 'PDF Generation',
//               description: 'Automatically generate and download beautiful PDF documents',
//             },
//           ].map((feature, i) => {
//             const Icon = feature.icon;
//             return (
//               <div key={i} className="glass-card p-6 rounded-xl">
//                 <div className="mb-4 p-3 bg-primary/20 rounded-lg w-fit">
//                   <Icon className="w-6 h-6 text-primary" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
//                 <p className="text-muted-foreground text-sm">{feature.description}</p>
//               </div>
//             );
//           })}
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="px-6 md:px-8 py-20 max-w-7xl mx-auto">
//         <div className="glass-card p-12 rounded-xl text-center">
//           <h2 className="text-3xl font-bold text-foreground mb-4">Ready to get started?</h2>
//           <p className="text-muted-foreground mb-8">Join thousands of businesses using Ephorsys for their billing needs</p>
//           <Link href="/login">
//             <Button size="lg" className='cursor-pointer'>Sign In</Button>
//           </Link>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="border-t border-border px-6 md:px-8 py-8 max-w-7xl mx-auto">
//         <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground text-sm">
//           <p>&copy; {new Date().getFullYear()} Ephorsys. All rights reserved.</p>
//           <div className="flex gap-6">
//             <a href="#" className="hover:text-primary transition-colors">
//               Privacy
//             </a>
//             <a href="#" className="hover:text-primary transition-colors">
//               Terms
//             </a>
//             <a href="#" className="hover:text-primary transition-colors">
//               Contact
//             </a>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }


import React from "react";
import Component from "@/components/saa-s-template";

export default function Demo() {
  return <Component />;
}
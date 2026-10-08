'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';

  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchHtml() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${id}/html`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to load invoice content');
        }
        const html = await res.text();
        if (isMounted) {
          setHtmlContent(html);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error loading invoice');
          setLoading(false);
        }
      }
    }

    fetchHtml();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePrint = () => {
    const iframe = document.getElementById('invoice-frame') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  };

  useEffect(() => {
    if (!loading && htmlContent && autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [loading, htmlContent, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <p className="text-sm text-neutral-400">Loading invoice preview...</p>
      </div>
    );
  }

  if (error || !htmlContent) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center text-white p-6">
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-8 max-w-md w-full text-center space-y-4">
          <p className="text-red-400 font-semibold">{error || 'Invoice not found'}</p>
          <Button variant="outline" onClick={() => router.back()} className="text-neutral-200">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center">
      {/* Floating Action Bar (Hidden during print) */}
      <nav aria-label="Print toolbar" className="no-print sticky top-0 z-50 w-full bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <span className="text-sm font-semibold text-neutral-200 border-l border-neutral-700 pl-3">
            Invoice Print Preview
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-500 text-white font-medium flex items-center gap-2 cursor-pointer shadow"
            size="sm"
          >
            <Printer className="w-4 h-4" /> Print Document
          </Button>
        </div>
      </nav>

      {/* Embedded Invoice Document Container */}
      <div className="w-full flex justify-center py-6 print:py-0">
        <iframe
          id="invoice-frame"
          srcDoc={htmlContent}
          title="Invoice Document"
          className="w-[210mm] min-h-[297mm] h-[1150px] bg-white border border-neutral-300 rounded-sm shadow-2xl print:shadow-none print:border-none print:w-full print:h-screen print:m-0"
        />
      </div>

      <style jsx global>{`
        @media print {
          nav, .no-print, header, footer {
            display: none !important;
          }
          body, html {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          iframe {
            border: none !important;
            box-shadow: none !important;
            width: 100vw !important;
            height: 100vh !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

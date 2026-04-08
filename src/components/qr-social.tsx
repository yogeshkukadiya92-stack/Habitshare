'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, ScanText, UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';

export function QrSocial() {
  const { user, currentUser } = useAuth();
  const { toast } = useToast();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  if (!user || !currentUser) return null;

  const myQrValue = JSON.stringify({
    type: 'habit-share-profile',
    id: user.uid,
    name: currentUser.name,
    email: user.email,
  });

  const handleScan = (result: any) => {
    if (result) {
      try {
        const data = JSON.parse(result[0].rawValue);
        if (data.type === 'habit-share-profile') {
          setScanResult(data.name);
          toast({
            title: "Friend Found!",
            description: `You've scanned ${data.name}'s profile. Request sent!`,
          });
          setIsScannerOpen(false);
        } else {
            toast({
                title: "Invalid QR",
                description: "This QR code is not a Habit Share profile.",
                variant: "destructive"
            });
        }
      } catch (e) {
        console.error("Scan error:", e);
      }
    }
  };

  return (
    <div className="flex gap-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-2xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all">
            <QrCode className="h-4 w-4 mr-2 text-primary" /> My QR Code
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-gradient-to-br from-primary/10 via-white to-indigo-50/30 p-8 flex flex-col items-center">
            <DialogHeader className="mb-6 w-full text-center">
              <DialogTitle className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Your Social QR</DialogTitle>
              <CardDescription className="font-medium text-slate-500">Show this to a friend to let them add you instantly.</CardDescription>
            </DialogHeader>
            
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-primary/10 border border-white mb-6 transform hover:scale-105 transition-transform duration-500">
              <QRCode 
                value={myQrValue} 
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>

            <div className="flex flex-col items-center gap-2">
                <p className="text-lg font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-sm font-medium text-slate-400">{user.email}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogTrigger asChild>
          <Button className="rounded-2xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all px-6">
            <ScanText className="h-4 w-4 mr-2" /> Scan to Add
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
           <div className="bg-slate-900 aspect-square flex items-center justify-center relative">
             <Scanner 
                onScan={handleScan}
                allowMultiple={false}
                styles={{
                    container: { width: '100%', height: '100%'}
                }}
             />
             <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none">
                 <div className="w-full h-full border-2 border-primary/50 relative">
                     <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                     <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                     <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                     <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                 </div>
             </div>
           </div>
           <div className="p-6 bg-white text-center">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Scanner Active</p>
              <p className="text-xs text-slate-400">Position the friend's QR code within the frame to connect.</p>
              <Button variant="ghost" className="mt-4 text-slate-400 hover:text-slate-600" onClick={() => setIsScannerOpen(false)}>Cancel Scanning</Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

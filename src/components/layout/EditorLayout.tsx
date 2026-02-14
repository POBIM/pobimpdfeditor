'use client';

import { type ReactNode } from 'react';
import Header from './Header';
import Toolbar from './Toolbar';
import ToolConfigBar from './ToolConfigBar';
import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import SignaturePad from '@/components/canvas/SignaturePad';
import ExportModal from '@/components/pdf/ExportModal';

interface EditorLayoutProps {
  children: ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Header />
      <Toolbar />
      <ToolConfigBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 bg-canvas-bg relative overflow-auto">
          {children}
        </main>
        <PropertiesPanel />
      </div>
      <SignaturePad />
      <ExportModal />
    </div>
  );
}

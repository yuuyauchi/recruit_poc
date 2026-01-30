'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function TestRedirect() {
  useEffect(() => {
    redirect('/problems');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">課題選択画面にリダイレクト中...</p>
      </div>
    </div>
  );
}

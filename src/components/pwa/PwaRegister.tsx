'use client';

import { useEffect } from 'react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const serviceWorkerPath = `${basePath}/sw.js`;
const serviceWorkerScope = basePath ? `${basePath}/` : '/';

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    void navigator.serviceWorker
      .register(serviceWorkerPath, { scope: serviceWorkerScope })
      .catch(() => undefined);
  }, []);

  return null;
}

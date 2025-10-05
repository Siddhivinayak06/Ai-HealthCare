import { useEffect, useState } from 'react';

/**
 * ClientOnly component renders children only on the client, not during SSR
 * Use this to wrap components that cause hydration errors
 */
export default function ClientOnly({ children, ...delegated }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return (
    <div {...delegated}>
      {children}
    </div>
  );
} 
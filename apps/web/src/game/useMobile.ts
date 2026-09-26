import { useEffect, useState } from 'react';

export function useMobile() {
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 999px)').matches);
  useEffect(() => {
    const query = matchMedia('(max-width: 999px)');
    const change = () => setMobile(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  return mobile;
}

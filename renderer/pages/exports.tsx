import dynamic from 'next/dynamic';

const ExportsPage = dynamic(async () => import('../client-pages/exports'), {ssr: false});

export default ExportsPage;

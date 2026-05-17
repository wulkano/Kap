import dynamic from 'next/dynamic';

const DialogPage = dynamic(async () => import('../client-pages/dialog'), {ssr: false});

export default DialogPage;

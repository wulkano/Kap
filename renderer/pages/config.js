import dynamic from 'next/dynamic';

const ConfigPage = dynamic(async () => import('../client-pages/config'), {ssr: false});

export default ConfigPage;

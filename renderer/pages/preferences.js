import dynamic from 'next/dynamic';

const PreferencesPage = dynamic(async () => import('../client-pages/preferences'), {ssr: false});

export default PreferencesPage;

import dynamic from 'next/dynamic';

const EditorPage = dynamic(async () => import('../client-pages/editor'), {ssr: false});

export default EditorPage;

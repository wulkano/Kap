import dynamic from 'next/dynamic';

const CropperPage = dynamic(async () => import('../client-pages/cropper'), {ssr: false});

export default CropperPage;

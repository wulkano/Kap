import {AppProps} from 'next/app';
import dynamic from 'next/dynamic';

const KapApp = dynamic<AppProps>(async () => import('../components/kap-app'), {
  ssr: false
});

export default KapApp;

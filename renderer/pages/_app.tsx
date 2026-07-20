import {AppProps} from 'next/app';
import dynamic from 'next/dynamic';

const MainApp = dynamic<AppProps>(async () => import('../components/main-app'), {
  ssr: false
});

export default MainApp;

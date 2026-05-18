import {AppProps} from 'next/app';
import dynamic from 'next/dynamic';

const Kap = dynamic<AppProps>(async () => import('../components/kap-app'), {
  ssr: false
});

export default Kap;

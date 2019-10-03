import test from 'ava';
import React from 'react';
import {shallow, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import WindowHeader from '../renderer/components/window-header';

configure({adapter: new Adapter()});

test('can mount component window header', t => {
  const wrapper = shallow(<WindowHeader/>);
  t.true(wrapper.hasClass('window-header'));
});

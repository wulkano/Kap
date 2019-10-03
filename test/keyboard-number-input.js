import test from 'ava';
import React from 'react';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import KeyboardNumberInput from '../renderer/components/keyboard-number-input';

configure({adapter: new Adapter()});

test('it should render input', t => {
  const wrapper = mount(<KeyboardNumberInput/>);
  wrapper.find('input[type="text"]').at(2);
  const input = wrapper.simulate('change', {target: {value: 72}});
  t.is((input.length), 1);
});

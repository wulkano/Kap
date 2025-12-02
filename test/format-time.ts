import test from 'ava';
import formatTime from '../main/utils/format-time';

test('formatTime formats seconds correctly', t => {
  t.is(formatTime(0), '0:00');
  t.is(formatTime(5), '0:05');
  t.is(formatTime(30), '0:30');
  t.is(formatTime(65), '1:05');
  t.is(formatTime(125), '2:05');
});

test('formatTime formats minutes and seconds correctly', t => {
  t.is(formatTime(60), '1:00');
  t.is(formatTime(90), '1:30');
  t.is(formatTime(3665), '61:05');
});

test('formatTime formats hours correctly', t => {
  t.is(formatTime(3600), '1:0:00');
  t.is(formatTime(3661), '1:1:01');
  t.is(formatTime(7325), '2:2:05');
});

test('formatTime shows milliseconds when requested', t => {
  const result = formatTime(65.123, {showMilliseconds: true});
  t.is(result, '1:05.12');
});

test('formatTime handles extra time correctly', t => {
  const result = formatTime(65, {extra: 30});
  t.is(result, '1:05  (0:30)');
});


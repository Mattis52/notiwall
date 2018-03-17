import { findObjectPaths, getStringParams } from './utils';

it('Find object paths', () => {
  let obj = {
    a: {
      b: {
        c: 'first'
      },
      c: {
        c: 'second'
      }
    },
    b: {
      b: 1
    }
  };

  expect(findObjectPaths(obj, 'a.b.c')).toEqual([ 'a.b.c' ]);
  expect(findObjectPaths(obj, 'a.*.c')).toEqual([ 'a.b.c', 'a.c.c' ]);
  expect(findObjectPaths(obj, '*.b')).toEqual([ 'a.b', 'b.b' ]);
  expect(findObjectPaths(obj, '*.*')).toEqual([ 'a.b', 'a.c', 'b.b' ]);
  expect(findObjectPaths(obj, '*.*.c')).toEqual([ 'a.b.c', 'a.c.c' ]);
  expect(findObjectPaths(obj, '*.*.*')).toEqual([ 'a.b.c', 'a.c.c' ]);
  expect(findObjectPaths(obj, '*.*|a.b.c')).toEqual([ 'a.b', 'a.c', 'b.b', 'a.b.c' ]);
  expect(findObjectPaths(obj, 'a.b,c')).toEqual([ 'a.b', 'a.c' ]);
  expect(findObjectPaths(obj, 'a.b,c.c')).toEqual([ 'a.b.c', 'a.c.c' ]);
  expect(findObjectPaths(obj, 'a.b,c.d')).toEqual([]);
  expect(findObjectPaths(obj, '*.*|a.b,c.c')).toEqual([ 'a.b', 'a.c', 'b.b', 'a.b.c', 'a.c.c' ]);
});

it('Get string params', () => {
  expect(getStringParams('test{{one}}')).toEqual([ 'one' ]);
  expect(getStringParams('{{two}}test')).toEqual([ 'two' ]);
  expect(getStringParams('{{three}}test{{four}}')).toEqual([ 'three', 'four' ]);
  expect(getStringParams('{{five}}{{six}}')).toEqual([ 'five', 'six' ]);
  expect(getStringParams('test{{seven}}test{{eight}}test')).toEqual([ 'seven', 'eight' ]);
  expect(getStringParams('test{{nine}}{{ten}}')).toEqual([ 'nine', 'ten' ]);
  expect(getStringParams('test{{eleven}}{{twelve')).toEqual([ 'eleven' ]);
  expect(getStringParams('te}}st{{13{{14}}')).toEqual([ '13{{14' ]);
  expect(getStringParams('te}}st{{}}')).toEqual([ '' ]);
  expect(getStringParams('test(15)test', '(', ')')).toEqual([ '15' ]);
  expect(getStringParams('test(16))))test', '(', '))))')).toEqual([ '16' ]);
  expect(getStringParams('test(((17)test', '(((', ')')).toEqual([ '17' ]);
  expect(getStringParams('test|18|test', '|', '|')).toEqual([ '18' ]);
  expect(getStringParams('test|19|||20||', '|', '||')).toEqual([ '19', '20' ]);
  expect(getStringParams('test||21|||22||', '|', '|||')).toEqual([ '|21' ]);
});
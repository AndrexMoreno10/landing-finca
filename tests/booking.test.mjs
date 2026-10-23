import test from 'node:test';
import assert from 'node:assert/strict';
import {quote,overlaps} from '../booking.mjs';
const now=new Date('2026-10-21T12:00:00Z');
test('Year-end stay, cleaning and maximum capacity',()=>{const q=quote({arrival:'2026-12-30',departure:'2027-01-02',guests:26},180000,now);assert.equal(q.nights,3);assert.equal(q.total,4680000)});
test('Reject past, reversed, invalid dates and excess capacity',()=>{for(const b of [{arrival:'2026-10-20',departure:'2026-10-23',guests:2},{arrival:'2026-12-24',departure:'2026-12-24',guests:2},{arrival:'2027-02-30',departure:'2027-03-04',guests:2},{arrival:'2026-12-24',departure:'2026-12-25',guests:27}])assert.throws(()=>quote(b,0,now))});
test('Back-to-back bookings do not overlap',()=>{const a={arrival:'2026-12-24',departure:'2026-12-26'};assert.equal(overlaps(a,{arrival:'2026-12-26',departure:'2026-12-28'}),false);assert.equal(overlaps(a,{arrival:'2026-12-25',departure:'2026-12-27'}),true)});

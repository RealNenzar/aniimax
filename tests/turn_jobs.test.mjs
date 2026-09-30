import assert from 'node:assert/strict';
import test from 'node:test';

import { allocateTurnJobs } from '../web/turn-jobs.js';

const row = (item_name, busy_units, facility_count = 1) => ({
    item_name,
    busy_units,
    facility_count,
    cycle_time: 10,
});

test('separates two recipes when two units of any facility are owned', () => {
    const machines = allocateTurnJobs([row('rough_lumber', 0.6), row('standard_planks', 0.4)], 2);
    assert.deepEqual(machines.map(jobs => jobs.map(job => job.item)), [['rough_lumber'], ['standard_planks']]);
});

test('shares tier recipes when only one unit is owned', () => {
    const machines = allocateTurnJobs([row('rough_lumber', 0.6), row('standard_planks', 0.4)], 1);
    assert.deepEqual(machines.map(jobs => jobs.map(job => job.item)), [['rough_lumber', 'standard_planks']]);
    assert.equal(machines[0].reduce((sum, job) => sum + job.rate * job.cycle, 0), 1);
});

test('splits workloads above one unit without exceeding owned capacity', () => {
    const machines = allocateTurnJobs([row('rough_lumber', 1.2, 2), row('standard_planks', 0.6)], 2);
    assert.equal(machines.length, 2);
    machines.forEach(jobs => assert.ok(jobs.reduce((sum, job) => sum + job.rate * job.cycle, 0) <= 1 + 1e-9));
    assert.equal(machines.flat().filter(job => job.item === 'rough_lumber').reduce((sum, job) => sum + job.rate * job.cycle, 0), 1.2);
    assert.equal(machines.flat().filter(job => job.item === 'standard_planks').reduce((sum, job) => sum + job.rate * job.cycle, 0), 0.6);
});

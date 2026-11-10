import assert from 'node:assert/strict';
import {BIOGLOW_MODELS, bioglowTouchedModels} from '../src/components/fll/bioglowField.ts';

const pose = (xCm, zCm) => ({xCm, zCm});

assert.equal(BIOGLOW_MODELS.length, 18, 'both field halves should have the nine numbered models');
assert.equal(BIOGLOW_MODELS.filter((model) => model.side === 'red').length, 9);
assert.equal(BIOGLOW_MODELS.filter((model) => model.side === 'blue').length, 9);
assert.deepEqual(bioglowTouchedModels([pose(-100, 38)]), [], 'the launch pose must not activate a model');

const nestRoute = bioglowTouchedModels([pose(-100, -16), pose(-73, -16)]);
assert.ok(nestRoute.includes('red-nest'), 'a route segment through the nest should release its mechanism');
assert.ok(!nestRoute.includes('blue-nest'), 'the opposite half should remain untouched');

const youngForestRoute = bioglowTouchedModels([pose(-100, -24), pose(-100, -40)]);
assert.ok(youngForestRoute.includes('red-young'), 'the young forest should react to robot contact');
assert.ok(youngForestRoute.includes('blue-hive'), 'the young forest sensor should trigger the opposite hive');
assert.ok(!youngForestRoute.includes('red-hive'), 'the local hive should not be cross-triggered');

assert.deepEqual(bioglowTouchedModels([pose(-100, 38), pose(-90, 38)]), [], 'a route away from models should leave them at rest');
console.log('BIOGLOW field placement, contact, and cross-field linkage checks passed');

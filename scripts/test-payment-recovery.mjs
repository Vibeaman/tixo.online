import assert from 'node:assert/strict'
import { assertAmount, normaliseItems } from '../api/_lib/createTicketsForReference.js'

assert.doesNotThrow(() => assertAmount({ charged: 3654.83, expected: 3500, txpRedemption: false }))
assert.throws(() => assertAmount({ charged: 3498.99, expected: 3500, txpRedemption: false }))
assert.doesNotThrow(() => assertAmount({ charged: 1000, expected: 3500, txpRedemption: true }))
assert.deepEqual(normaliseItems({ tickets: [{ tier_name: 'Regular', quantity: 2, attendee_name: 'Buyer' }] }), [{ tierName: 'Regular', quantity: 2, attendeeName: 'Buyer', attendeeEmail: null, index: 0 }])
console.log('payment recovery unit tests passed')

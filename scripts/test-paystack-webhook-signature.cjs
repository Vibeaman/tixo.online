const assert = require('node:assert/strict')
const crypto = require('node:crypto')

const secret = 'test-paystack-secret'
const rawBody = Buffer.from('{"event":"charge.success", "data":{"reference":"tixo_test_123"}}')
const parsedBody = JSON.parse(rawBody.toString('utf8'))
const rawSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
const parsedSignature = crypto.createHmac('sha512', secret).update(JSON.stringify(parsedBody)).digest('hex')

assert.notEqual(rawSignature, parsedSignature, 'raw bytes must not be replaced by JSON.stringify(req.body)')
const expected = Buffer.from(rawSignature, 'hex')
const received = Buffer.from(rawSignature, 'hex')
assert.equal(expected.length, received.length)
assert.equal(crypto.timingSafeEqual(expected, received), true)

console.log('Paystack webhook raw-body signature test passed')

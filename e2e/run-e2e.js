// trivial e2e script used by label-driven workflow
const { sum } = require('../dist/index')


if (sum(2,3) !== 5) {
console.error('E2E failed')
process.exit(1)
}
console.log('E2E OK')
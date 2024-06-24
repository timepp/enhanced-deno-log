import * as log from './log.ts'

console.log('Hello, World!')
console.error('Errors!')
console.warn('Warnings!')
log.setDateFormat('m-d H:M:S.T')
console.info('Information!')
console.debug('Debugging!')
console.error('multi line\nerrors!\nanother line!')
console.time('timer')
console.timeLog('timer', 'action started')
console.timeEnd('timer')

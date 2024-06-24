import * as log from './log.ts'

console.log('Hello, World!')
console.error('Errors!')
console.warn('警告!')
log.setDateFormat('m-d H:M:S.T')
console.info('Information!')
console.debug('Debugging!')
console.log()
console.error('multi line\nerrors!\nanother line!')
console.time('timer')
console.timeLog('timer', 'action started')
console.timeEnd('timer')

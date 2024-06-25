import * as log from './log.ts'

log.setDateFormat('m-d H:M:S.T')

console.log('Hello, World!')
console.error('Errors!')
console.warn('警告!')
console.info('Information!')
console.debug('Debugging!')
console.log()
console.error('\nmulti line\nerrors!\nanother line!\n\nfda\n\n')
console.time('timer')
console.timeLog('timer', 'action started')
console.timeEnd('timer')
log.setColors({error: '#ff00ff'})
console.error('Errors!')
console.info('%cHello, \nW%corld!', 'color:#00ffff', 'color:#ff00ff')
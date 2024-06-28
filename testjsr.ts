import 'jsr:@timepp/enhanced-deno-log'

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
console.log()
console.info('%cmulti-line \n%ccolored%c\nlog', 'color:#00ffff', 'color:#ff00ff', 'color:#00ff00')
import * as log from './log.ts'

console.log('Hello, World!')
console.log('')
console.log('%c%c')
console.error('Errors!')
console.warn('警告!')
console.info('Information!', 20, {a: 1, b: 2}, [])
console.debug('Debugging!')
console.log()
console.log(null)
console.log(undefined)
console.log(console.log)
console.log(log)
console.error('\nmulti line\nerrors!\nanother line!\n\nfda\n\n')
console.time('timer')
console.timeLog('timer', 'action started')
console.timeEnd('timer')
console.log()
console.info('%cmulti-line \n%ccolored%c\nlog', 'color:#00ffff', 'color:#ff00ff', 'color:#00ff00')
try {
    const text = Deno.readTextFileSync('nonexistent.txt')
} catch (e) {
    console.error(e)
}

{
    log.traceScope('block 1')
    console.log('log inside block 1')
}

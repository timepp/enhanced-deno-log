import * as log from './log.ts'

export async function test() {
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

    syncFunc('test', [1, 2, 3], {a: 1, b: 2})
    await asyncFunc()
}

function syncFunc(s: string, d: number[], o: any) {
    using _ = log.traceFunction([...arguments])
    try {
        console.debug('Opening file...')
        return Deno.readTextFileSync('nonexistent.txt')
    } catch (e) {
        console.error(e)
        return ''
    }
}

async function asyncFunc() {
    console.log('asyncFunc started, waiting 1 second...')
    await new Promise(r => setTimeout(r, 1000))
    console.log('asyncFunc ended')
}

if (import.meta.main) {
    // log.setConfig({indentSize: 2, prefixFormat: '{T} {C} '}, 'console')
    log.init()
    await test()
}

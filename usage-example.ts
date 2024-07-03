import * as log from 'jsr:@timepp/enhanced-deno-log@0.1.8'

function getContent(filename: string) {
    using _ = log.traceScope('getContent')
    try {
        console.debug('Opening file...')
        return Deno.readTextFileSync(filename)
    } catch (e) {
        console.error(e)
        return ''
    }
}
function init() {
    using _ = log.traceScope('init')
    console.info('Information!')
    const content = getContent('nonexistent.txt')
    console.log('content:', content)
}

console.log('Hello, World!')
console.warn('警告!')
init()
console.log()
console.log('\nmulti line\nlogs!\nanother line!\n\nfda\n\n')
console.time('timer')
console.timeLog('timer', 'action started')
console.timeEnd('timer')
console.log()
console.info('multi-%cline \ncolored%c\nlog', 'color:#00ffff', 'color:#ff00ff')

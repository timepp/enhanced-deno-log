import * as log from './log.ts'

// test lazy creation of file logger

log.init()
log.setConfig({enabledLevels:[]}, 'file')

console.log('Console only log')

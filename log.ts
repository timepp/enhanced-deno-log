// deno-lint-ignore-file no-explicit-any

import * as dt from 'jsr:@std/datetime'

const defaultConfig = {
	dateFormat: 'yyyy-MM-dd HH:mm:ss.SSS',
	prefixEmptyLines: false,
	indent: 2,
	colors: {error: 'red', warn: 'yellow', log: 'lightgray', info: 'blue', debug: 'gray', timer: 'green', func: 'purple'}
}

let file: Deno.FsFile
const config = {...defaultConfig, colors: {...defaultConfig.colors}}
const rawConsole = {...globalThis.console}
const timers: Record<string, number> = {}
let currentIndent = 0
init()

function init() {
	const name = Deno.mainModule.replace(/.*\/([^\\]+)\.ts$/, '$1')
	try { Deno.statSync('./logs/') } catch { Deno.mkdirSync('./logs/') }
	file = Deno.createSync(`./logs/${name}-${new Date().toJSON().replaceAll(':', '_')}.log`)
	for (const k of ['error', 'warn', 'log', 'info', 'debug'] as const) {
		globalThis.console[k] = (...data: any[]) => timestampedLeveledLog(k, data)
	}
	
	globalThis.console.time = (label = 'default') => {
		if (timers[label])
			return console.warn(`Timer ${label} already exists.`, timers)
		timers[label] = performance.now()
	}
	globalThis.console.timeLog = (label = 'default', ...data: any[]) => {
		const logTime = performance.now()
		const startTime = timers[label]
		if (!startTime)
			return console.warn(`Timer ${label} doesn't exist.`, timers)
		timestampedLeveledLog('timer', [`${label}: ${(logTime - startTime).toLocaleString(undefined, { maximumFractionDigits: 0 })}ms`, ...data])
	}
	globalThis.console.timeEnd = (label = 'default') => {
		const endTime = performance.now()
		const startTime = timers[label]
		if (!startTime)
			return console.warn(`Timer ${label} doesn't exist.`, timers)
		timestampedLeveledLog('timer', [`${label}: ${(endTime - startTime).toLocaleString(undefined, { maximumFractionDigits: 0 })}ms - timer ended`])
		delete timers[label]
	}
}

function timestampedLeveledLog (level: keyof typeof config.colors, data: any[]) {
	const getPrefix = (type: string) => [`[${dt.format(new Date, config.dateFormat)}]`, `[${type.padStart(5, ' ')}]`]

	const formatParams = (data: any[]) => {
		const records = []
		for (let i = 0; i < data.length; ++i)
			records.push((typeof data[i] === 'string') ? data[i] : Deno.inspect(data[i]))
		return records.join(' ')
	}

	// count '%c' in a string but ignore '%%c'
	const findColorSpecifiers = (s: string) => {
		const r = []
		for (let i = 0; i < s.length - 1; ++i) {
			if (s[i] === '%' && s[i + 1] === 'c' && (i === 0 || s[i - 1] !== '%'))
				r.push(i)
		}
		return r
	}

	const removeColorSpecifiers = (s: string, removeLimit: number) => {
		const cs = findColorSpecifiers(s).slice(0, removeLimit)
		let r = ''
		let p = 0
		for (const c of cs) {
			r += s.slice(p, c)
			p = c + 2
		}
		r += s.slice(p)
		return r
	}

	const [dp, lp] = getPrefix(level)
	const emptyLineIntention = data.length === 0
	if (data.length === 0) data = ['']

	let fi = 1
	const outputInfo: {l: string, colors: string[]}[] = []
	if (typeof data[0] === 'string') {
		const lines = data[0].split('\n')
		for (const l of lines) {
			const c = findColorSpecifiers(l).length
			outputInfo.push({l, colors: data.slice(fi, fi + c)})
			fi += c
		}
	} else {
		outputInfo.push(...formatParams([data[0]]).split('\n').map(l => ({l, colors: []})))
	}

	if (fi < data.length) {
		const remainingLines = formatParams(data.slice(fi)).split('\n')
		outputInfo[outputInfo.length - 1].l += ' '+ remainingLines.shift()
		for (const l of remainingLines) {
			outputInfo.push({ l, colors: [] })
		}
	}

	const pf = `color:${config.colors[level]}`
	const indent = ' '.repeat(currentIndent)
	let currentUserColorFormat = pf
	for (let i = 0; i < outputInfo.length; ++i) {
		const c = outputInfo[i]
		const connector = outputInfo.length === 1 ? '─' : (i === 0 ? '┬' : i === outputInfo.length - 1 ? '└' : '├')
		if (config.prefixEmptyLines === false && emptyLineIntention) {
			// if there is only one line and it's empty, don't prefix it
		} else {
			c.l = `%c${dp}${connector}${lp} %c` + indent + c.l
			c.colors = [pf, currentUserColorFormat, ...c.colors]
		}
		if (c.colors.length > 0) {
			currentUserColorFormat = c.colors[c.colors.length - 1]
		}
	}

	const finalContent = outputInfo.map(o => o.l).join('\n')
	const finalColors = outputInfo.flatMap(o => o.colors)
	file.write(new TextEncoder().encode(removeColorSpecifiers(finalContent, finalColors.length) + '\n'))
	rawConsole[level === 'timer' || level === 'func'? 'log' : level](finalContent, ...finalColors)
}

/** 
 * Set date format for timestamp prefix in log messages
 * see https://deno.land/std/datetime/mod.ts for more information
 */
export function setDateFormat(fmt = defaultConfig.dateFormat) {
	config.dateFormat = fmt
}

/**
 * Whether to prefix log calls with no parameters, e.g. `console.log()`
 * Set this to `true` will keep writing prefix in this case
 * Set this to `false` will end up with a blank line
 * Default is `false`
 * Note: there will always be prefix for log calls with parameters, even this causes empty line, e.g. `console.log('')`
 */
export function prefixEmptyLines(p = false) {
	config.prefixEmptyLines = p
}

/**
 * Set colors for different log levels
 * @param colors an object with keys 'error', 'warn', 'log', 'info', 'debug', 'timer', 'func'
 */
export function setColors(colors: Partial<typeof config.colors>) {
	Object.assign(config.colors, colors)
}

/**
 * This function need to be called by `using` statement.
 * It will issue a log "${funcName} enters" with 'func' level immediately, and a log 
 * "${funcName} leaves" will be automatically issued when current scope ends
 * All other logs issued in this scope will be promoted using spaces by 1 indent level
 * @example
  * function init() {
 *   using x = traceScope('Init')
 *   ...
 *   console.log('another log inside init')
 *   ...
 * }
 */
export function traceScope(name: string) : { [Symbol.dispose](): void } {
	timestampedLeveledLog('func', [`${name} enters`])
	currentIndent += config.indent
	return { [Symbol.dispose](){
		currentIndent -= config.indent
		timestampedLeveledLog('func', [`${name} leaves`])
	}}
}

/**
 * traceScope with a function name automatically detected
 */
export function traceFunction() : { [Symbol.dispose](): void } {
	const l = new Error().stack?.split('\n')[2]
	const name = l?.match(/at (.+) \(/)?.[1] || l?.match(/\/([^\/]+)$/)?.[1] || 'anonymous'
	return traceScope(name)
}

/**
 * Get the raw console object in case you need to use the original console
 */
export const raw = rawConsole

// deno-lint-ignore-file no-explicit-any

import * as dt from 'jsr:@std/datetime@0.224.3'

type logLevel = 'error' | 'warn' | 'log' | 'info' | 'debug' | 'timer' | 'func'
type LogConfig = {
	// Special format specifiers
	// {T}: time, current local time formated by `timeFormat`
	// {l}: log level in lowercase
	// {L}: log level in uppercase
	// {C}: multi-line connector
	prefixFormat: string,

	// the format of the time part in the prefix
	// see https://deno.land/std/datetime/mod.ts for more information
	timeFormat: string,

	// how to align the level string in the prefix
	levelAlignment: 'left' | 'right' | 'none',

	prefixEmptyLines: boolean,
	enabledLevels: logLevel[],
	indentSize: number,
	colors: Record<logLevel, string>
}

function getDefaultConsoleConfig() : LogConfig {
	return {
		prefixFormat: '[{T}]{C}[{L}] ',
		timeFormat: 'MM-dd HH:mm:ss.SSS',
		levelAlignment: 'right',
		enabledLevels: ['error', 'warn', 'log', 'info', 'debug', 'timer', 'func'],
		prefixEmptyLines: false,
		indentSize: 2,
		colors: {error: 'red', warn: 'yellow', log: 'lightgray', info: 'blue', debug: 'gray', timer: 'green', func: 'purple'}
	}
}
function getDefaultFileConfig() : LogConfig {
	return {
		prefixFormat: '[{T}]{C}[{L}] ',
		timeFormat: 'yyyy-MM-dd HH:mm:ss.SSS',
		levelAlignment: 'right',
		enabledLevels: ['error', 'warn', 'log', 'info', 'debug', 'timer', 'func'],
		prefixEmptyLines: false,
		indentSize: 4,
		colors: {error: 'red', warn: 'yellow', log: 'lightgray', info: 'blue', debug: 'gray', timer: 'green', func: 'purple'}
	}
}

let file: Deno.FsFile
const consoleConfig = getDefaultConsoleConfig()
const fileConfig = getDefaultFileConfig()
const rawConsole = {...globalThis.console}
const timers: Record<string, number> = {}
let currentIndent = 0

export function init() {
	const name = Deno.mainModule.replace(/.*\/([^\\]+)\.ts$/, '$1')
	try { Deno.statSync('./logs/') } catch { Deno.mkdirSync('./logs/') }
	file = Deno.createSync(`./logs/${name}-${dt.format(new Date, 'yyyyMMdd-HHmmss')}.log`)
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

function timestampedLeveledLog (level: logLevel, data: any[]) {
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

	const breakDataToColoredLines = (data: any[]) => {
		const formatParams = (data: any[]) => {
			const records = []
			for (let i = 0; i < data.length; ++i)
				records.push((typeof data[i] === 'string') ? data[i] : Deno.inspect(data[i]))
			return records.join(' ')
		}

		if (data.length === 0) data = ['']
		let fi = 1
		const cls: {l: string, colors: string[]}[] = []
		if (typeof data[0] === 'string') {
			const lines = data[0].split('\n')
			for (const l of lines) {
				const c = findColorSpecifiers(l).length
				cls.push({l, colors: data.slice(fi, fi + c)})
				fi += c
			}
		} else {
			cls.push(...formatParams([data[0]]).split('\n').map(l => ({l, colors: []})))
		}
	
		if (fi < data.length) {
			const remainingLines = formatParams(data.slice(fi)).split('\n')
			cls[cls.length - 1].l += ' '+ remainingLines.shift()
			for (const l of remainingLines) {
				cls.push({ l, colors: [] })
			}
		}

		return cls
	}

	const computeLogLines = (lines: {l: string, colors: string[]}[], cfg: LogConfig) => {
		const skipPrefix = data.length === 0 && cfg.prefixEmptyLines === false
		const dateStr = dt.format(new Date(), cfg.timeFormat)
		const alignFuncs = {
			left: (s: string) => s.padEnd(5, ' '),
			right: (s: string) => s.padStart(5, ' '),
			none: (s: string) => s
		}
		const levelStr = alignFuncs[cfg.levelAlignment](level)
		const indent = ' '.repeat(currentIndent * cfg.indentSize)
		const levelColor = `color:${cfg.colors[level]}`
		let currentUserColorFormat = levelColor
		const logs = []
		const colors = []
		for (let i = 0; i < lines.length; ++i) {
			const l = lines[i]
			const connector = lines.length === 1 ? '─' : (i === 0 ? '┬' : i === lines.length - 1 ? '└' : '├')
			if (skipPrefix) {
				logs.push(l.l)
				colors.push(...l.colors)
			} else {
				const prefix = cfg.prefixFormat
					.replaceAll('{T}', dateStr)
					.replaceAll('{l}', levelStr)
					.replaceAll('{L}', levelStr.toUpperCase())
					.replaceAll('{C}', connector)
				logs.push(`%c${prefix}%c${indent}` + l.l)
				colors.push(levelColor, currentUserColorFormat, ...l.colors)
			}
			if (l.colors.length > 0) currentUserColorFormat = l.colors[l.colors.length - 1]
		}
		return {logs, colors}
	}

	const outputToConsole = consoleConfig.enabledLevels.includes(level)
	const outputToFile = fileConfig.enabledLevels.includes(level)
	if (!outputToConsole && !outputToFile) return

	const lines = breakDataToColoredLines(data)
	
	if (outputToConsole) {
		const {logs, colors} = computeLogLines(lines, consoleConfig)
		rawConsole[level === 'timer' || level === 'func'? 'log' : level](logs.join('\n'), ...colors)
	}

	if (outputToFile) {
		const {logs, colors} = computeLogLines(lines, fileConfig)
		file.write(new TextEncoder().encode(removeColorSpecifiers(logs.join('\n'), colors.length) + '\n'))
	}
}

export function setConfig(config: Partial<LogConfig>, applyTo: 'console' | 'file' | 'all' = 'all') {
	if (applyTo === 'all' || applyTo === 'console') Object.assign(consoleConfig, config)
	if (applyTo === 'all' || applyTo === 'file') Object.assign(fileConfig, config)
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
export function traceScope(name: string, context = '') : { [Symbol.dispose](): void } {
	const contextText = context ? ` (${context})` : ''
	timestampedLeveledLog('func', [`${name} enters${contextText}`])
	currentIndent++
	return { [Symbol.dispose](){
		currentIndent--
		timestampedLeveledLog('func', [`${name} leaves`])
	}}
}

/**
 * traceScope with a function name automatically detected
 */
export function traceFunction(args: any[] = []) : { [Symbol.dispose](): void } {
	const l = new Error().stack?.split('\n')[2]
	const name = l?.match(/at (.+) \(/)?.[1] || l?.match(/\/([^\/]+)$/)?.[1] || 'anonymous'
	return traceScope(name, args.length > 0 ? 'args: ' + JSON.stringify(args) : '')
}

/**
 * Get the raw console object in case you need to use the original console
 */
export const raw = rawConsole

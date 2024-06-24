// deno-lint-ignore-file no-explicit-any
const name = Deno.mainModule.replace(/.*\/([^\\]+)\.ts$/, '$1')
try { Deno.statSync('./logs/') } catch { Deno.mkdirSync('./logs/') }
const file = Deno.createSync(`./logs/${name}-${new Date().toJSON().replaceAll(':', '_')}.log`)

let dateFormat = 'y-m-d H:M:S.T'
const fmtDate = (date: Date, fmt: string) => {
	const o = {
		'y': date.getFullYear(),
		'm': date.getMonth() + 1,
		'd': date.getDate(),
		'H': date.getHours(),
		'M': date.getMinutes(),
		'S': date.getSeconds(),
		'T': date.getMilliseconds()
	}
	return [...fmt].map(c => o[c as keyof typeof o]?.toString()?.padStart(c === 'T'? 3 : 2, '0') || c).join('')
}

const write = (type: string, data: any[]) => {
	const datePart = `[${fmtDate(new Date, dateFormat)}]`
	const levelPart = `[${type.padStart(5, ' ')}]`
	const records = []
	for (let i = 0; i < data.length; ++i)
		records.push((typeof data[i] === 'object') ? Deno.inspect(data[i]) : data[i])
	const raw = records.join(' ')
	const lines = raw.split('\n')
	let prefixed = ''
	if (lines.length === 1) {
		prefixed += `${datePart}─${levelPart} ${lines[0]}`
	} else if (lines.length > 1) {
		for (let i = 0; i < lines.length; ++i) {
			const line = lines[i]
			if (i === 0) {
				prefixed += `${datePart}┬${levelPart} ${line}`
			} else if (i < lines.length - 1) {
				prefixed += `\n${datePart}├${levelPart} ${line}`
			} else if (i === lines.length - 1) {
				prefixed += `\n${datePart}└${levelPart} ${line}`
			}
		}
	}

	//const prefixed = raw.split('\n').map(v => `${header} ${v}`).join('\n')
	file.write(new TextEncoder().encode(prefixed + '\n'))
	return prefixed
}

const error = globalThis.console.error
globalThis.console.error = (...data: any[]) => error('%c' + write('error', data), 'color:red')

const warn = globalThis.console.warn
globalThis.console.warn = (...data: any[]) => warn('%c' + write('warn', data), 'color:yellow')

const log = globalThis.console.log
globalThis.console.log = (...data: any[]) => log(write('log', data))

const info = globalThis.console.info
globalThis.console.info = (...data: any[]) => info('%c' + write('info', data), 'color:blue')

const debug = globalThis.console.debug
globalThis.console.debug = (...data: any[]) => debug('%c' + write('debug', data), 'color:gray')

const timers: Record<string, number> = {}
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
	log('%c' + write('timer', [`${label}: ${(logTime - startTime).toLocaleString(undefined, { maximumFractionDigits: 0 })}ms`, ...data]), 'color:green')
}
globalThis.console.timeEnd = (label = 'default') => {
	const endTime = performance.now()
	const startTime = timers[label]
	if (!startTime)
		return console.warn(`Timer ${label} doesn't exist.`, timers)
	log('%c' + write('timer', [`${label}: ${(endTime - startTime).toLocaleString(undefined, { maximumFractionDigits: 0 })}ms - timer ended`]), 'color:green')
	delete timers[label]
}

/** 
 * Use following single character to represent date parts: y - year, m - month, d - day, H - hour, M - minute, S - second, T - millisecond
 * 
 * e.g. setDateFormat('y-m-d H:M:S.T')
 */
export function setDateFormat(fmt: string) {
	dateFormat = fmt
}

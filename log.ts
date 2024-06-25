// deno-lint-ignore-file no-explicit-any
const name = Deno.mainModule.replace(/.*\/([^\\]+)\.ts$/, '$1')
try { Deno.statSync('./logs/') } catch { Deno.mkdirSync('./logs/') }
const file = Deno.createSync(`./logs/${name}-${new Date().toJSON().replaceAll(':', '_')}.log`)
const config = {
	dateFormat: 'y-m-d H:M:S.T',
	prefixEmptyLines: false,
	colors: {error: 'red', warn: 'yellow', log: 'lightgray', info: 'blue', debug: 'gray', timer: 'green'}
}
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
const getPrefix = (type: string) => [`[${fmtDate(new Date, config.dateFormat)}]`, `[${type.padStart(5, ' ')}]`]
const write = (type: string, data: any[]) => {
	const [datePart, levelPart] = getPrefix(type)
	const records = []
	for (let i = 0; i < data.length; ++i)
		records.push((typeof data[i] === 'object') ? Deno.inspect(data[i]) : data[i])
	const raw = records.join(' ')

	if (config.prefixEmptyLines === false) {
		if (raw.trim() === '') {
			file.write(new TextEncoder().encode('\n'))
			return ''
		}
	}

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

const rawConsole = {...globalThis.console}

for (const k of ['error', 'warn', 'log', 'info', 'debug'] as const) {
	globalThis.console[k] = (...data: any[]) => {
		if (data.length > 0 && typeof data[0] === 'string') {
			// check if there is '%c' inside the string, if so we cannot do anything, just pass it to raw console
			// note that '%%c' is just normal string, not format specifier
			const s = data[0] as string
			for (let i = 0; i < s.length; ++i) {
				if (s[i] === '%' && s[i + 1] === 'c' && (i === 0 || s[i - 1] !== '%')) {
					const [d, l] = getPrefix(k)
					rawConsole[k](`%c${d}─${l} ` + data[0], `color:${config.colors[k]}`, ...data.slice(1))
					return
				}
			}
		}
		rawConsole[k]('%c' + write(k, data), `color:${config.colors[k]}`)
	}
}

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
	rawConsole.log('%c' + write('timer', [`${label}: ${(logTime - startTime).toLocaleString(undefined, { maximumFractionDigits: 0 })}ms`, ...data]), 'color:green')
}
globalThis.console.timeEnd = (label = 'default') => {
	const endTime = performance.now()
	const startTime = timers[label]
	if (!startTime)
		return console.warn(`Timer ${label} doesn't exist.`, timers)
	rawConsole.log('%c' + write('timer', [`${label}: ${(endTime - startTime).toLocaleString(undefined, { maximumFractionDigits: 0 })}ms - timer ended`]), 'color:green')
	delete timers[label]
}

/** 
 * Use following single character to represent date parts: y - year, m - month, d - day, H - hour, M - minute, S - second, T - millisecond
 * 
 * e.g. setDateFormat('y-m-d H:M:S.T')
 */
export function setDateFormat(fmt = 'y-m-d H:M:S.T') {
	config.dateFormat = fmt
}

/**
 * Set whether prefix empty lines with date and log level
 */
export function prefixEmptyLines(p = false) {
	config.prefixEmptyLines = p
}

/**
 * Set colors for different log levels
 */
export function setColors(colors: Partial<typeof config.colors>) {
	Object.assign(config.colors, colors)
}

export const raw = rawConsole

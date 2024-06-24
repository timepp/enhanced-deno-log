{
    const name = Deno.mainModule.replace(/.*\/([^\\]+)\.ts$/, '$1')
    try { Deno.statSync('./logs/') } catch { Deno.mkdirSync('./logs/') }
	const file = Deno.createSync(`./logs/${name}-${new Date().toJSON().replaceAll(':', '_')}.log`)

	const write = (type: string, data: any[]) => {
		const header = `[${new Date().toJSON()}] [${type}]`
		const records = []
		for (let i = 0; i < data.length; ++i)
			records.push((typeof data[i] === 'object')? Deno.inspect(data[i]) : data[i])
		const raw = records.join(' ')
		const prefixed = raw.split('\n').map(v => `${header} ${v}`).join('\n')
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
		if (timers[ label ])
			return console.warn(`Timer ${label} already exists.`, timers)
		timers[ label ] = performance.now()
	}
	globalThis.console.timeLog = (label = 'default') => {
		const logTime = performance.now()
		const startTime = timers[ label ]
		if (!startTime)
			return console.warn(`Timer ${label} doesn't exist.`, timers)
		log(write('timer', [ `${label}: ${(logTime - startTime).toLocaleString(undefined, { maximumFractionDigits: 0 })}ms` ]))
	}
	globalThis.console.timeEnd = (label = 'default') => {
		const endTime = performance.now()
		const startTime = timers[ label ]
		if (!startTime)
			return console.warn(`Timer ${label} doesn't exist.`, timers)
		log(write('timer', [ `${label}: ${(endTime - startTime).toLocaleString(undefined, { maximumFractionDigits: 0 })}ms - timer ended` ]))
		delete timers[ label ]
	}
}
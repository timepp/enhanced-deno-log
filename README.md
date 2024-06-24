# optimized deno log with zero configuration

![](screenshot.png)

## Features

- Zero configuration, changing `console.xxx` behavior globally
- Colored output for errors(red), warnings(yellow), infos(blue), debugs(gray)
- Each log prefixed with timestamp and log level
- Log files auto created in `./logs` folder

## Usage

in your entrypoint file:
```
import 'jsr:@timepp/zero-config-deno-log'
```

That's it.

## Todo

- Add configurations to customize detailed behavior for advanced usage. (typically it's not needed - when you want to customize, you should first ask yourself: is that really necessary?)


# optimized deno log with zero configuration

![](screenshot.png)

## Features

- Zero configuration, changing `console.xxx` behavior globally
- Colored output for errors(red), warnings(yellow), infos(blue), debugs(gray), timers(green)
- Each log prefixed with timestamp and log level
- Log files auto created in `./logs` folder

## Usage

in your entrypoint file:
```
import 'jsr:@timepp/zero-config-deno-log'
```

That's it.

## Advanced Usage

In rare cases you may want to customize the log behavior.

```ts
import * as dl from 'jsr:@timepp/zero-config-deno-log'

// change date format:
dl.setDateFormat('m-d H:M:S')

```
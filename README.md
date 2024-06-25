# optimized deno log with zero configuration

![](screenshot.png)

## Features

- Zero configuration, changing `console.xxx` behavior globally
- Colored output for errors(red), warnings(yellow), infos(blue), debugs(gray), timers(green)
- Each log is prefixed with timestamp and log level; for multi-line logs, each log line is prefixed with timestamp and log level individually so that they are aligned and easy to read
- Log files are automatically created in `./logs` folder, with the entrypoint script name as the file name

## Usage

in your entrypoint file:
```
import 'jsr:@timepp/zero-config-deno-log'
```

That's it.

## Advanced Usage

### Customizing log behavior

In rare cases you may want to customize the log behavior.

```ts
import * as dl from 'jsr:@timepp/zero-config-deno-log'

// change date format:
dl.setDateFormat('m-d H:M:S')

// set empty line prefix behavior:
dl.prefixEmptyLines(true)

```

### Existing colored logs

You can still use single line colored logs, in this case the base color of the line is decided by level, and your colors are also respected at the same time.

However, for multi-line colored logs, there is a known issue that followed lines are not prefixed with timestamp and log level. This will be fixed in upcoming versions.

```ts
console.info('this is in "info" color (the same for prefix as well). %c and this is in "red" color', 'color: red')
```

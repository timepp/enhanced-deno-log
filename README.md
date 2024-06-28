# Enhanced Deno Log

Brings timestamp/levels prefix, coloring by levels, and log files to Deno's `console` API.

> Note: https://jsr.io/@timepp/zero-config-deno-log is the old name, it contains versions up to 0.1.7 and won't be updated anymore. Please use https://jsr.io/@timepp/enhanced-deno-log instead.

## Features

- Colored output for errors(red), warnings(yellow), infos(blue), debugs(gray), timers(green)
- Each log is prefixed with timestamp and log level; for multi-line logs, each log line is prefixed with timestamp and log level individually so that they are aligned and easy to read
- Log files are automatically created in `./logs` folder, with the entrypoint script name as the file name
- This module changes `console.xxx` behavior globally, so all your existing code will automatically have these features with zero configuration; you can customize detailed behavior if needed

![](screenshot.png)

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

You can still use colored logs, in this case the base color of the line is decided by level, and your colors are respected at the same time.

```ts
console.info('this is in "info" color (the same for prefix as well). %c and this is in "red" color', 'color: red')
```

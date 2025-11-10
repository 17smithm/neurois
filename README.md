

# Install

in .
npm install

move relevant node_modules to src-server/src/modules

in src-server/src
py -m http.server 7999

in src-server
py main.py

in .
npm run tauri dev

## Packages
### Rust
- tauri

### Javascript

### Python
- psycopg2

## Misc.
```
const profiler = new Profiler();f
profiler.start();
code here
profiler.end();
profiler.report()
const snap = performance.headSnapshot()
const snap2 = performance.headSnapshot()
snap2.compare(snap)
popover/modal and focus trapping for tabbing (dont use div)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```
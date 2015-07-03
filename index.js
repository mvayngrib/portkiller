#!/usr/bin/env node

var parallel = require('run-parallel')
var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    c: 'command',
    p: 'pid',
    u: 'user',
    t: 'type',
    d: 'device',
    f: 'force'
  }
})

var port = Number(argv._[0])
if (!port) {
  console.log('specify a port')
  process.exit(1)
}

var cp = require('child_process')
var cmd = 'lsof -i:' + port
cp.exec(cmd, function (err, stdout, stderr) {
  if (err) throw err
  if (stderr) return stderr.pipe(process.stderr)

  var lines = String(stdout)
    .split('\n')
    .filter(notNull)

  if (!lines.length) {
    console.log('no matching processes found')
    process.exit()
  }

  var cols = split(lines.shift().toLowerCase().trim())
  var hasFilter = cols.some(function (c) {
    return c !== 'force' && c in argv
  })

  var pidIdx = cols.indexOf('pid')
  var colRegex = cols
    .map(function (c) {
      return c in argv && new RegExp(String(argv[c]))
    })

  var tasks = lines
    .reduce(function (kill, line) {
      var parts = split(line)
      var pid = parts[pidIdx]
      var condemn = kill.indexOf(pid) === -1 && colRegex.every(function (regex, i) {
        return !regex || regex.exec(parts[i])
      })

      if (condemn) kill.push(pid)

      return kill
    }, [])
    .map(killer)

  if (!tasks.length) {
    console.log('\nno matches')
    return
  }

  if (!hasFilter && !argv.force) {
    console.log('\nno filter specified. To kill listed tasks, use -f or --force')
    return
  }

  parallel(tasks, function (err, killed) {
    console.log(err || killed)
  })
})

function killer (pid) {
  var infs = []
  return function (cb) {
    cp.exec('kill ' + pid, function (err, stdout, stderr) {
      infs.push({
        pid: pid,
        err: err,
        stderr: stderr,
        stdout: stdout
      })

      cb(null, infs)
    })
  }
}

function split (str) {
  return str.split(/\s+/)
}

function notNull (a) {
  return !!a
}

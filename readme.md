# portkiller

kill processes using a given port that match given filters

[![NPM](https://nodei.co/npm/portkiller.png)](https://nodei.co/npm/portkiller/)

# Usage

```
portkiller [port] <options>
```

portkiller runs lsof -i:[port]

to kill every process using that port, use -f (force flag)

to filter processes, specify regex for columns given by lsof: command, user, pid, etc.

# Example

```
portkiller 8080 --command "node|chrome" --pid "\d{3}"
```

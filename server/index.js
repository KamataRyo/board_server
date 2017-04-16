import express  from 'express'
import http     from 'http'
import socketIO from 'socket.io'
import { yellow, red, blue, green } from 'chalk'

import authenticate from './authenticate'

/**
 * message headers
 * @type {string}
 */
const UPSTREAM      = blue('UPSTREAM')
const DOWNSTREAM    = green('DOWNSTREAM')
const CONNECTION    = yellow('CONNECTION')
const AUTHORIZATION = red('CONNECTION')

const app = express()

const PORT = process.env.PORT || 3000

/**
 * Store data
 * @type {Object}
 */
const store = { data: {} }

const server = http.createServer(app)

server.listen(PORT, () => process.stdout.write(`WebSocket Server is listening on *:${PORT}\n`))

app.use((req, res, next) => {
  process.stdout.write('error')
  next()
})

socketIO
  .listen(server)
  .sockets.on('connection', socket => {

    // authenticate on connection
    socket.on('auth', data => {

      const { username, password } = data

      process.stdout.write(`[${CONNECTION}][${Date()}] ${username} is connected.\n`)

      if (authenticate(username, password)) {

        socket.emit('permit', true)
        socket.emit('downstream', store.data)
        process.stdout.write(`[${AUTHORIZATION}][${Date()}] ${username} is authorized.\n`)

        socket.on('upstream', data => {
          process.stdout.write(`[${UPSTREAM}][${Date()}] ${username} upload ${JSON.stringify(data)}.\n`)
          store.data = { ...store.data, ...data }
          socket.broadcast.emit('downstream', data)
          process.stdout.write(`[${DOWNSTREAM}][${Date()}] system is broadcasting ${JSON.stringify(data)}\n`)
        })

        socket.on('disconnect', () => {
          process.stdout.write(`[${CONNECTION}][${Date()}] ${username} is disconnected.\n`)
        })

      } else {
        socket.emit('permit', false)
        socket.disconnect()
        process.stdout.write(`[${AUTHORIZATION}][${Date()}] ${username} is not authorized.\n`)
        process.stdout.write(`[${CONNECTION}][${Date()}] ${username} is disconnected.\n`)
      }
    })
  })

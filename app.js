const mongoose = require('mongoose');
const debug = require('debug')('app:heart');
const socket = require('socket.io');
const server = require('http').createServer();
const io = socket(server);
const Chat = require('./models/Chat');

// Mongoose connection
mongoose.connect(
  'mongodb://localhost/mongochat',
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false
  }
);
// DB error handling
mongoose.connection
  .once('open', () => {
    debug('Connected to DB');

    io.on('connection', socket => {
      // Create function to send status
      const sendStatus = function(s) {
        socket.emit('status', s);
      };

      // Get chats from mongo collection
      Chat.find({})
        .limit(100)
        .sort('-_id')
        .exec()
        .then(res => {
          // Emit messages
          socket.emit('output', res);
        })
        .catch(err => debug('Chat get all error', err));

      // Handle input events
      socket.on('input', ({ name, message }) => {
        // Check for name and message
        if (name === '' || message === '') {
          // Send error status
          sendStatus('Please enter a name and message');
        } else {
          // Insert into DB
          const chat = new Chat({
            name,
            message
          });

          chat
            .save()
            .then(data => {
              socket.emit('output', [data]);
              // Send status object
              sendStatus({
                message: 'Message sent',
                clear: true
              });
            })
            .catch(err => debug('Chat insert error', err));

          // Chat.create({ name, message })
          //   .then(data => {
          //     socket.emit('output', data);
          //     // Send status object
          //     sendStatus({
          //       message: 'Message sent',
          //       clear: true
          //     });
          //   })
          //   .catch(err => debug('Chat insert error', err));
        }
      });

      // Handle clear
      socket.on('clear', data => {
        // Remove all chats from collection
        Chat.remove({}, function() {
          // Emit clear
          socket.emit('cleared');
        });
      });
    });
  })
  .on('error', err => debug('DB connection error', err));

// Server port
const PORT = process.env.PORT || 8000;
// Listen for request
server.listen(PORT, () => debug(`Server running on port ${PORT}`));

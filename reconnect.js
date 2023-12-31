const io = require('socket.io-client');
const fetch = require('node-fetch');
const duration = 300000 // 5m

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`Cookie request failed: ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, backoff));
    backoff *= 2; // Exponential backoff
  }

  throw lastError; // Throw the last error encountered
}

module.exports = {
  connectAndReconnect: async function(context, events, done) {
    const messageTimeout = setTimeout(() => {
      const errorMsg = 'The message event was never triggered';
      done(new Error(errorMsg));
    }, 100000);

    try {
      await fetchWithRetry('https://98y98340923u4.com/set-cookie', {
        method: 'GET',
      });
    } catch (error) {
      done(error);
    }

    try {
      const socket = io('https://98y98340923u4.com', {
        transports: ['websocket'],
        withCredentials: true,
      });

      let messageTimeout;

      socket.on('connect', () => {
        socket.emit('subscribe', 'A');
      });

      socket.on('message', payload => {
        socket.emit('updateSessionTS', payload.timestamp);
      });

      setTimeout(() => {
        socket.disconnect();

        setTimeout(() => {
          const socket2 = io('https://98y98340923u4.com', {
            transports: ['websocket'],
            withCredentials: true,
          });

          socket2.on('connect', () => {
            socket2.emit('subscribe', 'A');

            // Start messageTimeout timer when socket2 connects
            messageTimeout = setTimeout(() => {
              const errorMsg = 'Message event never triggered';
              done(new Error(errorMsg));
            }, 60000); // 1m
          });

          socket2.on('message', _ => {
            clearTimeout(messageTimeout);
          });

          setTimeout(() => {
            socket2.disconnect();
            done();
          }, duration);
        }, 60000); // 1m
      }, 60000); // 1m
    } catch {
      const errorWS = 'WebSocket connection error';
      done(new Error(errorWS));
    }
  }
};

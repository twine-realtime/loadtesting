const io = require('socket.io-client');
const fetch = require('node-fetch');

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP request failed: ${response.statusText}`);
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
    try {
      // Make an HTTP request to set the cookie
      const response = await fetchWithRetry('https://98y98340923u4.com/set-cookie', {
        method: 'GET',
        // Include other options if needed
      });

      // Log if successful
      // console.log("Cookie set");

      const socket = io('https://98y98340923u4.com', {
        transports: ['websocket'],
        withCredentials: true,
      });

      // Immediately subscribe on connection
      socket.on('connect', () => {
        socket.emit('subscribe', 'A');
      });

      // Connect for 1m > disconnect for 1m > reconnect > maintain connection for 10m
      setTimeout(() => {
        socket.disconnect();
        setTimeout(() => {
          const socket2 = io('https://98y98340923u4.com', {
            transports: ['websocket'],
            withCredentials: true,
          });
          socket2.on('connect', () => {
            socket2.emit('subscribe', 'A');
          });
          setTimeout(() => {
            done();
          }, 600000); // 10 minutes
        }, 60000); // 1 minute
      }, 60000); // 1 minute
    } catch (error) {
      console.error(error);
      done();
    }
  }
};
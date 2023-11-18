const io = require('socket.io-client');
const fetch = require('node-fetch');
const duration = 600000 // 10m

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
  setCookieAndConnectWebSocket: async function(context, events, done) {
    try {
      await fetchWithRetry('https://98y98340923u4.com/set-cookie', {
        method: 'GET',
      });
    } catch (error) {
      events.emit('metric', {
        name: 'fetchWithRetryErrors',
        value: 1,
        error: error.message
      });
      done(error);
    }

    try {
      const socket = io('https://98y98340923u4.com', {
        transports: ['websocket'],
        withCredentials: true,
      });

      // Immediately subscribe on connection
      socket.on('connect', () => {
        socket.emit('subscribe', 'A');
      });

      setTimeout(() => {
        socket.disconnect();
        done();
      }, duration);
    } catch (error) {
      events.emit('metric', {
        name: 'socketConnectionError',
        value: 1,
        error: error.message
      });
      done(error);
    }
  }
};
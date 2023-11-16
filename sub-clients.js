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
  setCookieAndConnectWebSocket: async function(context, events, done) {
    try {
      // Make an HTTP request to set the cookie
      const response = await fetchWithRetry('https://98y98340923u4.com/set-cookie', {
        method: 'GET',
        // Include other options if needed
      });

      // Log if successful
      // console.log("Cookie set");

      const socket = io('https://98y98340923u4.com', {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });

      // Immediately subscribe on connection
      socket.on('connect', () => {
        socket.emit('subscribe', 'A');
      });

      setTimeout(() => {
        socket.disconnect();
        done();
      }, 600000); // 10 minutes
    } catch (error) {
      console.error(error);
      done();
    }
  }
};
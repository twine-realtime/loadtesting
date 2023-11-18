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
    } catch {
      const errorFetch = "Fetch cookie error";
      done(new Error(errorFetch));
    }

    try {
      const socket = io('https://98y98340923u4.com', {
        transports: ['websocket'],
        withCredentials: true,
      });

      let messageTimeout;

      socket.on('connect', () => {
        socket.emit('subscribe', 'A');

        // Start messageTimeout timer when socket connects
        messageTimeout = setTimeout(() => {
          const errorMsg = "Message event never triggered";
          done(new Error(errorMsg));
        }, 60000);
      });

      socket.on("message", _ => {
        clearTimeout(messageTimeout);
      });

      setTimeout(() => {
        socket.disconnect();
        done();
      }, duration);
    } catch {
      const errorWS = "WebSocket connection error";
      done(new Error(errorWS));
    }
  }
};
const io = require('socket.io-client');
const fetch = require('node-fetch');

module.exports = {
  setCookieAndConnectWebSocket: async function(context, events, done) {
    try {
      // Make an HTTP request to set the cookie
      const response = await fetch('https://98y98340923u4.com/set-cookie', {
        method: 'GET'
        // Include other options if needed
      });

      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.statusText}`);
      }

      // Log if successful
      console.log("Cookie set");

      const socket = io('https://98y98340923u4.com', {
        transports: ['websocket'],
        withCredentials: true,
      });

      socket.on('connect', () => {
        console.log("WebSocket connection established");
      });

      setTimeout(() => {
        socket.disconnect();
        done();
      }, 600000); // 10 minutes; aligned with YAML
    } catch (error) {
      console.error(error);
      done();
    }
  }
};

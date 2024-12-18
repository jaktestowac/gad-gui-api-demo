// https://www.npmjs.com/package/pm2
module.exports = {
  apps: [
    {
      name: "gad2",
      script: "./server.js",
      restart_delay: 100,
      max_memory_restart: "1G",
      max_restarts: 10,
      min_uptime: 100,
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};

module.exports = {
  apps: [
    {
      name: 'hi-ai-chat',
      cwd: __dirname,
      script: 'npm',
      args: 'start',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
    },
  ],
};

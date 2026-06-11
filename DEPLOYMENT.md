# Self-Hosting Deployment Guide

This guide explains how to deploy Pro Beauty List on your own server and domain. The application is a single full-stack Node.js service that serves the compiled React client and the Express API from the same production process. PostgreSQL is required for persistent data, sessions, bookings, notifications, and professional profiles.

## Production requirements

| Requirement | Recommendation |
|---|---|
| Operating system | A current Linux server distribution such as Ubuntu LTS. |
| Runtime | Node.js 22 or newer. |
| Database | PostgreSQL 15 or newer. |
| Process manager | `systemd`, PM2, or another supervisor under your control. |
| Reverse proxy | Nginx, Caddy, Apache, or an equivalent HTTPS-terminating proxy. |
| Storage | A writable upload directory owned by the application user. |
| TLS | HTTPS certificates for your domain. |

React, Vite, Express, PostgreSQL, and Drizzle ORM are the major foundation technologies used by this app.[1] [2] [3] [4] [5]

## Environment variables

Copy `.env.example` to `.env` on the server and replace every placeholder. Do not commit production `.env` files.

| Variable | Required | Purpose |
|---|---:|---|
| `NODE_ENV` | Yes | Use `production` on the server. |
| `PORT` | Yes | Local port that the Node.js process listens on, normally behind a reverse proxy. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `SESSION_SECRET` | Yes | Long random secret used to sign server-side session cookies. Use at least 32 characters. |
| `APP_ORIGIN` | Yes | Public origin of your app, for example `https://yourdomain.com`. |
| `UPLOAD_DIR` | Yes | Local directory for uploaded profile and portfolio assets. |
| `MAX_UPLOAD_MB` | Yes | Maximum upload size in megabytes. |
| `ADMIN_EMAIL` | Only for bootstrap | Email for the initial admin bootstrap command. |
| `ADMIN_PASSWORD` | Only for bootstrap | One-time temporary bootstrap password for the initial admin account. Remove it from production after bootstrap. |

## First deployment

Install dependencies, apply the committed migrations, build the app, and create the first admin account. Run these commands from the project root after `.env` has been configured. Do not generate new migrations on the production server; migration generation is a development workflow only.

```bash
npm ci
npm run db:migrate
npm run build
npm run admin:create
npm run start
```

After the admin account exists, remove `ADMIN_PASSWORD` from the production environment if your deployment workflow does not require it. Keep `ADMIN_EMAIL` only if you intentionally want future bootstrap runs to update that account.

## Reverse proxy shape

The Node.js process serves both `/api/*` and the compiled client app. Your proxy should forward all application traffic to the configured local `PORT` and preserve standard forwarding headers.

A typical Nginx site block has this shape:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    client_max_body_size 8m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set `APP_ORIGIN` to the exact HTTPS origin used by clients. In production, session cookies are configured as secure cookies, so HTTPS must be active for normal login behavior.

## Production process example

A simple `systemd` unit can run the compiled server. Adjust user, paths, and environment-file location for your server.

```ini
[Unit]
Description=Pro Beauty List
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/var/www/probeautylist
EnvironmentFile=/var/www/probeautylist/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

After creating the unit, reload and enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable probeautylist
sudo systemctl start probeautylist
sudo systemctl status probeautylist
```

## Operational checklist

| Item | Check |
|---|---|
| Database | PostgreSQL exists, migrations have run, and the app user has only the permissions it needs. |
| Secrets | `SESSION_SECRET` is unique, long, private, and not committed. |
| Domain | DNS points to the server, and `APP_ORIGIN` matches the public HTTPS origin. |
| HTTPS | TLS is active before using production sessions. |
| Uploads | `UPLOAD_DIR` exists, is writable by the app process, and is included in backups. |
| Backups | PostgreSQL and uploaded files are backed up on a regular schedule. |
| Admin access | Initial admin account was created, login works, and the bootstrap password was removed from the environment. |
| Health check | `GET /api/health` returns a healthy response through the public domain. |

You can verify a running deployment with the built-in health probe:

```bash
APP_HEALTH_URL=https://yourdomain.com/api/health npm run smoke:health
```

## Updating the app

For a normal update, pull the latest code, install dependencies with the lockfile, run migrations, rebuild, and restart the process.

```bash
git pull
npm ci
npm run db:migrate
npm run build
sudo systemctl restart probeautylist
```

Run the quality checks before deploying updates whenever possible:

```bash
npm run verify
```

## References

[1]: https://react.dev/ "React Documentation"
[2]: https://vite.dev/ "Vite Documentation"
[3]: https://expressjs.com/ "Express Documentation"
[4]: https://www.postgresql.org/ "PostgreSQL"
[5]: https://orm.drizzle.team/ "Drizzle ORM"

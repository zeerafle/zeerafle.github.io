---
title: ActivityWatch on Arch Linux + Wayland (KDE Plasma)
---

When tracking time and productivity on a Wayland-based KDE environment, the default ActivityWatch configuration (`aw-qt`) often struggles with tray icon rendering and custom watcher initialization. This guide outlines a robust infrastructure approach, bypassing those GUI limitations by utilizing `systemd` user services to manage the highly performant `aw-server-rust` backend and the native Wayland watcher (`aw-awatcher`).

## 1. Installation

Instead of compiling the Rust server from source, we can leverage the pre-compiled binaries included in the standard AUR package, alongside the Wayland-specific watcher.

Install the necessary packages using your preferred AUR helper:

```bash
yay -S activitywatch-bin aw-awatcher
```

*Note: The `activitywatch-bin` package includes the default Python server, the web UI, and crucially, the compiled `aw-server-rust` binary tucked away in `/opt/activitywatch/aw-server-rust/`.*

## 2. Disable the Default Qt Interface

The `aw-qt` application attempts to manage the server and watchers but frequently fails to load non-default modules like `aw-awatcher` on startup.

First, ensure it is not running:

```bash
pkill aw-
```

Next, prevent it from autostarting. You can do this via KDE's **System Settings > Startup and Shutdown > Autostart**, or by overriding the desktop file:

```bash
cp /etc/xdg/autostart/aw-qt.desktop ~/.config/autostart/
echo "Hidden=true" >> ~/.config/autostart/aw-qt.desktop
```

## 3. Configuring Systemd Services

We will define two user-level systemd services to ensure the backend and watcher start reliably with the graphical session and automatically restart on failure.

### The Backend: aw-server-rust

Create the service file for the Rust server:

```bash
mkdir -p ~/.config/systemd/user
nano ~/.config/systemd/user/aw-server-rust.service
```

Add the following configuration. This points directly to the hidden Rust binary and explicitly links the static web assets provided by the Python server installation so the dashboard renders correctly:

```ini
[Unit]
Description=ActivityWatch Server (Rust)
After=graphical-session.target

[Service]
Type=simple
ExecStart=/opt/activitywatch/aw-server-rust/aw-server-rust --webpath /opt/activitywatch/aw-server/aw_server/static
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

### The Watcher: aw-awatcher

Create the service file for the Wayland watcher:

```bash
nano ~/.config/systemd/user/aw-awatcher.service
```

This configuration ensures the watcher binds to the graphical session and waits for the server to be available:

```ini
[Unit]
Description=ActivityWatch Wayland Watcher
After=aw-server-rust.service graphical-session.target
Wants=aw-server-rust.service
PartOf=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/bin/aw-awatcher
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

## 4. Enable and Start Services

Reload the systemd daemon to recognize the new files, then enable and start the services:

```bash
systemctl --user daemon-reload
systemctl --user enable --now aw-server-rust.service
systemctl --user enable --now aw-awatcher.service
```

Verify everything is running smoothly:

```bash
systemctl --user status aw-server-rust.service aw-awatcher.service
```

You can now access your ActivityWatch dashboard directly via your browser at **[http://localhost:5600](https://www.google.com/search?q=http://localhost:5600)**.

---

## 5. Troubleshooting Runbook

### Error 504: Poisoned Lock (Datastore Corruption)

If your system storage fills up entirely, the SQLite database may fail mid-transaction. This causes the internal Rust threads to panic, resulting in a `504: poisoned lock` error upon subsequent restarts.

**Recovery Steps:**

1. Stop the services immediately:
```bash
systemctl --user stop aw-server-rust.service aw-awatcher.service
```


2. Navigate to the datastore:
```bash
cd ~/.local/share/activitywatch/aw-server-rust/
```


3. Backup and isolate the corrupted database:
```bash
mv sqlite.db sqlite.db.corrupted
rm sqlite.db-wal sqlite.db-shm 2>/dev/null
```


4. Restart the services. The Rust server will automatically provision a fresh, healthy database:
```bash
systemctl --user start aw-server-rust.service aw-awatcher.service
```

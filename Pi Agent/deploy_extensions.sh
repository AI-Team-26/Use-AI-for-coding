#!/usr/bin/env bash
# Refresh ~/.pi/agent/extensions from the repo so the running Pi agent loads the
# same extension files as for_docker_volume/extensions (top-level *.ts, _shared/
# and todo-task/). The folder is a mirror: files removed in the repo are removed
# here too. node_modules and WIP/ are never shipped; Pi resolves the shared
# @earendil-works/pi-coding-agent types from its own installation.
#
# containers_setup.sh does the same copy for the docker volumes; this script is
# for the host installation. Restart Pi (or /reload) after running it.

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
src="$script_dir/for_docker_volume/extensions"
dest="$HOME/.pi/agent/extensions"

mkdir -p "$dest"
rm -f "$dest"/*.ts
rm -rf "$dest/_shared" "$dest/todo-task"

cp "$src"/*.ts "$dest/"
cp -r "$src/_shared" "$dest/"
cp -r "$src/todo-task" "$dest/"

echo "✔️  Extensions deployed to $dest"

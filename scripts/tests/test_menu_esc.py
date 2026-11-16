#!/usr/bin/env python3
"""PTY tests for the ESC support of the project/action menu (start_common.sh).

Run: python3 scripts/tests/test_menu_esc.py
Needs bash, python3 and the /scripts folder of the agent container
(git_common.sh and utils.sh are sourced from there by start_common.sh).
"""

import os
import pathlib
import pty
import re
import select
import subprocess
import sys
import tempfile
import time

REPO = pathlib.Path(__file__).resolve().parents[2]
ESC = b"\x1b"
MAIN_PROMPT = "Select a project/action:"
DELETE_PROMPT = "Select the project to delete:"

DRIVER = """
export GITHUB_AGENT_ACCOUNT=${GITHUB_AGENT_ACCOUNT:-test-agent}
export GITHUB_COMMIT_EMAIL=${GITHUB_COMMIT_EMAIL:-test@example.com}
source "%(repo)s/scripts/start_common.sh"
project_folder="%(tmp)s/projects"
start_project() { echo "STARTED:$1"; }
clone_repo() { echo "CLONE_CALLED"; }
create_new_proj() { echo "CREATE_CALLED"; }
manage_git_credentials() { echo "CREDS_CALLED"; }
rc=0
select_project || rc=$?
echo "SELECT_RETURNED:$rc"
"""


class Session:
    def __init__(self, project_names):
        self.tmp = tempfile.mkdtemp(prefix="menu_esc_test_")
        projects = pathlib.Path(self.tmp) / "projects"
        projects.mkdir()
        for name in project_names:
            (projects / name).mkdir()
        driver = pathlib.Path(self.tmp) / "driver.sh"
        driver.write_text(DRIVER % {"repo": REPO, "tmp": self.tmp})
        master, slave = pty.openpty()
        self.master = master
        self.proc = subprocess.Popen(
            ["bash", str(driver)],
            stdin=slave, stdout=slave, stderr=slave,
            env={**os.environ, "TERM": "xterm"},
        )
        os.close(slave)
        self.buf = b""

    def read_until(self, text, timeout=5.0, count=1):
        end = time.time() + timeout
        while time.time() < end:
            if self.buf.count(text.encode()) >= count:
                return
            r, _, _ = select.select([self.master], [], [], 0.2)
            if r:
                try:
                    data = os.read(self.master, 4096)
                except OSError:
                    break
                if not data:
                    break
                self.buf += data
        raise AssertionError(
            f"timeout waiting for {text!r} (x{count}); output:\n"
            + self.buf.decode(errors="replace")
        )

    def send(self, data):
        os.write(self.master, data)

    def menu_numbers(self):
        # number -> label, from the last menu printed
        pairs = re.findall(rb"(\d+)\) ([^\r\n]+)", self.buf)
        return {label.decode(): int(num) for num, label in pairs}

    def wait(self, timeout=5.0):
        self.proc.wait(timeout=timeout)
        return self.proc.returncode

    def close(self):
        if self.proc.poll() is None:
            self.proc.kill()
            self.proc.wait()
        try:
            os.close(self.master)
        except OSError:
            pass


def check(name, fn):
    try:
        fn()
    except Exception as e:
        print(f"FAIL {name}: {e}")
        return False
    print(f"PASS {name}")
    return True


def test_esc_exits():
    s = Session(["alpha", "beta"])
    try:
        s.read_until(MAIN_PROMPT)
        s.send(ESC)
        s.read_until("SELECT_RETURNED:0")
        assert s.wait() == 0
    finally:
        s.close()


def test_invalid_then_esc():
    s = Session(["alpha"])
    try:
        s.read_until(MAIN_PROMPT)
        s.send(b"99\n")
        s.read_until("Invalid selection. Retry.")
        s.read_until(MAIN_PROMPT, count=2)
        s.send(ESC)
        s.read_until("SELECT_RETURNED:0")
    finally:
        s.close()


def test_empty_line_redraws_menu():
    s = Session(["alpha"])
    try:
        s.read_until(MAIN_PROMPT)
        s.send(b"\n")
        s.read_until(MAIN_PROMPT, count=2)
        s.send(ESC)
        s.read_until("SELECT_RETURNED:0")
    finally:
        s.close()


def test_exit_by_number():
    s = Session(["alpha", "beta"])
    try:
        s.read_until(MAIN_PROMPT)
        s.send(str(s.menu_numbers()["❌ Exit"]).encode() + b"\n")
        s.read_until("SELECT_RETURNED:0")
    finally:
        s.close()


def test_open_project_by_number():
    s = Session(["alpha", "beta"])
    try:
        s.read_until(MAIN_PROMPT)
        number = next(n for label, n in s.menu_numbers().items() if label in ("alpha", "beta"))
        s.send(str(number).encode() + b"\n")
        s.read_until("STARTED:")
        s.read_until(MAIN_PROMPT, count=2)
        s.send(ESC)
        s.read_until("SELECT_RETURNED:0")
    finally:
        s.close()


def test_delete_menu_esc_returns_to_main():
    s = Session(["alpha"])
    try:
        s.read_until(MAIN_PROMPT)
        s.send(str(s.menu_numbers()["🗑️ Delete a project"]).encode() + b"\n")
        s.read_until(DELETE_PROMPT)
        s.send(ESC)
        s.read_until(MAIN_PROMPT, count=2)
        assert (pathlib.Path(s.tmp) / "projects" / "alpha").is_dir()
        s.send(ESC)
        s.read_until("SELECT_RETURNED:0")
    finally:
        s.close()


def test_delete_project_by_number():
    s = Session(["alpha", "beta"])
    try:
        s.read_until(MAIN_PROMPT)
        s.send(str(s.menu_numbers()["🗑️ Delete a project"]).encode() + b"\n")
        s.read_until(DELETE_PROMPT)
        number = next(n for label, n in s.menu_numbers().items() if label in ("alpha", "beta"))
        target = "alpha" if s.menu_numbers().get("alpha") == number else "beta"
        s.send(str(number).encode() + b"\n")
        s.read_until("deleted.")
        assert not (pathlib.Path(s.tmp) / "projects" / target).exists()
        s.read_until(MAIN_PROMPT, count=2)
        s.send(ESC)
        s.read_until("SELECT_RETURNED:0")
    finally:
        s.close()


def test_arrow_key_is_ignored():
    s = Session(["alpha"])
    try:
        s.read_until(MAIN_PROMPT)
        s.send(b"\x1b[A")  # arrow up: starts with ESC but must not cancel
        time.sleep(0.2)
        s.send(ESC)
        s.read_until("SELECT_RETURNED:0")
    finally:
        s.close()


def test_eof_exits_cleanly():
    s = Session(["alpha"])
    try:
        s.read_until(MAIN_PROMPT)
        os.close(s.master)
        assert s.wait() == 1
    finally:
        if s.proc.poll() is None:
            s.close()


def main():
    tests = [
        ("esc_exits", test_esc_exits),
        ("invalid_then_esc", test_invalid_then_esc),
        ("empty_line_redraws_menu", test_empty_line_redraws_menu),
        ("exit_by_number", test_exit_by_number),
        ("open_project_by_number", test_open_project_by_number),
        ("delete_menu_esc_returns_to_main", test_delete_menu_esc_returns_to_main),
        ("delete_project_by_number", test_delete_project_by_number),
        ("arrow_key_is_ignored", test_arrow_key_is_ignored),
        ("eof_exits_cleanly", test_eof_exits_cleanly),
    ]
    ok = all([check(name, fn) for name, fn in tests])
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()

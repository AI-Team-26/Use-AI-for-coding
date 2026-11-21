#!/usr/bin/env python3
"""Pty tests for read_input (scripts/utils.sh) and the credential prompts
in scripts/git_common.sh.

Checks: normal typing, empty Enter (one newline, not two), ESC cancel,
arrow keys drained without cancelling, leading backslash kept, Ctrl-D as
first key ends input, closed input, hidden mode (no echo), and ESC at the
credential prompts (setup_git_global keeps defaults, credentials menu
Add/Remove cancel back to the menu without touching the PAT file).

Run: python3 scripts/tests/test_read_input.py
The git_common.sh tests need the container layout (/scripts/utils.sh)
and are skipped elsewhere.
"""

import os
import pty
import select
import subprocess
import sys
import tempfile
import time

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UTILS = os.path.join(REPO, "scripts", "utils.sh")
GIT_COMMON = os.path.join(REPO, "scripts", "git_common.sh")

RESULTS = []


def run_pty(script, sends, env=None):
    """Run bash -c script under a pty. sends is a list of (delay, bytes).
    Returns (exit_code, output_text)."""
    master, slave = pty.openpty()
    proc = subprocess.Popen(
        ["bash", "-c", script],
        stdin=slave, stdout=slave, stderr=slave,
        env=env or dict(os.environ), close_fds=True,
    )
    os.close(slave)
    output = b""
    deadline = time.time() + 15
    for delay, data in sends:
        time.sleep(delay)
        os.write(master, data)
    while time.time() < deadline:
        ready, _, _ = select.select([master], [], [], 0.2)
        if ready:
            try:
                chunk = os.read(master, 4096)
            except OSError:
                break
            if not chunk:
                break
            output += chunk
        elif proc.poll() is not None:
            break
    try:
        proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
    os.close(master)
    return proc.returncode, output.decode(errors="replace")


def check(name, ok, detail=""):
    RESULTS.append((name, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"  [{detail}]" if not ok and detail else ""))


READ_SNIPPET = f'source "{UTILS}"; read_input "P: "{{hidden}}; rc=$?; printf "RC=%d INPUT=[%s]\\n" "$rc" "$INPUT"'


def read_input_case(hidden=False):
    return READ_SNIPPET.format(hidden=" hidden" if hidden else "")


def test_read_input():
    # Two writes: the first char is read with echo off and echoed manually,
    # the tail arrives after echo is back on (like real typing, not a paste).
    rc, out = run_pty(read_input_case(), [(0.3, b"h"), (0.1, b"ello\n")])
    before = out.split("RC=")[0]
    check("normal typing", "RC=0 INPUT=[hello]" in out and before.count("hello") == 1, out)

    rc, out = run_pty(read_input_case(), [(0.3, b"\n")])
    check("empty Enter: rc 0, one newline", "RC=0 INPUT=[]" in out and "P: \r\n\r\n" not in out, out)

    rc, out = run_pty(read_input_case(), [(0.3, b"\x1b")])
    check("ESC cancels (rc 2)", "RC=2" in out, out)

    # The drain window is 50 ms; text sent later is kept (human typing speed).
    rc, out = run_pty(read_input_case(), [(0.3, b"\x1b[A"), (0.1, b"hello\n")])
    check("arrow key drained, text kept", "RC=0 INPUT=[hello]" in out, out)

    rc, out = run_pty(read_input_case(), [(0.3, b"\\path\n")])
    check("leading backslash kept", "RC=0 INPUT=[\\path]" in out, out)

    rc, out = run_pty(read_input_case(), [(0.3, b"\x04")])
    check("Ctrl-D first key: rc 1", "RC=1" in out, out)

    proc = subprocess.run(
        ["bash", "-c", read_input_case()],
        stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=10,
    )
    check("closed input: rc 1", "RC=1" in proc.stdout, proc.stdout)

    rc, out = run_pty(read_input_case(hidden=True), [(0.3, b"secret\n")])
    before = out.split("RC=")[0]
    check("hidden: value read, not echoed", "RC=0 INPUT=[secret]" in out and "secret" not in before, out)

    rc, out = run_pty(read_input_case(hidden=True), [(0.3, b"\x1b")])
    check("hidden: ESC cancels (rc 2)", "RC=2" in out, out)

    rc, out = run_pty(read_input_case(hidden=True), [(0.3, b"\n")])
    check("hidden: empty Enter", "RC=0 INPUT=[]" in out, out)


def test_git_common():
    if not os.path.exists("/scripts/utils.sh"):
        print("SKIP  git_common.sh tests (no /scripts/utils.sh outside the container)")
        return

    # git_common.sh sources /scripts/utils.sh (deployed copy); sourcing the repo
    # utils.sh first keeps the read_input under test in scope.
    source_both = f'source "{UTILS}"; source "{GIT_COMMON}"; '
    env = dict(os.environ, GITHUB_AGENT_ACCOUNT="test-agent", GITHUB_COMMIT_EMAIL="test@example.com")

    with tempfile.NamedTemporaryFile(suffix=".gitconfig", delete=False) as cfg:
        cfg_path = cfg.name
    try:
        env["GIT_CONFIG_GLOBAL"] = cfg_path
        script = source_both + 'setup_git_global "DefaultName"; git config --global user.name; git config --global user.email'
        rc, out = run_pty(script, [(0.3, b"\x1b"), (0.3, b"\x1b")], env)
        check(
            "setup_git_global: ESC keeps defaults",
            out.count("(cancelled, using default)") == 2 and "DefaultName" in out and "test@example.com" in out,
            out,
        )
    finally:
        os.unlink(cfg_path)

    pat_file = "/scripts/github_pat"
    before = open(pat_file, "rb").read() if os.path.exists(pat_file) else None

    # Credentials menu: 2 = Add, ESC at the account prompt, 4 = Exit.
    rc, out = run_pty(source_both + "manage_git_credentials", [(0.3, b"2\n"), (0.3, b"\x1b"), (0.3, b"4\n")], env)
    check("credentials Add: ESC back to menu", "(cancelled)" in out and rc == 0, out)

    # 3 = Remove, ESC at the number prompt, 4 = Exit.
    rc, out = run_pty(source_both + "manage_git_credentials", [(0.3, b"3\n"), (0.3, b"\x1b"), (0.3, b"4\n")], env)
    check("credentials Remove: ESC back to menu", "(cancelled)" in out and rc == 0, out)

    after = open(pat_file, "rb").read() if os.path.exists(pat_file) else None
    check("PAT file untouched", before == after)


def main():
    test_read_input()
    test_git_common()
    failed = [name for name, ok in RESULTS if not ok]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} checks passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()

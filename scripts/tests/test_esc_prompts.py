"""Checks that ESC cancels the free-text prompts in start_common.sh.

Extracts read_menu_input, clone_repo and create_new_proj from the script,
stubs the GitHub/tool calls, and drives the prompts through a pseudo-terminal.
Verifies: ESC cancels at each prompt, empty URL/name cancels, normal input
still reaches the clone/creation flow, and arrow keys are not a cancel.

Run: python3 scripts/tests/test_esc_prompts.py
"""
import os
import pty
import re
import select
import signal
import sys
import tempfile
import time

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "start_common.sh")
text = open(SRC).read()


def extract(name):
    m = re.search(rf"^{name}\(\) \{{.*?^\}}", text, re.S | re.M)
    assert m, f"function {name} not found in {SRC}"
    return m.group(0)


workdir = tempfile.mkdtemp(prefix="esc_prompts_test_")
projects = os.path.join(workdir, "projects")
harness = os.path.join(workdir, "harness.sh")
with open(harness, "w") as f:
    f.write("set -euo pipefail\n")
    f.write("RED=''; GREEN=''; YELLOW=''; NC=''; WARNING_EMOJI='!'\n")
    f.write(f"project_folder={projects}\n")
    f.write('mkdir -p "$project_folder"\n')
    f.write("MENU_REPLY=''\n")
    f.write(extract("read_menu_input") + "\n")
    f.write(extract("clone_repo") + "\n")
    f.write(extract("create_new_proj") + "\n")
    # stubs for everything past the prompts
    f.write('set_github_auth_for_repo_or_agent() { echo "AUTH $1"; return 1; }\n')
    f.write('start_project() { echo "START $1"; }\n')
    f.write("pi() { echo 'PI LAUNCHED'; }\n")
    f.write('rc=0; "$1" || rc=$?\n')
    f.write('echo "RC=$rc"\n')


def run(fn, keys, delay=0.15):
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp("bash", ["bash", harness, fn])
    out = b""
    for k in keys:
        time.sleep(delay)
        os.write(fd, k)
    deadline = time.time() + 5
    while time.time() < deadline:
        r, _, _ = select.select([fd], [], [], 0.3)
        if not r:
            done, status = os.waitpid(pid, os.WNOHANG)
            if done:
                os.close(fd)
                return out.decode(errors="replace"), os.waitstatus_to_exitcode(status)
            continue
        try:
            chunk = os.read(fd, 4096)
        except OSError:
            break
        if not chunk:
            break
        out += chunk
    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    os.close(fd)
    _, status = os.waitpid(pid, 0)
    return out.decode(errors="replace"), os.waitstatus_to_exitcode(status)


fails = 0


def check(label, cond, out):
    global fails
    print(("PASS" if cond else "FAIL"), label)
    if not cond:
        fails += 1
        print("---- output ----\n" + out + "\n----------------")


ESC = b"\x1b"
NL = b"\n"

out, _ = run("clone_repo", [ESC])
check("clone_repo: ESC at URL prompt cancels", "(cancelled)" in out and "RC=0" in out and "AUTH" not in out, out)

out, _ = run("clone_repo", [NL])
check("clone_repo: empty URL cancels", "(cancelled)" in out and "RC=0" in out and "AUTH" not in out, out)

out, _ = run("clone_repo", [b"https://github.com/a/b.git" + NL, ESC])
check("clone_repo: ESC at dir prompt cancels", "(cancelled)" in out and "RC=0" in out and "AUTH" not in out, out)

out, _ = run("clone_repo", [b"https://github.com/a/b.git" + NL, NL])
check("clone_repo: normal input reaches auth with default dir", "AUTH https://github.com/a/b.git" in out and "RC=1" in out, out)

out, _ = run("clone_repo", [b"https://github.com/a/b.git" + NL, b"mydir" + NL])
check("clone_repo: custom dir accepted", "AUTH" in out, out)

out, _ = run("clone_repo", [b"\x1b[A", b"https://github.com/a/b.git" + NL, NL])
check("clone_repo: arrow key ignored, not a cancel", "(cancelled)" not in out and "AUTH" in out, out)

out, _ = run("create_new_proj", [ESC])
check("create_new_proj: ESC cancels", "(cancelled)" in out and "RC=0" in out and "PI LAUNCHED" not in out, out)

out, _ = run("create_new_proj", [NL])
check("create_new_proj: empty name cancels", "(cancelled)" in out and "RC=0" in out, out)

out, _ = run("create_new_proj", [b"testproj" + NL])
check("create_new_proj: name accepted, pi launched", "PI LAUNCHED" in out and "RC=0" in out, out)

sys.exit(1 if fails else 0)

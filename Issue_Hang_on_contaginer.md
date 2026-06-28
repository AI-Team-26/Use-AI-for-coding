# 🚨 Issue: Pi Terminal Freeze & Unresponsive Container

** SOLVED switching to WSL for Docker, instead of Hyper-V **  

2026.06.27  
Fron today I will test it for some weeks and this file can be deleted after the confirmationn that the problem is solved.  

#### Symptoms
* The interactive container terminal hangs with a blinking cursor. It accepts text input but provides no prompt or output.
or 
* The user can write the prompt but nothing happens when send it (press ENTER)

Test: Running `docker exec -it <container> /bin/bash` works for internal commands (like `ps` or `echo`), but running `ls` or accessing the shared project directory freezes that new terminal session instantly.

#### Root Cause: Bind Mount Break
The issue is a **hard breakdown of the filesystem bridge (9p protocol)** between the Windows host and the WSL2/Docker Linux VM. This typically occurs when:
1. Windows enters a low-power state, sleep, or Modern Standby (`S0`).
2. The WSL2 backend runs idle RAM/disk compaction after hours of inactivity, dropping the virtual connection to the host.

When this bridge breaks, any process trying to read or write to the shared host folder (`/projects`) is forced into a **`D` state (Uninterruptible Sleep)**. Because the process is trapped at the kernel level waiting for Windows disk I/O that will never respond, **it cannot be killed (even with `kill -9`) or bypassed from inside the container.**

#### Recovery Procedure
This cannot be resolved from inside the container. You must reset it from the Windows host:

**Forcefully restart the container:**
 ```bash
docker restart -t 0 <container_name>
```

If Docker hangs (common): Force-close the entire WSL backend via an Administrator PowerShell, then restart Docker Desktop:

```powershell
wsl --shutdown
```
**You need to restart Docker Desktop.**


#### Prevent/Avoid hang up

The issue can be prevented (probably) avoiding the disk to go in low-power mode (sort of "sleep") and actually cause the bind mount break.  
Avoiding the "sleep mode" is possible with a keep-alive scritpt, but is not a nice thing if the PC is left unattended for hours or for the full night.  

Another approach is to check the state and restart it when need to start a session:
```bash
container_id=$(echo -e "$opt" | awk -F'[()]' '{print $2}')              

# Check if the container is running and if its mount is frozen
echo -e "Checking container health: $container_id..."
if docker ps --format '{{.ID}}' | grep -q "$container_id"; then
    # If 'ls /projects' takes longer than 2 seconds, it's frozen
    if ! timeout 2 docker exec "$container_id" ls /projects >/dev/null 2>&1; then
        echo -e "\n⚠️ ${RED}Mount frozen! Running automated recovery...${NC}"
        
        # 1. Force kill Docker Desktop interface
        echo -e "🛑 Closing Docker Desktop..."
        #taskkill.exe //F //IM "Docker Desktop.exe" >/dev/null 2>&1
        # close the user 
        powershell.exe -Command "Stop-Process -Name 'Docker Desktop', 'com.docker.backend' -Force -ErrorAction SilentlyContinue"
        
        # 2. Force shutdown the WSL backend
        echo -e "💀 Shutting down WSL..."
        wsl.exe --shutdown
        
        # 3. Relaunch Docker Desktop
        echo -e "🔄 Relaunching Docker Desktop..."
        cmd.exe /c start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        
        sleep 5                        

        # Wait dynamically for the Docker daemon to be fully ready
        echo -n "⏳ Waiting for Docker engine to start up..."
        until docker info >/dev/null 2>&1; do
            echo -n "."
            sleep 2
        done
        echo -e "\n✅ Docker is back online!"
    fi
fi
echo -e "Starting and attaching to container: $container_id \n\n"
```

/**
 * Boot Sequence Module
 * Simulates a system startup log
 */

export async function runBootSequence() {
    const overlay = document.getElementById('boot-overlay');
    if (!overlay) return;

    try {
        // Clear initial content
        overlay.innerHTML = '';
        
        // ... (existing logic) ...
        // Real Data Extraction
        const cores = navigator.hardwareConcurrency || 'Unknown';
        const mem = navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Protected';
        const platform = navigator.platform || 'Unknown OS';
        const ua = navigator.userAgent;
        const connection = navigator.connection ? navigator.connection.effectiveType.toUpperCase() : 'ETH0';
        const host = window.location.hostname;
        
        const logs = [
            `Initializing System: ${platform.toUpperCase()}...`,
            `[ OK ] CPU: ${cores} Logical Cores Detected`,
            `[ OK ] Memory: ${mem} Available`,
            `Loading User Agent: ${ua.substring(0, 40)}...`,
            "Mounting DOM Environment...",
            "[ OK ] LocalStorage: ACCESSIBLE",
            "Loading Network Stack...",
            `  - Connection: ${connection}`,
            `  - Downlink: ${navigator.connection ? navigator.connection.downlink + 'Mbps' : 'Unknown'}`,
            `Establishing secure connection to ${host}...`,
            "Handshake: [SYN] -> [SYN, ACK] -> [ACK]",
            "Decrypting payload...",
            "ACCESS GRANTED.",
            "Starting analysis daemon..."
        ];

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        
        // Create a cursor element
        const cursor = document.createElement('span');
        cursor.className = 'boot-cursor';
        cursor.innerHTML = '&#9608;'; // Block character
        overlay.appendChild(cursor);

        for (const log of logs) {
            // Create line container
            const p = document.createElement('div');
            p.className = 'boot-line';
            
            // Timestamp like dmesg [ 0.123456]
            const time = (performance.now() / 1000).toFixed(6);
            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'boot-timestamp';
            timestampSpan.textContent = `[ ${time.padStart(9, ' ')} ] `;
            
            const textSpan = document.createElement('span');
            textSpan.textContent = log;
            
            p.appendChild(timestampSpan);
            p.appendChild(textSpan);
            
            // Insert before cursor
            overlay.insertBefore(p, cursor);
            
            // Scroll to bottom
            overlay.scrollTop = overlay.scrollHeight;

            // Variable delay based on content complexity
            let delay = Math.random() * 100 + 50; 
            if (log.includes("...")) delay += 200;
            if (log.includes("Decrypting")) delay += 600;
            
            await sleep(delay);
        }

        await sleep(400);
        
        // Quick flash or hard cut? Hacker style usually hard cut or clear.
        // Let's do a "Clear Screen" simulation
        const clearCmd = document.createElement('div');
        clearCmd.className = 'boot-line';
        clearCmd.textContent = "$ clear";
        overlay.insertBefore(clearCmd, cursor);
        
        await sleep(300);

    } catch (e) {
        console.error("Boot sequence failed:", e);
    } finally {
        // Hard cut removal - ensure it happens
        overlay.style.display = 'none';
        // Cleanup content to free DOM
        overlay.innerHTML = '';
    }
}

/**
 * Advanced AdBlock Detection Module
 * 
 * Implements a multi-vector detection engine using the AdBlockDetector class.
 * Vectors:
 * 1. Network: Checks if requests to ad-related URLs are blocked.
 * 2. Execution: Checks if ad-related scripts are prevented from running.
 * 3. DOM: Checks if elements with ad-related classes are hidden (Cosmetic).
 * 4. Layout: Checks if ad-sized iframes are collapsed.
 */

class AdBlockDetector {
    constructor() {
        this.results = {
            network: false,
            execution: false,
            dom: false,
            layout: false
        };
        this.baitClasses = 'adsbox banner-ad pub_300x250 sponsored-text text-ad-links ad-rect';
        this.baitUrl = '/js/ads.js';
    }

    /**
     * Vector 1: Network Check
     * Tries to fetch a known ad-related URL.
     */
    async checkNetwork() {
        try {
            const req = new Request(this.baitUrl, { method: 'HEAD' });
            await fetch(req);
            this.results.network = false; // Success = No Block
        } catch (e) {
            this.results.network = true; // Failed = Blocked
        }
    }

    /**
     * Vector 2: Execution Check
     * Injects a script tag and checks if it runs.
     */
    async checkExecution() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = this.baitUrl;
            script.onload = () => {
                // Even if it loads, check if the code actually ran (flag set)
                this.results.execution = !window.ad_script_loaded;
                script.remove();
                resolve();
            };
            script.onerror = () => {
                this.results.execution = true; // Failed to load
                script.remove();
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Vector 3: DOM / Cosmetic Check
     * Checks if elements with specific classes are hidden.
     */
    checkDom() {
        const bait = document.createElement('div');
        bait.className = this.baitClasses;
        bait.style.position = 'absolute';
        bait.style.top = '-1000px';
        bait.style.left = '-1000px';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);

        // Force layout
        const blocked = (
            bait.offsetParent === null || 
            bait.offsetHeight === 0 || 
            bait.timeLeft === 0 ||
            getComputedStyle(bait).display === 'none' ||
            getComputedStyle(bait).visibility === 'hidden'
        );

        this.results.dom = blocked;
        document.body.removeChild(bait);
    }

    /**
     * Vector 4: Layout / Iframe Check
     * Checks if an iframe with ad dimensions is collapsed.
     */
    async checkLayout() {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.src = "about:blank";
            iframe.width = "300";
            iframe.height = "250";
            iframe.style.position = 'absolute';
            iframe.style.top = '-1000px';
            iframe.className = "ads-iframe"; // Generic bad class
            
            document.body.appendChild(iframe);

            setTimeout(() => {
                const style = window.getComputedStyle(iframe);
                if (style.display === 'none' || style.visibility === 'hidden' || iframe.offsetHeight === 0) {
                    this.results.layout = true;
                }
                document.body.removeChild(iframe);
                resolve();
            }, 50);
        });
    }

    async run() {
        // Run all checks in parallel
        await Promise.all([
            this.checkNetwork(),
            this.checkExecution(),
            new Promise(r => { this.checkDom(); r(); }),
            this.checkLayout()
        ]);

        return this.results;
    }
}

/**
 * Main export function called by the app
 */
export async function detectExtensions() {
    const detector = new AdBlockDetector();
    const results = await detector.run();

    const isBlocked = Object.values(results).some(val => val === true);
    let methods = [];

    if (results.network) methods.push('Network Filter');
    if (results.execution) methods.push('Script Block');
    if (results.dom) methods.push('Cosmetic Filter');
    if (results.layout) methods.push('Layout/Frame Block');

    const resultData = {
        'Ad Blocker': { 
            value: isBlocked ? 'Detected' : 'Not Detected', 
            warning: !isBlocked 
        },
        'Status': { 
            value: isBlocked ? 'Protection Active' : 'Vulnerable to Tracking', 
            warning: !isBlocked 
        }
    };

    if (isBlocked) {
        resultData['Detection Method'] = {
            value: methods.join(' & '),
            warning: false
        };
        // Add a "Senior" insight
        resultData['Confidence Score'] = {
            value: `${methods.length}/4 Vectors Triggered`,
            warning: false
        };
    }

    return resultData;
}


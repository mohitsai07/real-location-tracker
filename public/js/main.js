// main.js - handles Socket.IO, Geolocation, and Leaflet markers
(function(){
  console.log('Starting location tracker...');
  const socket = io();
  
  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  // device identification
  const deviceName = prompt('Enter a name for this device (for display):','Device-'+Math.floor(Math.random()*9000+1000)) || ('Device-'+Date.now());
  const deviceId = 'dev-' + Math.random().toString(36).slice(2,9);

  // expose socket.io client file path (served statically by server)
  // register this device
  socket.emit('register', { deviceId, name: deviceName, ua: navigator.userAgent });

  // map setup
  console.log('Initializing map...');
  const map = L.map('map').setView([20.5937,78.9629], 5); // India center default
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);
  console.log('Map initialized successfully');

  const markers = {}; // key: deviceId -> marker
  const activityLog = []; // Store recent activities
  const alerts = []; // Store alerts

  function updateDeviceList(devs){
    const ul = document.getElementById('deviceList');
    ul.innerHTML = '';
    devs.forEach(d => {
      const li = document.createElement('li');
      li.textContent = (d.name || d.deviceId) + ' (' + (d.ua?d.ua.split(' ')[0]:'unknown') + ')';
      li.onclick = () => {
        // focus map on this device if marker exists
        for (let k in markers){
          if(markers[k].options.deviceId === d.deviceId){
            map.setView(markers[k].getLatLng(), 14);
          }
        }
      };
      ul.appendChild(li);
    });
  }

  // Function to get place name from coordinates (reverse geocoding)
  async function getPlaceName(lat, lng) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data && data.display_name) {
        // Extract city/town name from the full address
        const parts = data.display_name.split(',');
        return parts[0] || 'Unknown Location';
      }
      return 'Unknown Location';
    } catch (error) {
      console.log('Error getting place name:', error);
      return 'Unknown Location';
    }
  }

  // Function to create enhanced popup content
  async function createPopupContent(data) {
    const placeName = await getPlaceName(data.lat, data.lng);
    const batteryLevel = data.battery || Math.floor(Math.random() * 100); // Random battery if not provided
    const isCharging = data.charging || Math.random() > 0.5; // Random charging status if not provided
    const platform = data.platform || 'Unknown';
    const connection = data.connection || 'unknown';
    
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; min-width: 280px; background: linear-gradient(135deg, #1a1a2e, #16213e); color: #e8f4fd; padding: 16px; border-radius: 10px; border: 1px solid #4a9eff; box-shadow: 0 6px 20px rgba(0,0,0,0.3);">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #4a9eff, #66bb6a); margin-right: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; border-radius: 50%; font-weight: 600;">📱</div>
          <div style="font-size: 16px; font-weight: 700; color: #4a9eff; text-shadow: 0 0 8px rgba(74,158,255,0.4); text-transform: uppercase; letter-spacing: 0.5px;">${data.name || data.deviceId}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 13px; margin-bottom: 8px; font-weight: 600; color: #e8f4fd;">
              <strong style="color: #4a9eff;">Battery:</strong> ${batteryLevel}% ${isCharging ? '⚡' : '🔋'}
            </div>
            <div style="font-size: 13px; font-weight: 600; color: #e8f4fd;">
              <strong style="color: #4a9eff;">Accuracy:</strong> ${(data.accuracy || 0).toFixed(2)}m
            </div>
          </div>
          <div>
            <div style="font-size: 13px; margin-bottom: 8px; font-weight: 600; color: #e8f4fd;">
              <strong style="color: #4a9eff;">Connection:</strong> ${connection}
            </div>
            <div style="font-size: 13px; font-weight: 600; color: #e8f4fd;">
              <strong style="color: #4a9eff;">Platform:</strong> ${platform}
            </div>
          </div>
        </div>
        
        <div style="border-top: 1px solid #4a9eff; padding-top: 12px; background: rgba(74,158,255,0.05); border-radius: 6px; padding: 12px;">
          <div style="font-size: 14px; margin-bottom: 8px; font-weight: 700; color: #4a9eff; text-shadow: 0 0 5px rgba(74,158,255,0.3);">
            <strong>📍 ${placeName}</strong>
          </div>
          <div style="font-size: 12px; color: #b0bec5; font-weight: 500;">
            <strong style="color: #4a9eff;">Lat:</strong> ${data.lat.toFixed(6)}, <strong style="color: #4a9eff;">Lng:</strong> ${data.lng.toFixed(6)}
          </div>
        </div>
      </div>
    `;
  }

  // handle incoming locations
  socket.on('location', async (data) => {
    // data: { deviceId, lat, lng, accuracy, socketId }
    const id = data.deviceId || data.socketId;
    if(!id) return;
    if(!markers[id]){
      const m = L.marker([data.lat, data.lng], { title: data.name || id, deviceId: id });
      m.addTo(map);
      const popupContent = await createPopupContent(data);
      m.bindPopup(popupContent);
      markers[id] = m;
    } else {
      markers[id].setLatLng([data.lat, data.lng]);
      const popupContent = await createPopupContent(data);
      markers[id].setPopupContent(popupContent);
    }
    
    // Update device health for current device
    if (id === deviceId) {
      updateDeviceHealth(data);
      addActivity(`Location updated: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
    }
  });

  socket.on('devices', updateDeviceList);

  // Status & Alerts System
  function updateDeviceHealth(data) {
    const batteryLevel = document.getElementById('batteryLevel');
    const signalStrength = document.getElementById('signalStrength');
    const lastUpdate = document.getElementById('lastUpdate');
    
    if (batteryLevel) batteryLevel.textContent = `${data.battery || '--'}%`;
    if (signalStrength) signalStrength.textContent = data.connection || '--';
    if (lastUpdate) lastUpdate.textContent = new Date().toLocaleTimeString();
  }

  function addActivity(message) {
    activityLog.unshift({
      message: message,
      time: new Date()
    });
    
    // Keep only last 10 activities
    if (activityLog.length > 10) {
      activityLog.pop();
    }
    
    updateActivityList();
  }

  function updateActivityList() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    activityList.innerHTML = '';
    activityLog.forEach(activity => {
      const div = document.createElement('div');
      div.className = 'activity-item';
      div.innerHTML = `${activity.message} <span style="color: #999; font-size: 10px;">${activity.time.toLocaleTimeString()}</span>`;
      activityList.appendChild(div);
    });
  }

  function addAlert(message, type = 'info') {
    alerts.unshift({
      message: message,
      type: type,
      time: new Date()
    });
    
    // Keep only last 5 alerts
    if (alerts.length > 5) {
      alerts.pop();
    }
    
    updateAlertsList();
  }

  function updateAlertsList() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    
    alertsList.innerHTML = '';
    alerts.forEach(alert => {
      const div = document.createElement('div');
      div.className = 'alert-item';
      div.innerHTML = `${alert.message} <span style="color: #999; font-size: 10px;">${alert.time.toLocaleTimeString()}</span>`;
      alertsList.appendChild(div);
    });
  }

  // Status buttons functionality
  function setupStatusButtons() {
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        statusButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        const status = btn.dataset.status;
        const statusMessages = {
          safe: '✅ Status: Safe and secure',
          help: '🆘 Status: Need help immediately',
          delayed: '⏰ Status: Running late',
          arrived: '🏁 Status: Arrived at destination'
        };
        
        addActivity(statusMessages[status]);
        addAlert(statusMessages[status], status === 'help' ? 'danger' : 'info');
        
        // Send status to server
        socket.emit('status', { deviceId, name: deviceName, status: status, message: statusMessages[status] });
      });
    });
  }

  // Share location functionality
  function setupShareLocation() {
    const shareBtn = document.getElementById('shareBtn');
    const shareStatus = document.getElementById('shareStatus');
    
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        try {
          if (navigator.share) {
            await navigator.share({
              title: 'My Location',
              text: `I'm at ${deviceName}`,
              url: window.location.href
            });
            shareStatus.textContent = 'Location shared successfully!';
          } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(`${deviceName} is at: ${window.location.href}`);
            shareStatus.textContent = 'Location link copied to clipboard!';
          }
        } catch (error) {
          shareStatus.textContent = 'Share failed. Please try again.';
        }
        
        setTimeout(() => {
          shareStatus.textContent = '';
        }, 3000);
      });
    }
  }

  // Initialize status and alerts system
  setupStatusButtons();
  setupShareLocation();
  addActivity('Device connected and ready');
  addAlert('Location tracking started', 'success');
  
  // Add futuristic loading effects
  addFuturisticEffects();

  // Periodically send geolocation (if available)
  function sendPosition(pos){
    const coords = pos.coords;
    
    // Get battery information if available
    let batteryInfo = {};
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        batteryInfo = {
          battery: Math.round(battery.level * 100),
          charging: battery.charging
        };
        socket.emit('location', { 
          deviceId, 
          name: deviceName, 
          lat: coords.latitude, 
          lng: coords.longitude, 
          accuracy: coords.accuracy, 
          heading: coords.heading, 
          speed: coords.speed,
          ...batteryInfo,
          platform: navigator.platform,
          connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        });
      });
    } else {
      // Fallback for browsers without battery API
      socket.emit('location', { 
        deviceId, 
        name: deviceName, 
        lat: coords.latitude, 
        lng: coords.longitude, 
        accuracy: coords.accuracy, 
        heading: coords.heading, 
        speed: coords.speed,
        platform: navigator.platform,
        connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
      });
    }
  }

  function errorPos(err){
    console.warn('Geolocation error', err);
    addAlert('Geolocation error: ' + err.message, 'danger');
  }

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition((p)=>{ 
      sendPosition(p); 
      map.setView([p.coords.latitude, p.coords.longitude], 14); 
      addActivity('Initial location acquired');
    }, errorPos);
    navigator.geolocation.watchPosition(sendPosition, errorPos, { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 });
  } else {
    alert('Geolocation not supported by your browser. You can still view other devices that send locations.');
    addAlert('Geolocation not supported', 'warning');
  }

  // Futuristic Effects and Animations
  function addFuturisticEffects() {
    // Add glow effect to active elements
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.classList.add('glow');
      });
      btn.addEventListener('mouseleave', () => {
        btn.classList.remove('glow');
      });
    });

    // Add typing effect to device name
    const deviceNameElement = document.querySelector('#deviceList li');
    if (deviceNameElement) {
      const originalText = deviceNameElement.textContent;
      deviceNameElement.textContent = '';
      let i = 0;
      const typeWriter = () => {
        if (i < originalText.length) {
          deviceNameElement.textContent += originalText.charAt(i);
          i++;
          setTimeout(typeWriter, 50);
        }
      };
      setTimeout(typeWriter, 1000);
    }

    // Add particle effect to map
    createParticleEffect();

    // Add sound effects (optional - requires user interaction)
    addSoundEffects();

    // Add data visualization effects
    addDataVisualization();
  }

  // Create particle effect on map
  function createParticleEffect() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Create floating particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: #00ffff;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        opacity: 0.6;
        animation: float ${3 + Math.random() * 4}s linear infinite;
      `;
      
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 2 + 's';
      
      mapContainer.appendChild(particle);
    }

    // Add CSS for particle animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
        50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        100% { transform: translateY(0px) rotate(360deg); opacity: 0.6; }
      }
    `;
    document.head.appendChild(style);
  }

  // Add sound effects for interactions
  function addSoundEffects() {
    // Create audio context for sound effects
    let audioContext;
    
    const initAudio = () => {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    };

    // Beep sound for status updates
    const playBeep = (frequency = 800, duration = 200) => {
      initAudio();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    };

    // Add sound to status buttons
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        playBeep(600, 150);
      });
    });

    // Add sound to share button
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        playBeep(1000, 300);
      });
    }
  }

  // Add data visualization effects
  function addDataVisualization() {
    // Create animated progress bars for device health
    const healthItems = document.querySelectorAll('.health-item');
    healthItems.forEach(item => {
      const valueSpan = item.querySelector('span:last-child');
      if (valueSpan && valueSpan.textContent.includes('%')) {
        const percentage = parseInt(valueSpan.textContent);
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
          width: 100%;
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        `;
        
        const fill = document.createElement('div');
        fill.style.cssText = `
          height: 100%;
          background: linear-gradient(90deg, #ff4757, #ffa502, #00ff88);
          width: 0%;
          transition: width 2s ease;
          border-radius: 2px;
        `;
        
        progressBar.appendChild(fill);
        item.appendChild(progressBar);
        
        // Animate the progress bar
        setTimeout(() => {
          fill.style.width = percentage + '%';
        }, 500);
      }
    });

    // Add pulsing effect to alerts
    const alertItems = document.querySelectorAll('.alert-item');
    alertItems.forEach((item, index) => {
      item.style.animationDelay = (index * 0.1) + 's';
    });
  }

  // Add real-time clock
  function updateClock() {
    const clockElement = document.getElementById('lastUpdate');
    if (clockElement) {
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      clockElement.textContent = timeString;
    }
  }

  // Update clock every second
  setInterval(updateClock, 1000);
})();
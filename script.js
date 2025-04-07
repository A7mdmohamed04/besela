let player;
let timerInterval;
let studyDuration = 25 * 60;
let breakDuration = 5 * 60;
let timeRemaining = studyDuration;
let isStudyMode = true;
let isPaused = true;
let sessionCount = 0;
const videoUrlInput = document.getElementById('video-url');
const loadVideoButton = document.getElementById('load-video');
const videoPlaceholder = document.getElementById('video-placeholder');
const timeDisplay = document.getElementById('time-display');
const timerLabel = document.getElementById('timer-label');
const timerStatus = document.getElementById('timer-status');
const studyMinutesInput = document.getElementById('study-minutes');
const breakMinutesInput = document.getElementById('break-minutes');
const startTimerButton = document.getElementById('start-timer');
const pauseTimerButton = document.getElementById('pause-timer');
const resetTimerButton = document.getElementById('reset-timer');
const historyList = document.getElementById('history-list');

function onYouTubeIframeAPIReady() {
    loadVideoButton.addEventListener('click', loadVideo);
    
    loadFromLocalStorage();
}

function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function loadVideo() {
    const url = videoUrlInput.value.trim();
    const videoId = extractVideoId(url);
    
    if (!videoId) {
        alert('Please enter a valid YouTube URL');
        return;
    }
    
    if (player) {
        player.loadVideoById(videoId);
        player.pauseVideo();
    } else {
        videoPlaceholder.style.display = 'none';
        player = new YT.Player('player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'rel': 0,
                'modestbranding': 1
            },
            events: {
                'onReady': onPlayerReady
            }
        });
    }
    
    addToHistory(`Loaded video: ${url}`);
    
    saveToLocalStorage();
}

function onPlayerReady(event) {
    event.target.pauseVideo();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    studyDuration = parseInt(studyMinutesInput.value) * 60;
    breakDuration = parseInt(breakMinutesInput.value) * 60;
    
    if (isPaused && timeRemaining === studyDuration) {
        timeRemaining = studyDuration;
        isStudyMode = true;
        updateTimerDisplay();
    }
    
    isPaused = false;
    startTimerButton.disabled = true;
    pauseTimerButton.disabled = false;
    
    if (isStudyMode && player && player.playVideo) {
        player.playVideo();
    }
    
    timerStatus.textContent = isStudyMode ? 'Studying...' : 'Taking a break...';
    
    if (isStudyMode) {
        document.body.classList.add('study-mode');
        document.body.classList.remove('break-mode', 'paused-mode');
    } else {
        document.body.classList.add('break-mode');
        document.body.classList.remove('study-mode', 'paused-mode');
    }
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining % 10 === 0) {
            saveToLocalStorage();
        }
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            
            if (isStudyMode) {
                isStudyMode = false;
                timeRemaining = breakDuration;
                timerLabel.textContent = 'Break Time';
                document.body.classList.remove('study-mode');
                document.body.classList.add('break-mode');
                timerStatus.textContent = 'Time for a break!';
                
                if (player && player.pauseVideo) {
                    player.pauseVideo();
                }
                
                playNotificationSound();
                
                sessionCount++;
                addToHistory(`Completed study session #${sessionCount}: ${studyMinutesInput.value} minutes`);
            } else {
                isStudyMode = true;
                timeRemaining = studyDuration;
                timerLabel.textContent = 'Study Time';
                document.body.classList.remove('break-mode');
                document.body.classList.add('study-mode');
                timerStatus.textContent = 'Back to studying!';
                
                if (player && player.playVideo) {
                    player.playVideo();
                }
                
                playNotificationSound();
                
                addToHistory(`Completed break: ${breakMinutesInput.value} minutes`);
            }
            
            updateTimerDisplay();
            startTimer();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isPaused = true;
    startTimerButton.disabled = false;
    pauseTimerButton.disabled = true;
    
    if (player && player.pauseVideo) {
        player.pauseVideo();
    }
    
    timerStatus.textContent = 'Paused';
    document.body.classList.add('paused-mode');
    
    addToHistory('Timer paused');
    
    saveToLocalStorage();
}

function resetTimer() {
    clearInterval(timerInterval);
    isPaused = true;
    isStudyMode = true;
    timeRemaining = studyDuration;
    
    startTimerButton.disabled = false;
    pauseTimerButton.disabled = true;
    
    timerLabel.textContent = 'Study Time';
    timerStatus.textContent = 'Ready to start';
    
    document.body.classList.remove('study-mode', 'break-mode', 'paused-mode');
    
    if (player && player.pauseVideo) {
        player.pauseVideo();
        player.seekTo(0);
    }
    
    updateTimerDisplay();
    
    addToHistory('Timer reset');
            
    saveToLocalStorage();
    saveToLocalStorage();
}

function playNotificationSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.5;
    
    oscillator.start();
    
    setTimeout(() => {
        oscillator.stop();
    }, 500);
}

function addToHistory(text) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <span>${text}</span>
        <span class="time">${timeString}</span>
    `;
    historyList.prepend(listItem);
    
    if (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
    
    saveToLocalStorage();
}

function saveToLocalStorage() {
    localStorage.setItem('studyDuration', studyDuration);
    localStorage.setItem('breakDuration', breakDuration);
    localStorage.setItem('timeRemaining', timeRemaining);
    localStorage.setItem('isStudyMode', isStudyMode);
    localStorage.setItem('isPaused', isPaused);
    localStorage.setItem('sessionCount', sessionCount);
    
    localStorage.setItem('studyMinutes', studyMinutesInput.value);
    localStorage.setItem('breakMinutes', breakMinutesInput.value);
    localStorage.setItem('videoUrl', videoUrlInput.value);
    
    localStorage.setItem('timerLabel', timerLabel.textContent);
    localStorage.setItem('timerStatus', timerStatus.textContent);
    
    const historyItems = [];
    for (let i = 0; i < historyList.children.length; i++) {
        const item = historyList.children[i];
        historyItems.push({
            text: item.querySelector('span:first-child').textContent,
            time: item.querySelector('.time').textContent
        });
    }
    localStorage.setItem('historyItems', JSON.stringify(historyItems));
}

function loadFromLocalStorage() {
    if (localStorage.getItem('studyDuration')) {
        studyDuration = parseInt(localStorage.getItem('studyDuration'));
    }
    
    if (localStorage.getItem('breakDuration')) {
        breakDuration = parseInt(localStorage.getItem('breakDuration'));
    }
    
    if (localStorage.getItem('timeRemaining')) {
        timeRemaining = parseInt(localStorage.getItem('timeRemaining'));
    }
    
    if (localStorage.getItem('isStudyMode')) {
        isStudyMode = localStorage.getItem('isStudyMode') === 'true';
    }
    
    if (localStorage.getItem('isPaused')) {
        isPaused = localStorage.getItem('isPaused') === 'true';
    }
    
    if (localStorage.getItem('sessionCount')) {
        sessionCount = parseInt(localStorage.getItem('sessionCount'));
    }
    
    if (localStorage.getItem('studyMinutes')) {
        studyMinutesInput.value = localStorage.getItem('studyMinutes');
    }
    
    if (localStorage.getItem('breakMinutes')) {
        breakMinutesInput.value = localStorage.getItem('breakMinutes');
    }
    
    if (localStorage.getItem('videoUrl')) {
        videoUrlInput.value = localStorage.getItem('videoUrl');
        if (videoUrlInput.value) {
            setTimeout(() => {
                loadVideo();
            }, 1000);
        }
    }
    
    if (localStorage.getItem('timerLabel')) {
        timerLabel.textContent = localStorage.getItem('timerLabel');
    }
    
    if (localStorage.getItem('timerStatus')) {
        timerStatus.textContent = localStorage.getItem('timerStatus');
    }
    
    if (localStorage.getItem('historyItems')) {
        const historyItems = JSON.parse(localStorage.getItem('historyItems'));
        historyList.innerHTML = '';
        
        historyItems.forEach(item => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${item.text}</span>
                <span class="time">${item.time}</span>
            `;
            historyList.appendChild(listItem);
        });
    }
    
    updateTimerDisplay();
    
    if (!isPaused) {
        startTimerButton.disabled = true;
        pauseTimerButton.disabled = false;
        
        startTimer();
    } else {
        startTimerButton.disabled = false;
        pauseTimerButton.disabled = true;
    }
    
    if (!isPaused) {
        if (isStudyMode) {
            document.body.classList.add('study-mode');
            document.body.classList.remove('break-mode', 'paused-mode');
        } else {
            document.body.classList.add('break-mode');
            document.body.classList.remove('study-mode', 'paused-mode');
        }
    } else {
        document.body.classList.add('paused-mode');
        document.body.classList.remove('study-mode', 'break-mode');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateTimerDisplay();
    
    startTimerButton.addEventListener('click', startTimer);
    pauseTimerButton.addEventListener('click', pauseTimer);
    resetTimerButton.addEventListener('click', resetTimer);
    
    studyMinutesInput.addEventListener('change', () => {
        studyDuration = parseInt(studyMinutesInput.value) * 60;
        if (isPaused && isStudyMode) {
            timeRemaining = studyDuration;
            updateTimerDisplay();
        }
        saveToLocalStorage();
    });
    
    breakMinutesInput.addEventListener('change', () => {
        breakDuration = parseInt(breakMinutesInput.value) * 60;
        if (isPaused && !isStudyMode) {
            timeRemaining = breakDuration;
            updateTimerDisplay();
        }
        saveToLocalStorage();
    });
    
    videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadVideo();
        }
    });
    
    window.addEventListener('beforeunload', saveToLocalStorage);
});

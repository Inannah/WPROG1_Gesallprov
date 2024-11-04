$( document ).ready(function() {
	//Video-data
	var video = "Studying_girl";
	var videoUrl = "media/video/214500_small.mp4";
	var videoDesc ="Flicka som studerar vid sitt skrivbord."

	//Musikspelardata

	var $musicPlayer = $('#music-player');
	var $playPauseBtn = $('#player-play-pause');
	var $playPrevBtn = $('#player-previous');
	var $playNextBtn = $('#player-next');
	var $songInfo = $('#song-info');
	var isMusicPlaying = false;
	var trackIndex = 0;
	var currentTrack = document.createElement("audio");
	var playListName = "Electro_Swing";
	var trackList = [];
	var shouldRestartMusic = false;

	//Bakgrundsljud
	var isBgSoundPlaying = false;
	var bgSoundName = "light-rain";
	var bgSound = document.createElement("audio");
	var bgSoundData;
	var shouldRestartBgSound = true;


	//Timerdata
	var useTimer = true;
	var timerOn = false;
	var minutes = 25;
	var seconds = 00;
	var time = (minutes*60) + seconds;
	var isBreak = false;
	var breakMinutes = 05;
	var breakSeconds = 00;
	var breakTime = (breakMinutes*60) + breakSeconds;
	var $displayMinutes = $('#minutes');
	var $displaySeconds = $('#seconds');
	var $displayBreakMinutes = $('#displayBreakMinutes');
	var $displayBreakSeconds = $('#displayBreakSeconds');
	var currentMinutes = Math.floor(time / 60);
	var currentSeconds = time % 60;
	var interval;

	//Uppstartsfunktioner
	//Om startsida, ladda visa öppna sparfil ifall den finns
	if (localStorage.getItem("date") != null ){
		$('#open-save-button').show();
	} else {
		$('#open-save-button').hide();
	}

	//Om study-view, hämta sparade variabler från antingen session eler local storage beroende på val i startmenyn
	//och anropa relevanta funktioner
	if (window.location.pathname=='/study-view.html') {
		var saveOption = sessionStorage.getItem("saveOption");
		if (saveOption === "premadeView"){
			video = sessionStorage.getItem("bg");
			videoUrl = sessionStorage.getItem("url");
			videoDesc = sessionStorage.getItem("desc");
			bgSoundName = sessionStorage.getItem("sound");
			playListName = sessionStorage.getItem("music");
		} else if (saveOption === "savedSettings"){
			videoUrl = localStorage.getItem('videoUrl');
			videoDesc = sessionStorage.getItem("desc");
			trackIndex = localStorage.getItem('trackIndex');
			playListName = localStorage.getItem('playListName');
			bgSoundName = localStorage.getItem('bgSoundName');
			useTimer = localStorage.getItem('useTimer') === 'true';
			minutes = parseInt(localStorage.getItem('minutes'), 10);
			seconds = parseInt(localStorage.getItem('seconds'), 10);
			breakMinutes = parseInt(localStorage.getItem('breakMinutes'), 10);
			breakSeconds = parseInt(localStorage.getItem('breakSeconds'), 10);
		} else if (saveOption === "currentSettings"){
			videoUrl = sessionStorage.getItem('videoUrl');
			videoDesc = sessionStorage.getItem("desc");
			trackIndex = sessionStorage.getItem('trackIndex');
			playListName = sessionStorage.getItem('playListName');
			bgSoundName = sessionStorage.getItem('bgSoundName');
			useTimer = sessionStorage.getItem('useTimer') === 'true';
			minutes = parseInt(sessionStorage.getItem('minutes'), 10);
			seconds = parseInt(sessionStorage.getItem('seconds'), 10);
			breakMinutes = parseInt(sessionStorage.getItem('breakMinutes'), 10);
			breakSeconds = parseInt(sessionStorage.getItem('breakSeconds'), 10);
		}
		loadMedia();
		loadTimer();
	}
	
	//Laddar attribut för video, ljud och musik
	function loadMedia(){
		updateVideo();	
		getBgSound(bgSoundName, function(item) {
			bgSoundData = item;
			if (bgSoundData != null) {
				loadBgSound();
			}
		});
		getPlaylist(playListName, function(tracks) {
			trackList = tracks;
			if (trackList && trackList.length > 0) {
				loadTrack(trackIndex);
			}
		});
	}


	/*Sparfunktioner*/
	/*Knapp för att spara inställningar*/
	$('#save-settings').on('click', function(){
		if(video==="upload"){
			alert("Du kan tyvärr inte spara en egenuppladdad video.");
		} else {
			if (localStorage) {
				if(confirm("Inställningarna sparas i din webbläsares Local Storage, så att de kan användas igen. Du kan bara ha en samling inställningar sparade.\nVill du spara dina inställningar?")){
					saveSettings();	
				}
			} else {
				alert("Din browser stödjer inte Local Storage");
			}
		}
	});

	//Knapp för att ladda inställningar
	$('#open-save-button').on('click', function(e){
		e.preventDefault();
		var saveDate = localStorage.getItem("date");
		if(confirm("Ladda inställningar från " + new Date(saveDate).toLocaleString() + "?")){
			loadSettings();
			window.location.href = "study-view.html";
		}
	});

	//Spara inställningar till localStorage
	function saveSettings(){
		localStorage.setItem("saveOption", "savedSettings");
		localStorage.setItem('date', Date());
		localStorage.setItem('videoUrl', videoUrl);
		localStorage.setItem("desc", videoDesc);
		localStorage.setItem('trackIndex', trackIndex);
		localStorage.setItem('playListName', playListName);
		localStorage.setItem('bgSoundName', bgSoundName);
		localStorage.setItem('useTimer', useTimer);
		localStorage.setItem('minutes', minutes);
		localStorage.setItem('seconds', seconds);
		localStorage.setItem('breakMinutes', breakMinutes);
		localStorage.setItem('breakSeconds', breakSeconds);
	}

	//Ladda inställningar
	function loadSettings(){
		sessionStorage.clear(); //Tar bort ev andra inställningar som kan störa
		sessionStorage.setItem('saveOption', 'savedSettings');
	}

	//Spara temporära inställningar
	function saveCurrentSettings() {
		sessionStorage.setItem("saveOption", "currentSettings");
		sessionStorage.setItem("videoUrl", videoUrl);
		sessionStorage.setItem("desc", videoDesc);
		sessionStorage.setItem("trackIndex", trackIndex);
		sessionStorage.setItem("playListName", playListName);
		sessionStorage.setItem("bgSoundName", bgSoundName);
		sessionStorage.setItem("useTimer", useTimer);
		sessionStorage.setItem("minutes", minutes);
		sessionStorage.setItem("seconds", seconds);
		sessionStorage.setItem("breakMinutes", breakMinutes);
		sessionStorage.setItem("breakSeconds", breakSeconds);
		sessionStorage.setItem("breakTime", breakTime);

	}

	//Bakgrundsljud-funktioner
	//loopa ljud
	bgSound.loop = true;

	//På/av-knapp för bakgrundsljud
	$('#bg-sound-on-off').on('click', bgPlayPause);

	//Hämta bakgrundsljud från fil
	function getBgSound(key, callback){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '../data/sounds.json');
		xhr.send(null);
		xhr.onload = function() {
			if (xhr.status === 200){
				try {
					var response = JSON.parse(xhr.responseText);
					var item = response[key];
					callback(item); 
					return;
				} catch (e) {
					console.error("JSON kunde inte tolkas:", e);
					callback(null);
				}
			} else {
				console.log('http request misslyckades');
				callback(null);
			}
		}
	}

	//sätt bakgrundsljuds url
	function loadBgSound(){
		bgSound.src = bgSoundData.url;
		bgSound.load();
	}

	//Växlingsfunktion för av/på-knapp
	function bgPlayPause(){
		if(!isBgSoundPlaying){
			playBgSound();
		} else {
			pauseBgSound();
		}
	}

	
	//Spela bakgrundsljud
	function playBgSound(){
		bgSound.play();
		isBgSoundPlaying = true;
	}

	//Pausa bakgrundsljud
	function pauseBgSound(){
		bgSound.pause();
		isBgSoundPlaying = false;
	}

	//Musikspelar-funktioner
	//Knappar
	$playPauseBtn.on('click', playPause);
	$playNextBtn.on('click', nextTrack);
	$playPrevBtn.on('click', prevTrack);

	//Hämta spellista från fil
	function getPlaylist(name, callback){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '../data/playlists.json');
		xhr.send(null);
		xhr.onload = function() {
			if (xhr.status === 200){
				try {
					var response = JSON.parse(xhr.responseText);
					for (var key in response) {
							if (key === name) {
								var item = response[key];
								callback(item.tracks);
								return; 
							}
					}
					callback(null);
				} catch (e) {
					console.error("JSON kunde inte tolkas:", e);
					callback(null);
				}
			} else {
				console.log('http request misslyckades');
				callback(null);
			}
		}
	}

	//Ladda låt till spelare från spellista
	function loadTrack(trackIndex){
		if (trackIndex > trackList.length - 1){
			trackIndex = trackList.length - 1;
		}
		currentTrack.src = trackList[trackIndex].path;
		currentTrack.load();
		$('#player-song-artist').text(trackList[trackIndex].artist);
		$('#player-song-title').text(trackList[trackIndex].title);		
		currentTrack.onended = nextTrack;
	}

	//Växlingsfunktion för uppspelning av musik
	function playPause(){
		if(!isMusicPlaying){
			playTrack();
		} else {
			pauseTrack();
		}
	}

	//Spela musik
	function playTrack(){
		currentTrack.play();
		isMusicPlaying = true;
	}

	//Pausa musik
	function pauseTrack(){
		currentTrack.pause();
		isMusicPlaying = false;
	}

	//Gå till nästa låt
	function nextTrack() {
		if (trackIndex < trackList.length - 1){
			trackIndex++;
		} else {
			trackIndex = 0;
		}
		loadTrack(trackIndex);
		if (isMusicPlaying){
			playTrack();
		}
	}

	//Gå till föreg. låt
	function prevTrack() {
		if (trackIndex == 0){
			trackIndex = parseInt(trackList.length-1);
		} else {
			trackIndex--;
		}
		loadTrack(trackIndex);
		if (isMusicPlaying){
			playTrack();
		}
	}

	//Video och visningsläge
	//Hämtar video-data
	function getVideo(key, callback){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '../data/backgrounds.json');
		xhr.send(null);
		xhr.onload = function() {
			if (xhr.status === 200){
				try {
					var response = JSON.parse(xhr.responseText);
					var item = response[key];
					callback (item);
					return
				} catch (e) {
					console.error("JSON kunde inte tolkas:", e);
					callback(null);
				}
			} else {
				callback(null);
			}
		}
	}
	
	function setVideoData(data){
		videoUrl = data.url;
		videoDesc = data.desc;
	}
	
	function updateVideo() {
		$("#fullscreen-video").attr('aria-label', videoDesc);
		$("#fullscreen-video > source").attr('src', videoUrl);
		$("#fullscreen-video")[0].load();
	}
	
	//Byt visningsläge(helskärm)
	function toggleViewMode(){
		var docElement = document.documentElement;
		if(!document.fullscreenElement){
			docElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	//Timer-funktioner
	//Knapp för start/paus av timern
	$('#timer-play-pause').on('click', function(){
		if (timerOn){
			timerOn = false;
			clearInterval(interval);
		} else {
			timerOn = true;
			startTimer();
		}
	});
	
	//Knapp för att avbryta paus-läge
	$('#stop-break-button').on('click', stopBreak);
	
	//uppdaterar timer-variabler och visar/döljer timerns UI
	function loadTimer(){
		time = (minutes * 60) + seconds;
		breakTime = (breakMinutes * 60) + breakSeconds;
		if (useTimer){
			$('#timer').show();
			updateTimerDisplay();
			updateBreakDisplay();
		} else {
			$('#timer').hide();
			timerOn = false;
			clearInterval(interval);
		}
	}
	
	//Uppdaterar siffrorna i UI för timer
	function updateTimerDisplay() {
		currentMinutes = Math.floor(time / 60).toString().padStart(2, '0');
		currentSeconds = (time % 60).toString().padStart(2, '0');
		$displayMinutes.text(currentMinutes);
		$displaySeconds.text(currentSeconds);
	}

	//Uppdaterar siffrorna i UI för paus-timer
	function updateBreakDisplay(){
		currentMinutes = Math.floor(breakTime / 60).toString().padStart(2, '0');
		currentSeconds = (breakTime % 60).toString().padStart(2, '0');
		$displayBreakMinutes.text(currentMinutes);
		$displayBreakSeconds.text(currentSeconds);
	}

	//Starta timer
	function startTimer() {
		clearInterval(interval);
		interval = setInterval(function() {
			if (time > 0) {
				time--;
				updateTimerDisplay();
			} else {
				startBreak();
				time = (minutes * 60) + seconds;
				updateTimerDisplay();
			}
		}, 1000);
	}

	//Startar paus-läge
	function startBreak(){
		clearInterval(interval);
		if (isMusicPlaying){
			pauseTrack();
			shouldRestartMusic = true;
		} else {
			shouldRestartMusic = false;
		}
		if (isBgSoundPlaying){
			pauseBgSound();
			shouldRestartBgSound = true;
		} else {
			shouldRestartBgSound = false;
		}	
		breakTime = (breakMinutes * 60) + breakSeconds;
		interval = setInterval(function() {
			if (breakTime > 0) {
				breakTime--;
				updateBreakDisplay();
			} else {
				stopBreak();
				updateBreakDisplay();
			}
		}, 1000);
		openBreakModal();
	}

	//Avslutar paus-läge
	function stopBreak(){
		breakTime = (breakMinutes * 60) + breakSeconds;
		clearInterval(interval);
		closeBreakModal();
		if (shouldRestartMusic){
			playTrack();
		}
		if (shouldRestartBgSound){
			playBgSound();
		}
		startTimer();
	}

	//Förval
	//Markera förval
	$('.premade-view').on('click', function(){
		if(!$(this).hasClass("selected-view")){
			$('.premade-view').removeClass("selected-view");
			$(this).addClass("selected-view");
		}
		$('#confirm-preset-button').show();
	});

	//Bekräfta val
	$('#confirm-preset-button').on('click', function(){
		savePresetData($('.selected-view'));
	});

	//Sparar förvals-data
	function savePresetData(selected){
		const bg = selected.data("bg");
		const url = selected.data("url");
		const desc = $('.selected-view > img').attr('alt');
		const sound = selected.data("sound");
		const music = selected.data("music");
		sessionStorage.setItem('saveOption', 'premadeView');
		sessionStorage.setItem('bg', bg);
		sessionStorage.setItem('desc', desc);
		sessionStorage.setItem('url', url);
		sessionStorage.setItem('sound', sound);
		sessionStorage.setItem('music', music);
	}

	//Settings
	//öppnar timer-inställningar
	$('#change-timer-settings').on('click', function() {
		if (useTimer){
			$('#useTimer').prop("checked", true);
			$('.time-input').prop( "disabled", false );
		} else {
			$('#useTimer').prop("checked", false);
			$('.time-input').prop( "disabled", true );
		}
		$('input[name="studyMinutes"]').attr("value", formatTimePlaceholder(minutes));
		$('input[name="studySeconds"]').attr("value", formatTimePlaceholder(seconds));
		$('input[name="breakMinutes"]').attr("value", formatTimePlaceholder(breakMinutes));
		$('input[name="breakSeconds"]').attr("value", formatTimePlaceholder(breakSeconds));
		$('.time-input').on('input', function(){
			formatTimeInput(this);
		});
		openModal($('#timer-settings'));
		$('#useTimer').on("change", function(){
			if ($('#useTimer').prop("checked")){
				$('.time-input').prop( "disabled", false );
			} else {
				$('.time-input').prop( "disabled", true );
			}
		});
		$('#timer-settings-submit').on('click', function(event){
			event.preventDefault();
			confirmTimerSettings();
		});
	});

	//Bekräfta timer-inställningar, uppdaterar variabler och kallar på funktion för att uppdatera UI
	function confirmTimerSettings(){
		useTimer = $('#useTimer').is(':checked');
		minutes = parseInt($('#studyMinutes').val());
		seconds = parseInt($('#studySeconds').val());
		breakMinutes = parseInt($('#breakMinutes').val());
		breakSeconds = parseInt($('#breakSeconds').val());
		loadTimer();
		saveCurrentSettings()
		closeModal();
	}

	//Formaterar förinställt värde i timer-inställningar
	function formatTimePlaceholder(number){
		if (number < 10){
			return "0" + number;
		} else {
			return number;
		}
	}

	//Formaterar användarens input i timer-inställningar
	function formatTimeInput(element) {
		if (element.value.length >= 3){
			element.value = element.value.substring(1);
		}
		if (element.value > 59){
			element.value = 59;
		} else if (element.value < 0){
			element.value = '00';
		} else {
			element.value = element.value.padStart(2, '0');
		}
	}

	//Öppnar meny för visnings-inställningar
	$('#change-background').on('click', function() {
		if (!document.fullscreenEnabled){
			$('input[value="Fullscreen"]').prop("disabled", true);
		} else {
			$('input[value="Fullscreen"]').prop("disabled", false);
			if(document.fullscreenElement){
				$('input[value="Fullscreen"]').prop("checked", true);
			} else {
				$('input[value="Fullscreen"]').prop("checked", false);
			}
		}
		openModal($('#bg-menu'));
		$('input[name="videoViewType"]').on('click', function(){
			toggleViewMode();
			closeModal();
		});
		$('#videofile_input').on('change', handleVideoFile);
		$('.bgChoice').on('click', confirmBgChoice);
	});
	
	function handleVideoFile(){
		const fileList = this.files;
		const file = fileList[0];
		
		video = "upload";
		videoUrl = URL.createObjectURL(file);
		videoDesc= "Egen video";
		updateVideo();
		closeModal();	
	}

	//Byte av bakgrund
	function confirmBgChoice(){
		let key = $(this).attr("data-key");
		video = key;
		getVideo(key, function(item) {
			setVideoData(item);
			updateVideo();
			saveCurrentSettings()
		});
		closeModal();
	}
	
	//Öppna meny för byte av musik
	$('#change-music').on('click', function(){
		openModal($('#music-menu'));
		$('.musicChoice').on('click', confirmPlaylist);
	});

	//Menyval för byte av musik
	function confirmPlaylist(){
		trackIndex = 0;
		let key = $(this).attr("data-key");
		playListName = key;
		getPlaylist(key, function(item) {
			trackList = item;
			if (trackList && trackList.length > 0) {
				loadTrack(trackIndex);
				if (isMusicPlaying){
					playTrack();
				}
			}
		});
		saveCurrentSettings()
		closeModal();
	}

	//Öppna meny för byte av bakgrunds-ljud
	$('#change-ambience').on('click', function(){
		openModal($('#sound-menu'));
		$('.bgSoundChoice').on('click', confirmBgSound);
	});

	//Menyval för byte av bakgrundsljud
	function confirmBgSound(){
		let key = $(this).attr("data-key");
		bgSoundName = key;
		getBgSound(bgSoundName, function(item) {
			bgSoundData = item;
			if (bgSoundData != null) {
				loadBgSound();
				if (isBgSoundPlaying){
					playBgSound();
				}
			}
		});
		saveCurrentSettings()
		closeModal();	
	}

	//Modal-funktioner och tabbed panels
	//Öppnar FAQ (med tabbed panels)
	$('#faq-button').on('click', function() {
		openModal($('#faq-view'));
		$("#tab1").load("faq-instructions.html", function() {
			$("#tab1").addClass('loaded');
		});
		
		$('.tab-list').each(function(){
			var $this = $(this);
			var $tab = $this.find('li.active');
			var $link = $tab.find('a');
			var $panel = $($link.attr('href'));
			
			$this.on('click', '.tab-menu-item', function(e){
				e.preventDefault();
				var $link = $(this).find('a');
				var id = $link.attr('href');
				
				if(id && !$link.parent().is('.active')){
					$panel.removeClass('active');
					$tab.removeClass('active');
					
					$panel = $(id).addClass('active');
					$tab = $(this).addClass('active');
					
					if($(id).attr("class") != "loaded"){
						var contentUrl = '';
						if (id == '#tab1'){
							contentUrl="faq-instructions.html";
						} else if (id == '#tab2'){
							contentUrl="faq-timer.html";
						} else if (id == '#tab3'){
							contentUrl="faq-sources.html";
						}
						$(id).load(contentUrl, function() {
							$(id).addClass('loaded');
						});
					}
				}
			});
		});
	});
	
	//Stänger modalfönster om klick utanför fönstret
	window.onclick = function(event) {
		if ($(event.target).is('#modal-overlay')) {
			event.preventDefault();
			closeModal();
		}
	}

	$('.modal-close').on('click', closeModal);

	//Öppnar modalfönster
	function openModal(content) {
		$('#modal-overlay').show();
		$('.modal').show();
		$('.modal-content').hide(); //Försäkrar att övrigt modalinnehåll verkligen är gömt
		content.show();
	}

	//Stänger modalfönster
	function closeModal() {
		$('#modal-overlay').hide();
		$('.modal').hide();
		$('.modal-content').hide();
	}

	function openBreakModal(){
		$('#break-overlay').show();
		$('.modal').show();
		$('#break-modal').show();
	}

	function closeBreakModal(){
		$('#break-overlay').hide();
		$('#modal-overlay').hide(); //Ifall den råkade vara öppen när pausen började
		$('.modal').hide();
		$('.modal-content').hide();
	}
});
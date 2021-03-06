"use strict";

var ls = localStorage;
var iteration = 0;
var intervalId = null;

var mainLoop = function(force) {
  console.log("\n#" + iteration);

  if (force || iteration % UPDATE_CANTINAS_INTERVAL === 0)
    updateCantinas();
  if (force || iteration % UPDATE_NEWS_INTERVAL === 0)
    updateAffiliationNews('1');
  if (ls.showAffiliation2 === 'true')
    if (force || iteration % UPDATE_NEWS_INTERVAL === 0)
      updateAffiliationNews('2');

  // No reason to count to infinity
  if (10000 < iteration)
    iteration = 0;
  else
    iteration++;
}

//
// Status (office status, meetings, and servant for affiliation)
//

var updateAffiliation = function(callback) {
  console.log('updateAffiliation');
  // Note: This function is externally called by the Notiwalls
  if (Affiliation.org[ls.affiliationKey1].hardware) {
    // Fetch
    Affiliation.get(ls.affiliationKey1, function() {
      // Run relevant background updates
      updateStatusAndMeetings();
      updateCoffeeSubscription();
      // Callback
      if (typeof callback === 'function') callback();
    });
  }
};

var updateStatusAndMeetings = function(force, callback) {
  console.log('updateStatusAndMeetings');
  
  // Get meeting data
  var meeting = ls.meetingString;

  // Get status data
  var strings = JSON.parse(ls.statusStrings);
  var statusCode = strings.statusCode;
  var statusTitle = strings.statusTitle;
  var statusMessage = strings.statusMessage;
}

//
// Coffee
//

var updateCoffeeSubscription = function(callback) {
  console.log('updateCoffeeSubscription');
  // Get
  var coffeeData = JSON.parse(ls.coffeeData);
  // Hope for the best
  try {
    var date = coffeeData.date;
    var pots = coffeeData.pots;

    // No coffee yields pots=0 and date=null
    if (pots && date) {

      // Parse that date
      date = new Date(date);
      var age = Coffee.minuteDiff(date);

      // Check for NaN here
      if (!isNaN(pots) && !isNaN(age)) {
        // New pot number?
        ls.coffeePots = pots;
      }
    }
    if (typeof callback === 'function') callback();
  }
  catch (e) {
    console.error(e);
  }
}

//
// Cantina
//

var updateCantinas = function(callback) {
  console.log('updateCantinas');
  // Fetch
  Cantina.get(ls.cantina1, function(result1) {
    Cantina.get(ls.cantina2, function(result2) {
      // Save
      ls.cantina1Data = JSON.stringify(result1);
      ls.cantina2Data = JSON.stringify(result2);
      // Callback
      if (typeof callback === 'function') callback();
    });
  });
}

//
// Affiliation news
//

var updateAffiliationNews = function(number, callback) {
  console.log('updateAffiliationNews'+number);
  // Get affiliation
  var affiliationKey = ls['affiliationKey'+number];
  var affiliation = Affiliation.org[affiliationKey];
  // Get news for this affiliation
  if (affiliation) {
    News.get(affiliation, function(posts) {
      // Error message, log it maybe
      if (typeof posts === 'string') {
        console.error(posts);
      }
      // Empty news posts, don't count
      else if (posts.length === 0) {
        // Do nothing (Notifier nullifies news count here)
      }
      // News is here! NEWS IS HERE! FRESH FROM THE PRESS!
      else {
        saveNews(posts, number);
      }
      if (typeof callback === 'function') callback();
    });
  }
  else {
    console.error('Chosen affiliation "' + affiliationKey + '" is not known');
    if (typeof callback === 'function') callback();
  }
};

var saveNews = function(items, number) {
  ls['affiliationNews' + number] = JSON.stringify(items);
  ls['affiliationNewsList' + number] = News.refreshNewsList(items);
};

//
// Load Affiliation Icon
// (executes itself once)
//

var loadAffiliationIcon = function() {
  var key = ls.affiliationKey1;
  // Set badge icon
  var icon = Affiliation.org[key].icon;
  Browser.setIcon(icon);
  // Set badge title
  var name = Affiliation.org[key].name;
  Browser.setTitle(name + ' Notiwall');
}();

//
// Keep Awake
// (executes itself once)
//

(function keepAwake() {
  // Keep this computer and its display turned on.
  chrome.power.requestKeepAwake("display");
}());

// Document ready, go!
$(document).ready(function() {
  // Clear values that should start empty
  Affiliation.clearAffiliationData();

  // Check if both current affiliations still exist, reset if not
  var keys = Object.keys(Affiliation.org);
  Defaults.resetAffiliationsIfNotExist(ls.affiliationKey1, ls.affiliationKey2, keys);

  // If just installed, wait 5 secs to let things load
  var delayOpening = 0;
  if (Number(ls.installTime) + 5000 > Date.now()) {
    delayOpening = 5000;
  }
  setTimeout(function() {
    // Open the desired Notiwall on startup
    if (ls.whichScreen === 'infoscreen') {
      Browser.openTab('infoscreen.html');
      Analytics.trackEvent('loadInfoscreen');
    }
    else if (ls.whichScreen === 'officescreen') {
      Browser.openTab('officescreen.html');
      Analytics.trackEvent('loadOfficescreen');
    }
    else {
      console.error('No recognised Notiwall. localStorage.whichScreen was "' + ls.whichScreen + '"');
    }
  }, delayOpening);

  // Send some basic statistics once a day
  setInterval( function() {
    // App version is interesting
    Analytics.trackEvent('appVersion', Browser.getAppVersion() + ' @ ' + Browser.name);
    // Affiliation is also interesting, in contrast to the popup some of these are inactive users
    // To find inactive user count, subtract these stats from popup stats
    if (ls.showAffiliation2 !== 'true') {
      Analytics.trackEvent('singleAffiliation', ls.affiliationKey1);
      Analytics.trackEvent('affiliation1', ls.affiliationKey1);
    }
    else {
      Analytics.trackEvent('doubleAffiliation', ls.affiliationKey1 + ' - ' + ls.affiliationKey2);
      Analytics.trackEvent('affiliation1', ls.affiliationKey1);
      Analytics.trackEvent('affiliation2', ls.affiliationKey2);
    }
  }, 1000 * 60 * 60 * 24);

  // Enter main loop, keeping everything up-to-date
  var stayUpdated = function(now) {
    console.log(ONLINE_MESSAGE);
    var loopTimeout = (DEBUG ? BACKGROUND_LOOP_DEBUG : BACKGROUND_LOOP);
    // Schedule for repetition
    intervalId = setInterval( function() {
      mainLoop();
    }, loopTimeout);
    // Run once right now (just wait 2 secs to avoid network-change errors)
    var timeout = (now ? 0 : 2000);
    setTimeout( function() {
      mainLoop(true);
    }, timeout);
  };
  // When offline, mainloop is stopped to decrease power consumption
  window.addEventListener('online', stayUpdated);
  window.addEventListener('offline', function() {
    console.log(OFFLINE_MESSAGE);
    clearInterval(intervalId);
  });

  if (navigator.onLine) {
    // If Online, go ahead and start the stayUpdated-function
    stayUpdated(true);
  }
  else {
    // If offline, run mainloop once, it fetches error messages
    // Keep in mind: this here is at program startup, we have to get something to display
    mainLoop();
  }
});

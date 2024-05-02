(() => {

let currentLog = [];
let maxLogSize = 5;

let displayRefreshIntervalId = null;
const mainContainer = document.getElementById('mainContainer');

const maxLogSizeInput = document.getElementById('maxLogSizeInput');
const stopRequestLoggingBtn = document.getElementById('stopRequestLoggingBtn');
const startRequestLoggingBtn = document.getElementById('startRequestLoggingBtn');

init();

function init() {

  setupState();
  drawLogTable();

  maxLogSizeInput && (maxLogSizeInput.value = maxLogSize);
  setupBtnListeners();
}


function logHttpRequest(details) {
console.log(details)
  _controlLogSize();

  currentLog.push({

    initiator: details.initiator || '--',
    method: details.method || '--',
    timestamp: details.timeStamp || '--',
    type: details.type || '--',
    url: details.url || '--'
  });

  drawLogTable();

  saveState();
}

function startRequestLogging() {

  if (!chrome.webRequest) {

    return;
  }

  chrome.webRequest.onBeforeRequest.addListener(
    logHttpRequest,
    {urls: ["<all_urls>"]}
  );
}

function stopRequestLogging() {

  chrome.webRequest.onBeforeRequest.removeListener(logHttpRequest);

  clearInterval(displayRefreshIntervalId);
}

function clearLog() {

  currentLog = [];
  clearState();
  drawLogTable();
}

function setMaxLogSize(newVal) {

  maxLogSize = newVal < 0 ? 1 : newVal > 1000 ? 1000 : newVal;

  _controlLogSize();

  saveState();

  drawLogTable();
}

function _controlLogSize() {

  if (currentLog.length === maxLogSize) {

    currentLog.shift();

  } else if (currentLog.length > maxLogSize) {

    currentLog = currentLog.slice(currentLog.length - maxLogSize);
  }
}

function exportToCsv() {

  const data = currentLog;
  const columnDelimiter = "|";
  const lineDelimiter = "\n";

  let result, ctr, keys;

  if (!data.length) {

    return;
  }

  keys = Object.keys(data[0]);

  result = "";
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(item => {

    ctr = 0;

    keys.forEach(key => {

      if (ctr > 0) {

        result += columnDelimiter;
      }

      result += typeof item[key] === "string" && item[key].includes(columnDelimiter) ?
        `"${item[key]}"` : item[key];

      ctr++;
    });

    result += lineDelimiter;
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + result;

  const encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
}


/**
 * State Storage methods
 */
function saveState() {

  localStorage.setItem('http_requests_log', JSON.stringify(currentLog));
}

function clearState() {

  localStorage.removeItem('http_requests_log');
}

function setupState() {

  const logInStorage = JSON.parse(localStorage.getItem('http_requests_log'));

  logInStorage && (currentLog = [

    ...logInStorage
  ]);
}
/**
 * END of State Storage methods
 */





/**
 * Visualizing methods
 */

function setupBtnListeners() {

  if (document.body.addEventListener) {

    document.body.addEventListener('click', handleBtnClicks, false);
  }


  function handleBtnClicks(e) {

    const target = e.target || e.srcElement;

    // NOTE: the check is needed since there is only one eventListener for the page
    // If handling of different click events is needed, this will have to be refactored
    if (!target.className.match(/btn/)) {

      return;
    }

    const actionType = target.getAttribute('data-actionType');

    switch (actionType) {

      case 'startRequestLogging':

        stopRequestLoggingBtn.className = 'btn stop-log-btn';
        startRequestLoggingBtn.className = 'btn start-log-btn hidden';

        startRequestLogging();
        break;


      case 'stopRequestLogging':

        stopRequestLoggingBtn.className = 'btn stop-log-btn hidden';
        startRequestLoggingBtn.className = 'btn start-log-btn';

        stopRequestLogging();
        break;


      case 'setMaxLogSize':

        const newVal = +maxLogSizeInput.value;

        setMaxLogSize(newVal);
        break;


      case 'clearLog':

        clearLog();
        break;


      case 'exportToCsv':

        exportToCsv();
        break;


      default:
        break;
    }
  }
}


function drawLogTable() {

  if (!mainContainer) {

    return;
  }

  let result = '';


  // Generate the header
  //NOTE: can be left static and generated if the displayed props won't change
  result += `
    <ul class="logs-table-header flex items-center">
      <li class="log-item truncate p-2">Initiator</li>
      <li class="log-item truncate p-2">Method</li>
      <li class="log-item truncate p-2">Timestamp</li>
      <li class="log-item truncate p-2">Type</li>
      <li class="log-item truncate p-2">Url</li>
    </ul>

    <ul class="logs-table-body flex flex-column items-center">
  `;

  if (!currentLog[0]) {

    result += '<li class="p-2 m-2 log-item">No entries found.</li></ul>';
  }


  currentLog.forEach(log => {

    result += '<li class="log-item flex">'

    for (key in log) {

      result += `

        <div class="${key}-entry truncate p-2 text-xs">${log[key]}</div>
      `;
    }

    result += '</li>'
  });


  result += '</ul>';


  mainContainer.innerHTML = result;

  return result;
}
/**
 * END of Visualizing methods
 */

})();
let allBills = [];
let allBillOptionsCount = {};
renderData();

async function renderData() {
  if (window.location.hostname === "openfunltd.github.io") {
    homeATags = document.getElementsByClassName('home');
    Array.from(homeATags).forEach(aTag => { aTag.href = "/law-diff/"; })
  }

  const GET_keyword = document.location.search.match(/keyword=([^&]*)/);
  const GET_term = document.location.search.match(/term=([0-9]*)/);
  const GET_sessionPeriod = document.location.search.match(/sessionPeriod=([0-9]*)/);
  const GET_proposer = document.location.search.match(/proposer=([^&]*)/);

  const keyword = (GET_keyword) ? decodeURIComponent(GET_keyword[1]) : "";
  const term = (GET_term) ? GET_term[1] : 11;
  const sessionPeriod = (GET_sessionPeriod) ? GET_sessionPeriod[1] : "";
  const proposer = (GET_proposer) ? decodeURIComponent(GET_proposer[1]) : "";

  const keywordInput = document.getElementById("input-keyword");
  const termSelect = document.getElementById("select-term");
  const sessionPeriodSelect = document.getElementById("select-sessionPeriod");
  const proposerInput = document.getElementById("input-proposer");

  keywordInput.setAttribute('value', keyword);
  termSelect.setAttribute('value', term);
  sessionPeriodSelect.setAttribute('value', sessionPeriod);
  proposerInput.setAttribute('value', proposer);

  const keywordSpans = document.getElementsByClassName("keyword");
  const termSpans = document.getElementsByClassName("term");
  const sessionPeriodSpans = document.getElementsByClassName("sessionPeriod");
  const proposerSpans = document.getElementsByClassName("proposer");

  Array.from(keywordSpans).forEach(span => { span.innerText = keyword });
  Array.from(termSpans).forEach(span => { span.innerText = term });
  Array.from(sessionPeriodSpans).forEach(span => { span.innerText = sessionPeriod });
  Array.from(proposerSpans).forEach(span => { span.innerText = (proposer) ? proposer : "所有立委" });

  if (keyword === "") { return; }
  //Toggle section.results when retrieving searsh results
  const resultSections = document.getElementsByClassName('results');
  resultSections[0].style.display = 'none';
  resultSections[1].style.display = '';
  resultSections[2].style.display = 'none';

  //search filter
  sessionPeriodCount = Array(8).fill(0);
  proposerCount = {};
  lawCount = {};
  lawCode = {};
  billProgressCount = {};

  //Lookup bills for each law-id (only top 10 result and propose by legislator for now)
  let bill_query = "https://ly.govapi.tw/v1/bill" +
    "?proposal_type=委員提案" +
    "&field=議案流程&field=提案人&field=last_time&field=案由&field=laws" +
    `&term=${term}&q=\"${keyword}\"&aggs=會期&aggs=提案人&aggs=laws&aggs=議案狀態`;
  if (sessionPeriod) { bill_query += `&sessionPeriod=${sessionPeriod}`; }
  if (proposer) { bill_query += `&proposer=${encodeURIComponent(proposer)}` }
  const billResponse = await fetch(bill_query);
  billsData = await billResponse.json();
  if (billsData.total.value === 0) { return; }
  sessionPeriodCount = countSessionPeriod(billsData.aggs.會期, sessionPeriodCount);
  billProgressCount = countFilter(billsData.aggs.議案狀態, billProgressCount);
  proposerCount = countFilter(billsData.aggs.提案人, proposerCount);
  lawCount = countFilter(billsData.aggs.laws, lawCount, 'law');
  for (lawObject of billsData.aggs.laws) {
    const lawResponse = await fetch(`https://ly.govapi.tw/v1/law/${lawObject.value}`);
    lawData = await lawResponse.json();
    if (lawData.hasOwnProperty('name')) {
      lawCode[lawObject.value] = lawData.name;
    }
  }

  //Order final result by last_time
  bills = billsData.bills;
  bills.sort(compareDate);

  //Toggle results section when no bills
  if (!bills.length) {
    resultSections[0].style.display = 'none';
    resultSections[1].style.display = 'none';
    resultSections[2].style.display = '';
  }

  //Lookup legislators' data for checking party later
  const legislatorResponse = await fetch(`https://ly.govapi.tw/v1/legislator/${term}?page=1&limit=500`);
  const legislatorData = await legislatorResponse.json();
  const legislators = legislatorData.legislators;

  //Build filter options
  buildFilterOptions("sessionPeriod", sessionPeriodCount, term);
  buildFilterOptions("proposer", proposerCount);
  buildFilterOptions("law", lawCount, null, lawCode);
  buildFilterOptions("billProgress", billProgressCount);

  const containerDiv = document.getElementById('bill-list');
  for (const bill of bills) {
    //Build html element to display each bills
    buildBillResults(containerDiv, bill, legislators);
    //Insert bill data into allBills(global variable)
    setAllBills(bill);
  }
  allBillOptionsCount = countBillFieldValues(allBills);

  //Build div.page depend on bills.length
  buildPageDiv(containerDiv, bills.length);
}

function buildFilterOptions(fieldName, options, term, lawCode) {
  const fieldDiv = document.getElementsByClassName(`${fieldName}-options`)[0];
  const isSessionPeriod = (fieldName === "sessionPeriod");
  const isLaw = (fieldName === "law");
  const length = options.length //used when isSessionPeriod === true
  for (let key in options) {
    if (options[key] === 0) { continue; }
    let text = (isSessionPeriod) ? `第${term}屆第${length - key}會期`: key;
    let inputId = (isSessionPeriod) ? `${fieldName}-${length - key}` : `${fieldName}-${key}`;
    if (isLaw) {
      text = lawCode[key];
      inputId = `${fieldName}-${key}`;
    }
    const optionLabel = document.createElement('label');
    const optionInput = document.createElement('input');
    optionInput.setAttribute('type', 'checkbox');
    optionInput.classList.add('filter-option');
    optionInput.id = inputId;
    //add event listener
    optionInput.addEventListener('change', () => updateFilters(optionInput));
    const textSpan = document.createElement('span');
    textSpan.innerText = text;
    const countSpan = document.createElement('span');
    countSpan.id = `count-${inputId}`;
    countSpan.innerText = `(${options[key]})`;
    countSpan.classList.add('option-count');
    optionLabel.appendChild(optionInput);
    optionLabel.appendChild(textSpan);
    optionLabel.appendChild(countSpan);
    fieldDiv.appendChild(optionLabel);
  }
}

function countSessionPeriod(aggs, sessionPeriodCount) {
  const length = sessionPeriodCount.length;
  for (const payload of aggs) {
    const index = length - payload.value;
    const count = payload.count;
    sessionPeriodCount[index] += count;
  }
  return sessionPeriodCount;
}

function countFilter(aggs, filterCount) {
  for (const payload of aggs) {
    let title = payload.value;
    const count = payload.count;
    if (count === 0) { continue; }
    if (filterCount.hasOwnProperty(title)) {
      filterCount[title] += count;
      continue;
    }
    filterCount[title] = count;
  }
  return filterCount;
}

function buildBillResults(root, bill, legislators) {
  //Build root <div> element
  const billRootDiv = document.createElement('div');
  //billRootDiv.href = `bills.html?billNo=${bill.billNo}`;

  billRootDiv.className = 'result';
  billRootDiv.id = bill.billNo;

  //Build <div class="title">
  const titleA = document.createElement('a');
  titleA.className = 'title';
  titleA.innerText = renderTitle(bill.議案名稱);
  titleA.href = `bills.html?billNo=${bill.billNo}`;
  titleA.target = '_blank';
  billRootDiv.appendChild(titleA);

  //Build <div class="status">
  let statusDiv = document.createElement('div');
  statusDiv.className = 'status';
  statusDiv = buildStatusDiv(statusDiv, bill.議案狀態, bill.last_time);
  billRootDiv.appendChild(statusDiv);

  //Build <div class="desc">
  const descriptionDiv = document.createElement('div');
  descriptionDiv.className = 'desc';
  descriptionDiv.innerText = bill.案由 ?? '查無立法理由資料';
  billRootDiv.appendChild(descriptionDiv);

  //Build <div class="legislators">
  let legislatorsDiv = document.createElement('div');
  legislatorsDiv.className = 'legislators';
  legislatorsDiv.innerText = '提案委員：';
  legislatorsDiv = buildLegislatorsDiv(legislatorsDiv, legislators, bill.提案人);
  billRootDiv.appendChild(legislatorsDiv);

  root.appendChild(billRootDiv);
}

function renderTitle(title) {
  if (title.substring(0, 2) === "廢止") {
    title = title.split("，")[0];
    title = title.replace(/[「」]/g, '');
  } else if (title.indexOf("「") >= 0) {
    const startIdx = title.indexOf("「");
    const endIdx = title.indexOf("」");
    title = title.substring(startIdx + 1, endIdx);
  }
  return title
}

function buildStatusDiv(statusDiv, theStatus, date) {
  if ([theStatus,date].includes(undefined)) { return statusDiv; }
  const statusLogoSpan = document.createElement('span');
  statusLogoSpan.className = 'material-symbols-rounded';
  statusLogoSpan.innerText = 'clock_loader_40';
  const badgeSpan = document.createElement('span');
  badgeSpan.className = 'badge badge--inprogress';
  badgeSpan.appendChild(statusLogoSpan);
  badgeSpan.innerHTML += " " + theStatus;
  statusDiv.appendChild(badgeSpan);
  statusDiv.innerHTML += " " + date;
  return statusDiv;
}

function buildLegislatorsDiv(legislatorsDiv, legislators, proposers) {
  if (proposers === undefined) { return legislatorsDiv; }
  for (const proposer of proposers) {
    //Build <span class="badge">
    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'badge';
    const partySpan = document.createElement('span');
    partySpan.className = `party party--${partyColorCode[getPartyName(proposer, legislators)]}`;
    badgeSpan.appendChild(partySpan);
    badgeSpan.innerHTML += " " + proposer;
    legislatorsDiv.appendChild(badgeSpan);
  }
  return legislatorsDiv;
}

function buildPageDiv(root, resultCnt) {
  let pageCnt = Math.floor(resultCnt / 10);
  if (resultCnt % 10) { pageCnt++; }
  if (!pageCnt) { return; }

  // Add previous page button
  const pageDiv = document.createElement('div');
  pageDiv.className = 'pages';
  pageDiv.style.display = 'none';
  const previousPageA = document.createElement('a');
  previousPageA.innerText = '上一頁';
  previousPageA.href = '#';
  previousPageA.addEventListener('click', () => turnPage('previous', pageCnt));
  pageDiv.appendChild(previousPageA);

  // Add page buttons
  for (let i = 1; i <= pageCnt; i++) {
    const pageA = document.createElement('a');
    if (i === 1) { pageA.className = 'active '; }
    pageA.className += `page page-${i}`;
    pageA.innerText = i;
    pageA.href = '#';
    pageA.addEventListener('click', () => togglePage(i));
    pageDiv.appendChild(pageA);
  }

  // Add next page button
  const nextPageA = document.createElement('a');
  nextPageA.innerText = '下一頁';
  nextPageA.href = '#';
  nextPageA.addEventListener('click', () => turnPage('next', pageCnt));
  pageDiv.appendChild(nextPageA)

  // Add current page idx holder
  const currentIdxSpan = document.createElement('span');
  currentIdxSpan.id = 'currentIdx';
  currentIdxSpan.hidden = true;
  currentIdxSpan.innerText = 1;
  pageDiv.appendChild(currentIdxSpan);

  root.appendChild(pageDiv);
}

function togglePage(pageIdx) {
  const results = document.getElementsByClassName('result');
  const currentPageSpan = document.getElementById('currentIdx');
  const pages = document.getElementsByClassName('page');

  // Toggle 'active'
  currentPageIdx = currentPageSpan.innerText;
  pages[currentPageIdx - 1].classList.remove('active');
  pages[pageIdx - 1].classList.add('active');
  currentPageSpan.innerText = pageIdx;

  // Toggle items
  for (result of results) {
    result.style.display = (result.classList.contains(`in-page-${pageIdx}`)) ? '' : 'none';
  }
}

function turnPage(type, maxPageIdx) {
  const currentPageSpan = document.getElementById('currentIdx');
  currentPageIdx = parseInt(currentPageSpan.innerText);

  if (type === 'previous' && currentPageIdx === '1') { return; }
  if (type === 'next' && currentPageIdx === maxPageIdx) { return; }

  const results = document.getElementsByClassName('result');
  const pages = document.getElementsByClassName('page');

  // Toogle 'active'
  pages[currentPageIdx - 1].classList.remove('active');
  if (type === 'previous') { currentPageIdx = currentPageIdx - 1 }
  if (type === 'next') { currentPageIdx = currentPageIdx + 1; }
  pages[currentPageIdx - 1].classList.add('active');

  // Toggle items
  for (result of results) {
    result.style.display = (result.classList.contains(`in-page-${currentPageIdx}`)) ? '' : 'none';
  }

  //Update current page index to holder
  currentPageSpan.innerText = currentPageIdx;
}

function compareDate(billA, billB) {
  return (billA.last_time < billB.last_time) ? 1 : -1;
}

function getPartyName(name, legislators) {
  legislators = legislators.filter((legislator) => legislator.name === name);
  if (legislators.length === 1){ return legislators[0].party; }
  return "";
}

//0無黨籍 民進黨1 社民黨2 台灣基進3 時代力量4 綠黨5 民眾黨6 國民黨7
const partyColorCode = {
  無黨籍 : 0,
  民主進步黨 : 1,
  社會民主黨 : 2,
  台灣基進 : 3,
  時代力量 : 4,
  綠黨 : 5,
  台灣民眾黨 : 6,
  中國國民黨 : 7,
}

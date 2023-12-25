renderData();

async function renderData() {
  const GET_query = document.location.search.match(/q=([^&]*)/);
  let query = (GET_query) ? GET_query[1] : "";
  query = decodeURIComponent(encodeURIComponent(query));
  if (query === "") { return; }
  const keywordSpans = document.getElementsByClassName('query-keyword');
  for (span of keywordSpans) {
    span.innerText = decodeURIComponent(query);
  }
  //Toggle section.results when retrieving searsh results
  const resultSections = document.getElementsByClassName('results');
  resultSections[0].style.display = '';
  resultSections[1].style.display = 'none';

  //Lookup law id by query (only root law for now)
  const lawResponse = await fetch(`https://ly.govapi.tw/law?type=母法&q=${query}`);
  const lawData = await lawResponse.json();
  if (lawData.total.value === 0) { return; }

  //Lookup bills for each law-id (only top 10 result and propose by legislator for now)
  let bills = [];
  for (law of lawData.laws) {
    const query_url = "https://ly.govapi.tw/bill" +
                      "?proposal_type=委員提案" +
                      "&field=議案流程&field=提案人&field=last_time&field=案由&limit=10" +
                      `&law=${law.id}`;
    const billResponse = await fetch(query_url);
    const billsData = await billResponse.json();
    bills.push(...billsData.bills);
  }

  //Order final result by last_time
  bills.sort(compareDate);

  //Toggle results section when no bills
  if (!bills.length) {
    resultSections[0].style.display = 'none';
    resultSections[1].style.display = '';
  }

  //Lookup legislators' data for checking party later
  const legislatorResponse = await fetch(`https://ly.govapi.tw/legislator/10?page=1&limit=500`);
  const legislatorData = await legislatorResponse.json();
  const legislators = legislatorData.legislators;

  //Build html element to display each bills
  const containerDiv = resultSections[0].getElementsByClassName('container')[0];
  // Get index and bill
  for (let i = 0; i < bills.length; i++) {
    buildBillResults(containerDiv, bills[i], i, legislators);
  }

  //Build div.page depend on bills.length
  buildPageDiv(containerDiv, bills.length);
}

function buildBillResults(root, bill, idx, legislators) {
  //Build root <a> element
  idx++;
  let page = Math.floor((idx) / 10);
  if (idx % 10 > 0) { page++; }
  const billRootA = document.createElement('a');
  billRootA.href = `bills.html?billNo=${bill.billNo}`;
  if (page > 1) { billRootA.style.display = 'none'; }

  billRootA.className = `result in-page-${page}`;
  billRootA.target = '_blank';

  //Build <div class="title">
  const titleDiv = document.createElement('div');
  titleDiv.className = 'title';
  titleDiv.innerText = renderTitle(bill.議案名稱);
  billRootA.appendChild(titleDiv);

  //Build <div class="status">
  let statusDiv = document.createElement('div');
  statusDiv.className = 'status';
  statusDiv = buildStatusDiv(statusDiv, bill.議案流程);
  billRootA.appendChild(statusDiv);

  //Build <div class="desc">
  const descriptionDiv = document.createElement('div');
  descriptionDiv.className = 'desc';
  descriptionDiv.innerText = bill.案由;
  billRootA.appendChild(descriptionDiv);

  //Build <div class="legislators">
  let legislatorsDiv = document.createElement('div');
  legislatorsDiv.className = 'legislators';
  legislatorsDiv.innerText = '相關委員：';
  legislatorsDiv = buildLegislatorsDiv(legislatorsDiv, legislators, bill.提案人);
  billRootA.appendChild(legislatorsDiv);

  root.appendChild(billRootA);
}

function renderTitle(title) {
  if (title.substring(0, 2) === "廢止") {
    title = title.split("，")[0];
    title = title.replace(/[「」]/g, '');
  } else {
    const startIdx = title.indexOf("「");
    const endIdx = title.indexOf("」");
    title = title.substring(startIdx + 1, endIdx);
  }
  return title
}

function buildStatusDiv(statusDiv, progresses) {
  if (progresses === undefined || !progresses.length) { return statusDiv; }
  const latestProgress = progresses.slice(-1)[0];
  const theStatus = latestProgress.狀態;
  const date = latestProgress.日期.slice(-1)[0];
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
  const previousPageA = document.createElement('a');
  previousPageA.innerText = '上一頁';
  previousPageA.href = '#';
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
  pageDiv.appendChild(nextPageA)

  root.appendChild(pageDiv);
}

function togglePage(page) {
  const results = document.getElementsByClassName('result');
  for (result of results) {
    if (result.classList.contains(`in-page-${page}`)) {
      result.style.display = '';
    } else {
      result.style.display = 'none';
    }
  }
  const pages = document.getElementsByClassName('page');
  //remove active class from all pages
  //add active class to page
  for (let i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
    if (i + 1 === page) {
      pages[i].classList.add('active');
    }
  }
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

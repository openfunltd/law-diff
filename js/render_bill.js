async function renderData(){
  if (window.location.hostname === "openfunltd.github.io") {
    homeATags = document.getElementsByClassName('home');
    Array.from(homeATags).forEach(aTag => { aTag.href = "/law-diff/"; })
  }

  const GET_billNo = document.location.search.match(/billNo=([0-9]*)/);
  //202103139970000 20委10033531
  //202103113910000 20委10030929
  //201103147900000 20政10034320
  let billNo = (GET_billNo) ? GET_billNo[1] : 202103113910000;
  billNo = encodeURIComponent(billNo);
  const billResponse = await fetch(`https://ly.govapi.tw/bill/${billNo}`);
  const billData = await billResponse.json();
    
  let billName = billData.議案名稱;
  billName = formatBillName(billName);
  const reason = (billData.案由 != undefined) ? billData.案由 : "無資料";
  const theFirst = (billData.提案人 != undefined) ? billData.提案人[0] : "無資料";
  const sessionPeriod = billData.屆期;
  const legislatorResponse = await fetch(`https://ly.govapi.tw/legislator/${sessionPeriod}?limit=200`)
  const legislatorData = await legislatorResponse.json(); 
  const [partyTheFirst, picUrlTheFirst] = getLegislatorData(theFirst, legislatorData);
  const data = {"billData": billData, "legislatorData": legislatorData};

  document.getElementById('billName').innerText = billName;
  document.getElementById('reason').innerText = reason;
  document.getElementById('text-theFirst').innerText = theFirst;
  document.getElementById('party-theFirst').classList.add(`party--${partyColorCode[partyTheFirst]}`);
  const imgTheFirst = document.getElementById('img-theFirst');
  imgTheFirst.src = picUrlTheFirst;
  imgTheFirst.alt = theFirst;

  const mainDiv = document.querySelector('.main');
  const mainDivObserver = new MutationObserver(() => dispatchSection(data, mainDivObserver));
  mainDivObserver.observe(mainDiv, {childList: true, subtree: true});

  //Set ppg_url
  const ppgEle= document.getElementById('origin');
  ppgEle.href = billData.ppg_url;
}

function dispatchSection(data, observer) {
  const comparationDivs = document.getElementsByClassName('comparation');
  const progressDivs = document.getElementsByClassName('progress');
  const legislatorsDivs = document.getElementsByClassName('legislators');
  const billData = data.billData;
  const legislatorData = data.legislatorData;
  observer.disconnect();
  if (progressDivs.length > 0) {
    renderProgress(billData.議案流程);
  } else if (legislatorsDivs.length > 0) {
    let nonFirsts = [];
    const cosigners = (billData.連署人 != undefined) ? billData.連署人 : [];
    if (billData.提案人 != undefined && billData.提案人.length > 1) {
      nonFirsts = billData.提案人.slice(1);
    }
    renderLegislatorsSection(nonFirsts, cosigners, legislatorData);
  }
  const mainDiv = document.querySelector('.main');
  observer.observe(mainDiv, {childList: true, subtree: true});
}

function getIdString(row) {
  let idString = "";
  if (row.現行 !== undefined && row.現行 !== "") {
    idString = row.現行.replace(/　/g, ' ').split(' ')[0];
  } else if (row.修正 !== undefined && row.修正 !== "") {
    idString = row.修正.replace(/　/g, ' ').split(' ')[0];
  } else if (row.增訂 !== undefined && row.增訂 !== "") {
    idString = row.增訂.replace(/　/g, ' ').split(' ')[0];
  }
  return idString;
}

async function getComparationData() {
  const GET_billNo = document.location.search.match(/billNo=([0-9]*)/);
  let billNo = (GET_billNo) ? GET_billNo[1] : 202103113910000;
  const billResponse = await fetch(`https://ly.govapi.tw/bill/${billNo}`);
  const billData = await billResponse.json();
  const relatedBillResponse = await fetch(`https://ly.govapi.tw/bill/${billNo}/related_bills`);
  const relatedBillDataArr = await relatedBillResponse.json();
  const billDataArr = (relatedBillDataArr.bills) ? [billData, ...relatedBillDataArr.bills] : [billData];
  if (billDataArr[0].關連議案 && billDataArr[0].關連議案.length > 1) {
    const lyRelatedBillArr = billDataArr[0].關連議案;
    const lyRelatedBillNoArr = lyRelatedBillArr.map(bill => bill.billNo);
    const billNoArr = billDataArr.map(bill => bill.billNo);
    const uncatchedlyRelatedBillNoArr = lyRelatedBillNoArr.filter(billNo => !billNoArr.includes(billNo));
    for (const billNo of uncatchedlyRelatedBillNoArr) {
      const billResponse = await fetch(`https://ly.govapi.tw/bill/${billNo}`);
      const billData = await billResponse.json();
      billDataArr.push(billData);
    }
  }

  let versions = [{}]; //The frist object is for '現行法律' which is hidden for now.
  let currentLaws = [];

  //Figure out how many groups of law-diff.
  for (const billData of billDataArr) {
    if (billData.對照表 === undefined){ continue; }
    let version = {};
    version.billName = formatBillName(billData.議案名稱);
    version.versionName = billData['提案單位/提案委員'];
    const proposers = (billData.提案人) ? billData.提案人 : [];
    version.nonMainFirstProposer = proposers.slice(1).join('、');
    version.billNo = billData.提案編號;
    version.billDate = billData.first_time;
    versions.push(version);
    const rows = billData.對照表[0].rows;
    for (const row of rows) {
      const idString = getIdString(row);
      const currentLawIndex = currentLaws.findIndex((law) => law.idString === idString);
      if (currentLawIndex === -1) {
        const currentLaw = (row.現行) ? row.現行 : null;
        currentLaws.push({"idString": idString, "currentLaw": currentLaw})
      }
    }
  }

  //Build variable bills for frontend to render/display
  let bills = [];
  for (const law of currentLaws) {
    let bill = {
      "title": law.idString,
      "diff": (law.currentLaw !== null || law.currentLaw !== ""),
      "versions": [
        {
          "content": law.currentLaw,
          "passed": false,
          "comment": null,
          "reason": null,
        }
      ]
    }
    bills.push(bill);
  }
  for (let i = 0; i < currentLaws.length; i++) {
    const idString = currentLaws[i].idString;
    for (const billData of billDataArr) {
      if (billData.對照表 === undefined){ continue; }
      let payload = {"content": null, "passed": false, "comment": null, "reason": null};
      const rows = billData.對照表[0].rows;
      for (const row of rows) {
        const diffIdString = getIdString(row);
        if (diffIdString === idString){
          if (row.修正 != undefined) {
            payload.content = row.修正;
          } else if (row.增訂 != undefined) {
            payload.content = row.增訂;
          }
          payload.reason = row.說明;
          break;
        }
      }
      bills[i].versions.push(payload);
    }
  }
  return [versions, bills];
}

function getLegislatorData(name, legislatorData) {
  const legislators = legislatorData.legislators.filter((legislator) => legislator.name === name);
  if (legislators.length === 1){
    const picUrl = legislators[0].picUrl.replace("http://", "https://");
    return [legislators[0].party, picUrl];
  }
  return ["", ""];
}

function renderProgress(progressData) {
  const progressDiv = document.getElementById('bill_progress');
  const progress_ongoing = '<span class="material-symbols-rounded"> update </span> ';
  const progress_done = '<span class="material-symbols-rounded"> check </span> ';
  const progress_error = '<span class="material-symbols-rounded"> error </span> ';
  if (progressData === undefined || progressData.length === 0) {
    const progressH3 = document.createElement('h3');
    progressH3.innerHTML = progress_error + '無資料';
    progressDiv.appendChild(progressH3);
    return;
  }
  isFirst = true;
  for (const progress of progressData.reverse()) {
    const progressH3 = document.createElement('h3');
    if (isFirst) {
      isFirst = false;
      progressH3.innerHTML = progress_ongoing + progress.狀態;
    } else {
      progressH3.innerHTML = progress_done + progress.狀態;
    }
    progressDiv.appendChild(progressH3);
  }
}

function renderLegislatorsSection(nonFirsts, cosigners, legislatorData) {
  const nonFirstsDiv = document.getElementById('nonFirsts');
  const cosignersDiv = document.getElementById('cosigners');
  if (nonFirstsDiv != null && nonFirsts.length != 0) {
    for (const nonFirst of nonFirsts) {
      const [party, picUrl] = getLegislatorData(nonFirst, legislatorData);
      nonFirstsDiv.appendChild(buildlegislatorDiv("nonFirsts", nonFirst, party, picUrl));
    }
  }
  if (cosignersDiv != null && cosigners.length != 0) {
    for (const cosigner of cosigners) {
      const [party, picUrl] = getLegislatorData(cosigner, legislatorData);
      cosignersDiv.appendChild(buildlegislatorDiv("cosigners", cosigner, party, picUrl));
    }
  }
}

function buildlegislatorDiv(listName, name, party, picUrl) {
  const legislatorDiv = document.createElement('div');
  if (listName === "nonFirsts") {
    legislatorDiv.className = 'legislator';
  } else if (listName === "cosigners") {
    legislatorDiv.className = 'legislator legislator--sm';
  }
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'avatar';
  const partySpan = document.createElement('span');
  partySpan.className = `party party--${partyColorCode[party]}`;
  const img = document.createElement('img');
  img.src = picUrl;
  img.alt = name;
  const nameDiv = document.createElement('div');
  nameDiv.textContent = name;

  avatarDiv.appendChild(partySpan);
  avatarDiv.appendChild(img);
  legislatorDiv.appendChild(avatarDiv);
  legislatorDiv.appendChild(nameDiv);

  return legislatorDiv;
}

function formatBillName(billName) {
  if (billName.substring(0, 2) === "廢止") {
    billName = billName.split("，")[0];
    billName = billName.replace(/[「」]/g, '');
  } else {
    const startidx = billName.indexOf("「");
    const endidx = billName.indexOf("」");
    billName = billName.substring(startidx + 1, endidx);
  }
  return billName;
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

export {
  renderData,
  getComparationData,
  getIdString,
  getLegislatorData,
  renderProgress,
  renderLegislatorsSection,
  buildlegislatorDiv,
  formatBillName,
  partyColorCode
}
renderData();

async function renderData(){
  //const billResponse = await fetch("https://ly.govapi.tw/bill/20委10033531");
  const billResponse = await fetch("https://ly.govapi.tw/bill/20委10030929");
  //const billResponse = await fetch("https://ly.govapi.tw/bill/20政10034320");
  const billData = await billResponse.json();
    
  let billName = billData.議案名稱;
  if (billName.substring(0, 2) === "廢止") {
    billName = billName.split("，")[0];
    billName = billName.replace(/[「」]/g, '');
  } else {
    const startIdx = billName.indexOf("「");
    const endIdx = billName.indexOf("」");
    billName = billName.substring(startIdx + 1, endIdx);
  }
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
  mainDivObserver = new MutationObserver(() => dispatchSection(data));
  mainDivObserver.observe(mainDiv, {childList: true});
}

function dispatchSection(data) {
  const progressDivs = document.getElementsByClassName('progress');
  const legislatorsDivs = document.getElementsByClassName('legislators');
  const billData = data.billData;
  const legislatorData = data.legislatorData;
  if (progressDivs.length > 0) {
    //TODO
  } else if (legislatorsDivs.length > 0) {
    let nonFirsts = [];
    const cosigners = (billData.連署人 != undefined) ? billData.連署人 : [];
    if (billData.提案人 != undefined && billData.提案人.length > 1) {
      nonFirsts = billData.提案人.slice(1);
    }
    renderLegislatorsSection(nonFirsts, cosigners, legislatorData);
  }
}

async function getComparationData() {
  const GET_billNo = document.location.search.match(/billNo=([0-9]*)/);
  let billNo = (GET_billNo) ? GET_billNo[1] : 202103113910000;
  const billResponse = await fetch(`https://ly.govapi.tw/bill/${billNo}`);
  const billData = await billResponse.json();
  let billDataArr = [billData];
  for (const relatedBill of billData.關連議案){
    const relatedBillResponse = await fetch(`https://ly.govapi.tw/bill/${relatedBill.billNo}`);
    const relatedBillData = await relatedBillResponse.json();
    billDataArr.push(relatedBillData);
  }
  let versions = ['現行條文'];
  for (const billData of billDataArr) {
    versions.push(billData['提案單位/提案委員']);
  }
  return versions;
}

function getLegislatorData(name, legislatorData) {
  const legislators = legislatorData.legislators.filter((legislator) => legislator.name === name);
  if (legislators.length === 1){
    const picUrl = legislators[0].picUrl.replace("http://", "https://");
    return [legislators[0].party, picUrl];
  }
  return ["", ""];
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

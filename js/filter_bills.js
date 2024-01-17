function filterBills(inputEle) {
  const [filterType, target] = inputEle.id.split('-');
  const filterInputs = document.getElementsByClassName('filter-option');
  const checkedInputs = Array.from(filterInputs).filter((ele) => ele.checked);
  updateFilterCount(filterType, checkedInputs);
  //console.log(inputEle.checked);
}

function updateFilterCount(filterType, checkedInputs) {
  let sessionPeriodFilters = [];
  let lawFilters = [];
  let billProgressFilters = [];
  let proposerFilters = [];
  for (const checkedInput of checkedInputs) {
    const [filterType, target] = checkedInput.id.split('-');
    switch (filterType) {
      case "sessionPeriod":
        sessionPeriodFilters.push(target);
        break;
      case "law":
        lawFilters.push(target);
        break;
      case "billProgress":
        billProgressFilters.push(target);
        break;
      case "proposer":
        proposerFilters.push(target);
        break;
    }
  }
}

function setAllBills(bill) {
  let payload = {};
  payload.billNo = bill.billNo;
  payload.sessionPeriod = bill.會期;
  payload.laws = bill.laws;
  payload.billProgress = bill.議案狀態;
  payload.proposers = bill.提案人;
  allBills.push(payload);
}

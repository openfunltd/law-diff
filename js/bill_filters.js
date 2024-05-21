function updateFilters(inputEle) {
  const filterInputs = document.getElementsByClassName('filter-option');
  const checkedInputs = Array.from(filterInputs).filter((ele) => ele.checked);
  let filteredBills = allBills;

  //Replay filter in the order of sessionPeriod, law, billProgress, proposer
  updateOptionsCount(allBillOptionsCount);
  for (const filterType of ["sessionPeriod", "law", "billProgress", "proposer"]) {
    const payload = filterBills(filteredBills, checkedInputs, filterType);
    filteredBills = payload[0];
    const isFiltered = payload[1];
    if (isFiltered) {
      const optionsCount = countBillFieldValues(filteredBills);
      updateOptionsCount(optionsCount, filterType);
    }
  }
  toggleBillVisibility(filteredBills);
}

function toggleBillVisibility(filteredBills) {
  billElements = document.getElementsByClassName('result');
  for (billEle of billElements) {
    const ID = billEle.id;
    isTargetBill = filteredBills.some(bill => bill.billNo === ID);
    if (isTargetBill) {
      billEle.style.display = 'block';
      continue;
    }
    billEle.style.display = 'none';
  }
}

function updateOptionsCount(optionsCount, filterType) {
  inputEles = document.getElementsByClassName('filter-option');
  countSpans = document.getElementsByClassName('option-count');
  for (let i = 0; i < inputEles.length; i++) {
    const ID = inputEles[i].id
    const field = ID.split('-')[0];
    if (field === filterType) { continue; }
    const hasCount = optionsCount.hasOwnProperty(ID);
    countSpans[i].innerText = (hasCount) ? `(${optionsCount[ID]})` : '';
    inputEles[i].disabled = !hasCount;
    inputEles[i].checked = inputEles[i].checked && hasCount;
  }
}

function countBillFieldValues(filteredBills) {
  const fields = ['sessionPeriod', 'law', 'billProgress', 'proposer'];
  const optionsCount = {};
  for (const field of fields) {
    for (const bill of filteredBills) {
      let values = [];
      switch (field) {
        case "sessionPeriod":
          values.push(bill.sessionPeriod);
          break;
        case "law":
          if (bill.laws != undefined) {
            values = bill.laws;
          } else {
            values = ["00000"];
          }
          break;
        case "billProgress":
          values.push(bill.billProgress);
          break;
        case "proposer":
          if (bill.proposers) { values = bill.proposers; }
          break;
      }
      for (const value of values) {
        filterID = `${field}-${value}`;
        if (optionsCount.hasOwnProperty(filterID)) {
          optionsCount[filterID] += 1;
          continue;
        }
        optionsCount[filterID] = 1;
      }
    }
  }
  return optionsCount;
}

function filterBills(filteredBills, checkedInputs, filterType) {
  let filters = [];
  for (const checkedInput of checkedInputs) {
    const [field, target] = checkedInput.id.split('-');
    if (filterType === field) {
      filters.push((filterType === "sessionPeriod") ? parseInt(target) : target);
    }
  }
  if (filters.length === 0) { return [filteredBills, false]; }
  switch (filterType) {
    case "sessionPeriod":
      filteredBills = filteredBills.filter((bill) => filters.includes(bill.sessionPeriod))
      break;
    case "law":
      filteredBills = filteredBills.filter((bill) => filters.some(function (law) {
        if (bill.laws === undefined) {
            return false;
        }
        return bill.laws.includes(law);
      }));
      break;
    case "billProgress":
      filteredBills = filteredBills.filter((bill) => filters.includes(bill.billProgress))
      break;
    case "proposer":
      filteredBills = filteredBills.filter((bill) =>
        filters.some((proposer) => bill.proposers.includes(proposer))
      );
      break;
  }
  return [filteredBills, true];
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

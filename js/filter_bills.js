function filterBills() {
  const filterInputs = document.getElementsByClassName('filter-option');
  //filterInputs is not an array, but a HTMLCollection
  //Use Array.from() to convert it to an array
  const checkedInputs = Array.from(filterInputs).filter((ele) => ele.checked);
  console.log(checkedInputs);
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

// const { ref, createApp, onMounted } = Vue

document.addEventListener('DOMContentLoaded', () => {
  const { ref, createApp, onMounted } = Vue

  const bills = {
    setup () {
      const billVersions = ref([])
      const billsData = ref([])

      if (versions && versions.length) {
        billVersions.value = versions.slice(1, versions.length)
      }
      if (bills && bills.length) {
        billsData.value = bills
      }

      return {
        billVersions,
        billsData
      }
    }
  }
  if (versions && versions.length && bills && bills.length) {
    const app = createApp(bills)
    app.mount('.comparation')
  }
})
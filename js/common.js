import Diff from './text_diff.js'

const { ref, computed, createApp, onMounted } = Vue

const common = {
  setup () {
    // ---------- 共用 ----------
    // 是否顯示rwd menu
    const rwdMenuVisible = ref(false)

    // ---------- 搜尋頁 ----------
    // 小畫面模式是否顯示二次篩選條件
    const rwdFilterOptionsVisible = ref(false)

    // ---------- 議案頁 ----------
    // 議案頁的兩個對照版本 0為現行條文 -1為通過條文 其他請參考網頁中的versions
    const billViewing = ref('comparation') // 預設顯示法案對照表

    const selectedVersions = ref([])

    // 議案頁版本修改者與修改內容
    const billVersions = ref([])
    const billsData = ref([])
    let versions = [];

    const loadComparationData = async () => {
      const [versions, bills] = await getComparationData();
      try {
        if (versions && versions.length) {
          billVersions.value = versions.slice(1, versions.length)
        }
        if (bills && bills.length) {
          billsData.value = bills
        }
      } catch {}
    }
    onMounted(loadComparationData);

    // 改成依照目前選的版本，取得有修改的聯集的條文
    const allAvailableSections = computed (() => {
      let result = []

      billsData.value.map((item, idx) => {
        return item.versions.filter((it, i) => {
          return it.content && selectedVersions.value.includes(i)
        }).length
      }).forEach((item, idx) => {
        // 交集
        // if (item === selectedVersions.value.length) {
        //   result.push(idx)
        // }
        // 聯集
        if (item) {
          result.push(idx)
        }
      })

      if (!result.length) {
        result = billsData.value.map((item, idx) => idx)
      }

      // 重新整理 selectedSections，若有不存在 allAvailableSections 的 Section 須移除
      selectedSections.value = selectedSections.value.filter(item => result.includes(item))

      return result
    })

    const selectedSections = ref([])

    function compareDiff (content1, content2) {
      const diff = new Diff()
      let textDiff = diff.main(content1, content2)
      return diff.prettyHtml(textDiff)
    }

    return {
      rwdMenuVisible,
      rwdFilterOptionsVisible,

      billViewing,
      billVersions,
      billsData,
      selectedVersions,
      allAvailableSections,
      selectedSections,

      compareDiff
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(common)
  app.mount('._congress')
})

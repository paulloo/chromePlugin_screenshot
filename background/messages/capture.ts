import {
  sendToBackground,
  sendToBackgroundViaRelay,
  sendToContentScript,
  type PlasmoMessaging
} from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message)
        } else {
          // 假设你有一个res对象，你可能需要确保这个对象在background脚本中是可用的
          res.send({ screenshotUrl: dataUrl })
        }
      })
//   function onTabUpdated(tabId, changeInfo, tab) {
//     if (changeInfo.status === "loading") {
//       console.log("Page is loading")
//     } else if (changeInfo.status === "complete") {
//       chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
//         if (chrome.runtime.lastError) {
//           console.error(chrome.runtime.lastError.message)
//         } else {
//           // 假设你有一个res对象，你可能需要确保这个对象在background脚本中是可用的
//           res.send({ screenshotUrl: dataUrl })
//         }

//         // 根据需要移除监听器
//         chrome.tabs.onUpdated.removeListener(onTabUpdated)
//       })
//     }
//   }

//   // 添加监听器
//   chrome.tabs.onUpdated.addListener(onTabUpdated)
}

export default handler

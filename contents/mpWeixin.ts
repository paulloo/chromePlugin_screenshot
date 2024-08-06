import type { PlasmoCSConfig } from "plasmo"
import { sendToBackground } from "@plasmohq/messaging"
import Handlebars from "handlebars";

export const config: PlasmoCSConfig = {
  matches: ["https://mp.weixin.qq.com/*"]
}

const tmp = ""

window.addEventListener("load", () => {
  // document.body.style.background = "blue"
})


// 创建 Worker
const worker = new Worker(new URL("~core/worker.ts", import.meta.url));


// 接收 Worker 的消息
worker.onmessage = (event) => {
  console.log("Received from worker:", event.data);
};
 


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "setArticleToRichText") {
      // 发送消息给 Worker
      worker.postMessage(10);

      // const finalDataUrl = await doRichText(message.data)
      const iframeElement = document.querySelector("#ueditor_0") as HTMLIFrameElement;
      const innerDoc = iframeElement?.contentWindow?.document;
      if (innerDoc) {
          const bodyElement = innerDoc.querySelector("body");
          if (bodyElement) {
         
          // 编译模板
         
          console.log("contents htmlString: ", message.data)
          bodyElement.innerHTML = message.data;
          }
      }
      sendResponse({
        finalDataUrl: message.data
      })
    }
    return true // 需要异步响应
  })
// async function sendBk() {
//   const resp = await sendToBackground({
//     name: "ping",
//     body: {
//       id: 123
//     },
//     // extensionId: process.env.PLASMO_PUBLIC_EXTENSION_ID // find this in chrome's extension manager
//     extensionId: 'dibhfckmodmfeoiopkjfabppkkkhkmie'
//   })
//   console.log('baidu res: ', resp)
// }

// sendBk()

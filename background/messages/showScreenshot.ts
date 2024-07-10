import axios from "axios"
import dayjs from "dayjs"
import { sleep } from "radash"

import type { PlasmoMessaging } from "@plasmohq/messaging"
import { usePort } from "@plasmohq/messaging/hook"
import { getPort } from "@plasmohq/messaging/port"
import { Storage } from "@plasmohq/storage"

const storage = new Storage({
  area: "local"
})

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  // function saveBlobToFile(url, filename) {

  //   if(chrome.downloads) {
  //     chrome.downloads.download(
  //       {
  //         url: url,
  //         filename: filename,
  //         conflictAction: "overwrite",
  //         saveAs: true
  //       },
  //       (downloadId) => {
  //         if (chrome.runtime.lastError) {
  //           console.error(chrome.runtime.lastError.message)
  //         } else {
  //           console.log("Download started with ID:", downloadId)
  //         }

  //         URL.revokeObjectURL(url)
  //       }
  //     )
  //   }

  // }
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("captureDatabase", 1)

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", { keyPath: "id", autoIncrement: true })
        }
      }

      request.onsuccess = (event) => {
        resolve(event.target.result)
      }

      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  }

  function saveFilePathToDB(filePath) {
    openDatabase()
      .then((db) => {
        const transaction = db.transaction(["files"], "readwrite")
        const objectStore = transaction.objectStore("files")
        const request = objectStore.add({ path: filePath })

        request.onsuccess = () => {
          console.log("File path saved to IndexedDB.")
        }

        request.onerror = (event) => {
          console.error(
            "Error saving file path to IndexedDB:",
            event.target.error
          )
        }
      })
      .catch((error) => {
        console.error("Error opening database:", error)
      })
  }

  function writeFileEntry(writableEntry, opt_blob, callback) {
    writableEntry.createWriter(function (writer) {
      writer.onerror = callback
      writer.onwriteend = callback
      if (opt_blob) {
        writer.truncate(opt_blob.size)
        waitForIO(writer, function () {
          writer.seek(0)
          writer.write(opt_blob)
        })
      } else {
        callback()
      }
    }, callback)
  }

  function waitForIO(writer, callback) {
    var start = Date.now()
    var reentrant = function () {
      if (writer.readyState === writer.WRITING && Date.now() - start < 4000) {
        setTimeout(reentrant, 100)
        return
      }
      if (writer.readyState === writer.WRITING) {
        console.error(
          "Write operation taking too long, aborting! (current writer readyState is " +
            writer.readyState +
            ")"
        )
        writer.abort()
      } else {
        callback()
      }
    }
    setTimeout(reentrant, 100)
  }

  function base64ToBlob(base64) {
    if (typeof base64 !== "string") {
      console.log("base64 is not a string")
      return null
    }
    const parts = base64.split(",")
    const mime = parts[0].match(/:(.*?);/)[1]
    const byteCharacters = atob(parts[1])
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mime })
  }

  const captureData = {
    screenshotUrl: req.body.screenshotUrl,
    width: req.body.width,
    height: req.body.height
  }
  await storage.set("captureData", captureData)

  async function goDonePage() {
    chrome.tabs.create(
      {
        url: "./tabs/delta-flyer.html"
      },
      async (tab) => {
        chrome.tabs.onUpdated.addListener(
          async function listener(tabId, changeInfo, tab) {
            if (changeInfo.status === "loading") {
              console.log("page is loading")
            } else if (tabId === tab.id && changeInfo.status === "complete") {
              const filename = `screeshot_${tabId}.png`
              // saveBlobToFile(req.body.url, filename)
              const blob = base64ToBlob(req.body.screenshotUrl)

              const filePath = `./${filename}`
              saveFilePathToDB(filePath)

              // chrome.tabs.sendMessage(tab.id, {
              //   type: 'CAPTURE_DATA',
              //   data: captureData
              // })

              chrome.tabs.onUpdated.removeListener(listener)
            }
          }
        )
      }
    )
  }

  // const port = getPort("capture")
  // port.postMessage({
  //   screenshotUrl: req.body.screenshotUrl,
  //   width: req.body.width,
  //   height: req.body.height,
  // })

  // chrome.windows.create({
  //   url: req.body.screenshotUrl,
  //   type: 'popup',
  //   width: req.body.width,
  //   height: req.body.height
  // });
  goDonePage()

  res.send({
    status: "success"
  })
}

export default handler


import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import axios from "axios";
const storage = new Storage()
 
let timerCount = 1
let mainTimer = null
let messageTimer = null
const cozeHost = 'https://api.coze.cn'
const cozeToken = process.env.PLASMO_PUBLIC_COZE_SECRET_API
const botId = process.env.PLASMO_PUBLIC_COZE_BOT_ID
const userId = process.env.PLASMO_PUBLIC_COZE_USER_ID

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {


    console.log("cozeToken: ", process.env.PLASMO_PUBLIC_EXTENSION_ID, process.env.PLASMO_PUBLIC_COZE_SECRET_API, process.env.PLASMO_PUBLIC_COZE_BOT_ID, process.env.PLASMO_PUBLIC_COZE_USER_ID)
    async function getMessageList(conversation_id, chat_id) {

        console.log('bot complete...')
        const params = {
            conversation_id,
            chat_id
        }
        const response = await axios({
            url: `${cozeHost}/v3/chat/message/list`,
            params,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cozeToken}`,
            }
        });

        return response.data?.data
    }


    async function getMessageByConversationId(conversation_id, chat_id, durationAfter) {

        console.log('bot in progress...')
        const params = {
            conversation_id,
            chat_id
        }
        const response = await axios({
            url: `${cozeHost}/v3/chat/retrieve`,
            params,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cozeToken}`,
            }
        });

       return response.data
    }

    
    async function cozeBotApi(str) {
        try {
            const apiURL = 'https://api.coze.cn/v3/chat'
            const params = {
                bot_id: botId,
                user_id: userId,
                additional_messages: [
                    {
                        role: "user",
                        content: typeof str === 'object' ? JSON.stringify(str) : str,
                        content_type: "text"
                    }
                ],
                stream: false
            }
            console.warn('start translate ...', str)
            const response = await axios({
                url: apiURL,
                method: 'POST',
                data: params,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${cozeToken}`,
                }
            });
    
            const a = 0.01
            const L = str.length
            const b = 1

            timerCount = 1
    
            const durationAfter = (a * L + b) * 1000
            console.log('current Duration: ', durationAfter * timerCount)
            let messages = []
    
            async function processConversationResponse(_response: any) {
                const conversationResponse = await getMessageByConversationId(_response.data.conversation_id, _response.data.id, durationAfter)
    
                const errorStatus = ['created', 'failed', 'requires_action']
                const loopStatus = ['in_progress']
                const finishStatus = ['completed']
                if(errorStatus.includes(conversationResponse.data.status)) {
                    return []
                }
    
                console.log("duration: ", durationAfter * timerCount)
                if (loopStatus.includes(conversationResponse.data.status)) {
                    await new Promise(resolve => {
                        messageTimer = setTimeout(resolve, durationAfter * timerCount)
                    })
                    timerCount += 1
                    clearTimeout(messageTimer)
                    return processConversationResponse(_response)
                }
    
                if (finishStatus.includes(conversationResponse.data.status)) {
                    return await getMessageList(_response.data.conversation_id, _response.data.id)
                }
    
                return []
            }
    
            messages = await processConversationResponse(response.data)
    
            const answer = messages.find(item => item.type === "answer") || {}
            // if (answer) {
            //     const { output } = JSON.parse(answer.content)
            //     return output
            // }
            console.log('translate response: ', answer)
    
            return answer?.content? answer.content: str
        } catch(err) {
            console.error(err)
            return str
        }
    }

    async function optimizeData(data, translate = false) {

        if(!translate) {
            return data
        }

        try {
            data.title = await cozeBotApi(data.title);
            data.profile = await cozeBotApi(data.profile);

            for (let i = 0; i < data.steps.length; i++) {
                const step = data.steps[i];

                // Fetch step data
                const _stepTitle = await cozeBotApi(step.title); // Assuming step has a title property

                for (let j = 0; j < step.step_items.length; j++) {
                    const stepItem = step.step_items[j];

                    // Fetch content data
                    const _content = await cozeBotApi(stepItem.content);

                    for (let k = 0; k < stepItem.children.length; k++) {
                        const childrenItem = stepItem.children[k];

                        // Fetch children item data
                        const _childrenItem = await cozeBotApi(childrenItem);

                        stepItem.children[k] = _childrenItem;
                    }

                    step.step_items[j].content = _content;
                }

                data.steps[i].title = _stepTitle;
            }

            console.log("data: ", data);

            return data;
        } catch (error) {
            console.error("Error optimizing data: ", error);
            return data;
        }
    }

  console.log("req.body: ", req.body)
  


  try {
    const apiURL = 'http://111.231.107.70:5508/fetch_content'
    const response = await axios.post(apiURL, req.body);
    const data = response.data
    // const data ={}
    // 在这里可以处理获取到的数据
    // const testData = await cozeBotApi('hello test...');
    // console.log("testData: ", testData);
    
    const translate = true
    const result = await optimizeData(data, translate);
    // const result = data;
    res.send({
      message: result
    })
  } catch (error) {
    console.error("Fetching data failed", error);
    // 处理错误情况
  }

  // res.send({
  //   message
  // })
}

 
export default handler
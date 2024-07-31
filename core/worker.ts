
// worker.ts
self.onmessage = (event) => {
    // 处理接收到的消息
    const result = performHeavyComputation(event.data);
    self.postMessage(result);
  };
  
  function performHeavyComputation(data) {
    // 执行复杂的计算
    return data * 2; // 示例计算
  }
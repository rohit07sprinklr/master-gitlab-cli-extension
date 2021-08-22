function fetchStream(url, onChunkReceive) {
  const decoder = new TextDecoder("utf-8");

  return fetch(url)
    .then((r) => r.body)
    .then((rs) => {
      // @ts-ignore
      const reader = rs.getReader();

      return new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();

            // When no more data needs to be consumed, break the reading
            if (done) {
              break;
            }

            // Enqueue the next data chunk into our target stream
            controller.enqueue(value);
            onChunkReceive(decoder.decode(value, { stream: true }));
          }

          // Close the stream
          controller.close();
          reader.releaseLock();
        },
      });
    })
    .then((rs) => new Response(rs))
    .then((response) => response.text());
}

export { fetchStream };

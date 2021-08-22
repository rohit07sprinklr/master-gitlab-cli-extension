function streamBody(body, onChunkReceive) {
  const decoder = new TextDecoder("utf-8");

  return Promise.resolve(body)
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
            const chunkString = decoder.decode(value, { stream: true });
            if (chunkString === "ERROR") {
              throw Error(chunkString);
              return;
            }
            onChunkReceive(chunkString);
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

function fetchStream(url, onChunkReceive) {
  return fetch(url)
    .then((r) => {
      if (r.status >= 400) {
        return r.text().then((text) => {
          throw Error(text);
        });
      }
      return r.body;
    })
    .then((body) => streamBody(body, onChunkReceive));
}

export { fetchStream };
export { streamBody };

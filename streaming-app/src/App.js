import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

function TextBox() {
  const [textStream, setTextStream] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const streamUrl = "http://localhost:4000/chat";

  function handleSubmit(e) {
    e.preventDefault();

    const data = {
      'input': e.target.input.value
    }

    setTextStream("");

    const controller = new AbortController();
    const signal = controller.signal;

    fetch(streamUrl, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
      signal
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.body;
      })
      .then(rb => {
        const reader = rb.getReader();
        return new ReadableStream({
          start(controller) {
            function push() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  setIsFetching(false);
                  return;
                }
                controller.enqueue(value);
                setTextStream(prevTextStream => prevTextStream + new TextDecoder("utf-8").decode(value));
                push();
              });
            }
            push();
          }
        });
      })
      .catch(e => {
        console.error(`Fetch failed: ${e}`);
        setIsFetching(false);
      });
  }

  
  return (
    <div className="flex h-screen w-full flex-col">
      <form method="post" onSubmit={handleSubmit}>
        <div className="flex flex-col m-2 overflow-hidden w-full items-center justify-center">
          <textarea
            placeholder="What is on your mind?"
            className="h-[250px] w-[400px] p-4 block resize-none border rounded-md shadow-md py-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6" name="input"/>
          <div className="flex-shrink-0 m-2">
            <button className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Send</button>
          </div>
        </div>
      </form>
      <div className="flex flex-col m-2 overflow-hidden w-full items-center justify-center">
        <p>Response</p>
        <span className="h-[250px] w-[400px] p-4 block resize-none border rounded-md shadow-md py-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6">
          <p>{textStream}</p>
        </span>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="App">
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Streaming Demo</h1>
      <h4 className="mt-3 text-md font-regular tracking-tight text-slate-400">Front and backend demo of streaming completion from an API</h4>
      <TextBox/>
    </div>
  );
}

export default App;
